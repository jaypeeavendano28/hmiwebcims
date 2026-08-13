import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import {
  PostData,
  blobToDataUrl,
  isNullOrUndefinedOrBlank,
} from '../../helpers';
import { TAppointments, TRadiologyResult } from '../../types';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tabs,
  notification,
} from 'antd';
import useAppStore from '../../store';
import dayjs from 'dayjs';
import axios from 'axios';
import ChargesPerPatient, {
  getResultBlockedMessage,
  isResultBlockedStatus,
} from '../../components/ChargesPerPatient';
import FinalizeForm from '../../components/FinalizeForm';
import { ExistingRadiologyResults } from '../../components/ExistingRadiologyResult';
import { BiArrowBack } from 'react-icons/bi';
import { getCompletedResultsSearch } from '../../helpers/resultNavigation';
import { useQuery } from '@tanstack/react-query';
import AddReqPhysician from '../../components/add-req-physician';
import PatientInfoHeader from '../../components/PatientInfoHeader';
import UploadDocumentButton from '../../components/UploadDocumentButton';
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + '/api/';
const devApi = import.meta.env.VITE_DEV_API + '/api/';
const apiUrl = isDev ? devApi : prodApi;
const onlineResultType = 'XRAY';
const onlineResultDepartmentId = 1001;
const onlineResultDescription = 'Radiology Result';
export const Route = createLazyFileRoute('/_authenticated/xrayresult/$Id')({
  component: () => <XrayResult />,
});
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 18,
      offset: 6,
    },
  },
};
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};
const XrayResult = () => {
  const router = useRouter();
  const [showFinalize, setShowFinalize] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [Key, setKey] = useState<string>(Math.random().toString());
  const [allowSave, setAllowSave] = useState(false);
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeId, setChargeId] = useState(0);
  const [activeCharge, setActiveCharge] = useState<any>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnlineResultShown, setIsOnlineResultShown] = useState(false);
  const [Radiologist, setRadiologist] = useState([]);
  const [radtechs, setRadTechs] = useState([]);
  const [RequestingPhysician, setRequestingPhysician] = useState([]);
  const [IsSaving, setIsSaving] = useState(false);
  const [ResultNo, setResultNo] = useState('');
  const [ResultId, setResultId] = useState(0);
  const [form] = Form.useForm();
  const store = useAppStore();
  const [templates, setTemplates] = useState([]);
  const Id = Route.useParams().Id;
  const search = Route.useSearch() as {
    chargeId?: string | number;
  };
  const requestedChargeId = Number(search.chargeId ?? 0);
  const selectedChargeHandledRef = useRef('');
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();
  const isResultSubmitBlocked = isResultBlockedStatus(activeCharge?.Status);
  const resultSubmitBlockedMessage = getResultBlockedMessage(activeCharge);

  const refreshOnlineResultStatus = async (nextResultId = ResultId) => {
    const id = Number(nextResultId ?? 0);

    if (!Number.isFinite(id) || id <= 0) {
      setIsOnlineResultShown(false);
      return;
    }

    const res = await PostData('GetPdfFileStatus', {
      ResultId: id,
      ResultType: onlineResultType,
    });

    setIsOnlineResultShown(Boolean(res?.parameters?.Shown));
  };

  const handleGetAppointmentDetails = async () => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetAppointmentDetails',
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      setAppointmentDetails(res.parameters.lst[0]);
    }
  };

  const handleSubmitForm = async (values: any) => {
    if (isResultSubmitBlocked) {
      notification.warning({
        message: resultSubmitBlockedMessage,
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    try {
      setIsProcessing(true);
      const valuesToSave = {
        ...values,
        BranchCode: store.branchCode,
        ReportDate: dayjs(values.ReportDate).format(),
        DateXrayed: dayjs(values.DateXrayed).format(),
        DateRead: dayjs(values.DateRead).format(),
        Id: ResultId,
        fk_Appointments_Id: appointmentDetails?.Id,
        fk_Charges_Id: chargeId,
        Department: 'XR',
        ChargeDescription: chargeDescription,
      };

      const res = await PostData('SaveRadiologyResult', valuesToSave);
      if (res) {
        console.log(res);
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: 'Successfully saved!',
            placement: 'topRight',
            duration: 3,
          });

          setIsSaving(false);
          setResultId(res.parameters.Id);
          setResultNo(res.parameters.ResultNo);
          await refreshOnlineResultStatus(res.parameters.Id);
          setKey(Math.random().toString());
        } else {
          setIsProcessing(false);
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setIsProcessing(false);
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const handleOnlineResult = async (v: any) => {
    setShowFinalize(false);
    if (ResultId === 0) {
      notification.error({
        message: 'Please save the result first.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setIsProcessing(true);

    try {
      let res;
      if (isOnlineResultShown) {
        res = await PostData('UnshowPdfFile', {
          ResultId: ResultId,
          ResultType: onlineResultType,
          Username: v.Username,
          Password: v.Password,
        });
      } else {
        const pdf = await blobToDataUrl(await fetchResultPdf());
        res = await PostData('UploadPdfFile', {
          ResultId: ResultId,
          ResultType: onlineResultType,
          fk_Appointments_Id: appointmentDetails?.Id,
          fk_Departments_Id: onlineResultDepartmentId,
          Description: chargeDescription.trim() || onlineResultDescription,
          ShowInCompanyPortal: 'Y',
          Pdf: pdf,
          Username: v.Username,
          Password: v.Password,
        });
      }

      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: isOnlineResultShown
              ? 'Result hidden from online results.'
              : 'Result shown to online results.',
            placement: 'topRight',
            duration: 3,
          });
          await refreshOnlineResultStatus(ResultId);
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setIsProcessing(false);
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const handleDeleteResult = async () => {
    try {
      setIsProcessing(true);
      const res = await PostData('DeleteResult', {
        Id: ResultId,
        Table: 'XRAY',
      });

      if (res?.status === 1) {
        notification.success({
          message: 'Result successfully deleted!',
          placement: 'topRight',
          duration: 3,
        });
        setAllowSave(false);
        setChargeId(0);
        setChargeDescription('');
        setResultId(0);
        setResultNo('');
        setIsFinalized(false);
        setIsOnlineResultShown(false);
        form.resetFields();
        setKey(Math.random().toString());
      } else {
        notification.error({
          message: res?.message ?? 'Unable to delete result.',
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  useQuery({
    queryKey: ['requesting-physicians'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });

      const requestingPhysicians = res.parameters.lst;
      setRequestingPhysician(requestingPhysicians);
    },
    refetchOnWindowFocus: false,
  });

  const handleInitialize = async () => {
    let res: any;
    // let res = await PostData('GetRecords', {
    //   sp: 'udp_GetDoctors',
    //   parameters: {},
    // });
    // if (res) {
    //   const requestingPhysicians = res.parameters.lst;
    //   setRequestingPhysician(requestingPhysicians);

    //   if (
    //     requestingPhysicians.some(
    //       (doctor: any) =>
    //         getPositiveNumber(doctor.Id) === DEFAULT_REQUESTING_PHYSICIAN_ID,
    //     ) &&
    //     isNullOrUndefinedOrBlank(form.getFieldValue('RequestingPhysician'))
    //   ) {
    //     form.setFieldValue(
    //       'RequestingPhysician',
    //       DEFAULT_REQUESTING_PHYSICIAN_ID,
    //     );
    //   }
    // }

    res = await PostData('GetRecords', {
      sp: 'udp_GetListOfRadiologist',
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      setRadiologist(res.parameters.lst);
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetListOfMedtechs',
      parameters: {
        Type: 'R',
      },
    });
    if (res) {
      setRadTechs(res.parameters.lst);
    }
  };
  const fetchResultPdf = async () => {
    const url = apiUrl + 'radiologyresult/' + ResultId + '/xray.rdl/N';
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'blob',
    });

    return new Blob([response.data], {
      type: 'application/pdf',
    });
  };

  const handlePrint = async (isPrint: boolean = false) => {
    setIsProcessing(true);
    const isDownload = false;
    try {
      const newBlob = await fetchResultPdf();
      if (isDownload === false) {
        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement('a');
        if (isPrint === true) {
          a.setAttribute('href', data);
          a.setAttribute('target', '_blank');

          a.click();
        }

        setIsProcessing(false);
      } else {
        const downloadBlob = new Blob([newBlob], {
          type: 'application/excel',
        });
        const a = document.createElement('a');
        document.body.appendChild(a);
        const url = window.URL.createObjectURL(downloadBlob);
        a.href = url;
        a.download = 'download.xls';
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 0);
        setIsProcessing(false);
      }
    } catch (error: any) {
      setIsProcessing(false);
      const errorMessage = error.response?.data?.text
        ? JSON.parse(await error.response.data.text()).Message
        : error.message;
      notification.error({
        message: errorMessage,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const handleGetTemplate = async (e: any) => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetTemplateByDoctor',
        parameters: {
          Department: 'XR',
          DoctorId: e,
        },
      });
      if (res) {
        setTemplates(res.parameters.lst);
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const handleChangeTemplate = (v: any) => {
    const t = templates.filter((f: any) => f.Id === v);
    const x: any = t[0];

    form.setFieldsValue({
      Findings: x.Findings,
      Impression: x.Impression,
      Note: x.Note,
    });
  };
  const handleOpenResult = async (Id: number) => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetRadiologyResult',
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      const r: TRadiologyResult = res.parameters.lst[0];
      console.log(r);
      setResultId(r.Id);
      setResultNo(r.ResultNo!);
      setChargeId(r.fk_Charges_Id!);
      setChargeDescription(r.ChargeDescription!);
      form.setFieldsValue({
        ReportDate: dayjs(r.ReportDate),
        DateXrayed: dayjs(r.DateXrayed),
        DateRead: dayjs(r.DateRead),
        StudyNo: r.StudyNo,
        RequestingPhysician: r.RequestingPhysician,
        Rad1: r.Rad1,
        Rad2: r.Rad2,
        Rad3: r.Rad3,
        Findings: r.Findings,
        Impression: r.Impression,
        Note: r.Note,
        RadTech: r.RadTech,
        FinalizedBy: r.FinalizedBy,
        DateFinalized: r.DateFinalized,
      });

      handleGetTemplate(r.Rad1);
      form.setFieldValue('Template', r.Template);
      setAllowSave(true);
      if (!isNullOrUndefinedOrBlank(r.FinalizedBy)) {
        setIsFinalized(true);
      } else {
        setIsFinalized(false);
      }
      await refreshOnlineResultStatus(r.Id);
    }
  };
  const handleNewResult = async (v: any) => {
    setActiveCharge(v);
    if (isNullOrUndefinedOrBlank(v.ResultId)) {
      setAllowSave(true);
      setChargeId(v.Id);
      setChargeDescription(v.Description);

      form.resetFields();
      form.setFieldsValue({
        DateXrayed: dayjs(),
        DateRead: dayjs(),
        ReportDate: dayjs(),
      });
      setResultNo('');
      setResultId(0);
      setIsFinalized(false);
      setIsOnlineResultShown(false);
    } else {
      handleOpenResult(v.ResultId);
      setResultId(v.ResultId);
    }
  };
  useEffect(() => {
    handleGetAppointmentDetails();
    handleInitialize();
    setKey(Math.random().toString());
  }, []);
  useEffect(() => {
    if (!Number.isFinite(requestedChargeId) || requestedChargeId <= 0) {
      return;
    }

    const chargeKey = `${Id}:${requestedChargeId}`;
    if (selectedChargeHandledRef.current === chargeKey) {
      return;
    }
    selectedChargeHandledRef.current = chargeKey;

    const openSelectedCharge = async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentIdForResult',
        parameters: {
          AppointmentId: Number(Id),
        },
      });
      const selectedCharge = res?.parameters?.lst?.find(
        (charge: any) => Number(charge.Id) === requestedChargeId,
      );

      if (selectedCharge) {
        await handleNewResult(selectedCharge);
      }
    };

    void openSelectedCharge();
  }, [Id, requestedChargeId]);
  return (
    <div className="cardBackGround">
      <PatientInfoHeader
        appointmentId={appointmentDetails?.Id}
        patientId={appointmentDetails?.fk_PatientInformation_Id}
        name={appointmentDetails?.Name}
        age={[
          appointmentDetails?.AgeYears ? `${appointmentDetails.AgeYears}Y` : '',
          appointmentDetails?.AgeMonths
            ? `${appointmentDetails.AgeMonths}M`
            : '',
          appointmentDetails?.AgeDays ? `${appointmentDetails.AgeDays}D` : '',
        ]
          .filter(Boolean)
          .join('')}
        sex={appointmentDetails?.Sex}
        appointmentNo={appointmentDetails?.AppointmentNo}
      />
      <Divider>X-Ray Result</Divider>
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="col-span-3">
          <div className="mt-2">
            <Space wrap>
              <Button
                className="mb-2"
                icon={<BiArrowBack />}
                onClick={() =>
                  router.navigate({
                    to: '/registeredpatients/$station',
                    params: { station: '1' },
                    search: getCompletedResultsSearch(),
                  })
                }
              >
                Back
              </Button>
              <UploadDocumentButton
                patientId={appointmentDetails?.fk_PatientInformation_Id}
                appointmentId={appointmentDetails?.Id}
                departmentId={onlineResultDepartmentId}
              />
            </Space>
            <Divider>Charges</Divider>

            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  label: 'Charges',
                  key: '1',
                  children: (
                    <ChargesPerPatient
                      AppointmentId={appointmentDetails?.Id}
                      handleNewResult={handleNewResult}
                      Key={Key}
                      Counter={['XRAY']}
                      activeChargeId={chargeId}
                      onActiveChargeChange={setActiveCharge}
                    />
                  ),
                },
                {
                  label: 'Existing Results',
                  key: '2',
                  children: (
                    <ExistingRadiologyResults
                      PatientId={appointmentDetails?.fk_PatientInformation_Id}
                      AppointmentId={appointmentDetails?.Id}
                      handleOpen={(data) => handleOpenResult(data.Id)}
                      counter="XRAY"
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
        <div className="col-span-9">
          <h1 className="text-center font-bold">
            X-ray Result for - {chargeDescription}
          </h1>

          <Form
            {...formItemLayout}
            form={form}
            onFinish={handleSubmitForm}
            scrollToFirstError
          >
            <Form.Item label="Result Id." name="ResultId">
              <strong>{ResultId}</strong>
            </Form.Item>

            <Form.Item label="Result No." name="ResultNo">
              <strong>{ResultNo}</strong>
            </Form.Item>
            <Form.Item
              label="Date of procedure done"
              name="ReportDate"
              rules={[
                {
                  required: true,
                  message: 'Report date is required!',
                },
              ]}
            >
              <DatePicker format="MM/DD/YYYY" />
            </Form.Item>
            {/* <Form.Item
              label="Date of Result Read"
              name="DateXrayed"
              rules={[
                {
                  required: true,
                  message: "Date x-rayed is required!",
                },
              ]}
            >
              <DatePicker showTime format="MM/DD/YYYY hh:mm A" />
            </Form.Item> */}
            <Form.Item
              label="Date of Result Read"
              name="DateRead"
              rules={[
                {
                  required: true,
                  message: 'Date of result read is required!',
                },
              ]}
            >
              <DatePicker format="MM/DD/YYYY" />
            </Form.Item>

            {/* <Form.Item
              label="Xray No."
              name="XrayNo"
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item> */}
            <Form.Item
              label="Patient No."
              name="StudyNo"
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>

            <div className="flex gap-x-1 ">
              <Form.Item
                label="Requesting Physician"
                name="RequestingPhysician"
                className="flex-grow"
              >
                <Select
                  showSearch
                  allowClear
                  filterOption={(inputValue, option: any) =>
                    option.title
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                >
                  {RequestingPhysician.map((d: any) => (
                    <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                      {d.Name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <AddReqPhysician />
            </div>
            <Form.Item
              label="Rad. Technologist"
              name="RadTech"
              rules={[
                {
                  required: true,
                  message: 'Rad. Technologist is required!',
                },
              ]}
            >
              <Select
                showSearch
                allowClear
                filterOption={(inputValue, option: any) =>
                  option.title
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {radtechs.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Radiologist 1"
              name="Rad1"
              rules={[
                {
                  required: true,
                  message: 'Radiologist 1 is required!',
                },
              ]}
            >
              <Select
                showSearch
                allowClear
                filterOption={(inputValue, option: any) =>
                  option.title
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
                onChange={handleGetTemplate}
              >
                {Radiologist.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Radiologist 2" name="Rad2">
              <Select
                showSearch
                allowClear
                filterOption={(inputValue, option: any) =>
                  option.title
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {Radiologist.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            {/* <Form.Item label="Radiologist 3" name="Rad3">
              <Select
                showSearch
                allowClear
                filterOption={(inputValue, option: any) =>
                  option.title
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {Radiologist.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item> */}

            <Form.Item label="Template" name="Template">
              <Select onChange={handleChangeTemplate}>
                {templates.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Examination} value={d.Id}>
                    {d.Examination}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Findings" name="Findings">
              <Input.TextArea rows={20} />
            </Form.Item>
            <Form.Item label="Impression" name="Impression">
              <Input.TextArea rows={20} />
            </Form.Item>
            <Form.Item label="Note" name="Note">
              <Input.TextArea rows={10} />
            </Form.Item>
            {isFinalized && (
              <>
                <Form.Item label="Finalized By" name="FinalizedBy">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="Date Finalized" name="DateFinalized">
                  <Input readOnly />
                </Form.Item>
              </>
            )}
            <Form.Item {...tailFormItemLayout}>
              <div className="flex justify-between">
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    // disabled={IsSaving || ReportStatus === "F"}

                    disabled={
                      !allowSave ||
                      isFinalized ||
                      isOnlineResultShown ||
                      isResultSubmitBlocked
                    }
                    loading={isProcessing || IsSaving}
                  >
                    Submit
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      handlePrint(true);
                    }}
                    loading={isProcessing}
                    // disabled={IsSaving || ReportStatus === "F"}
                    disabled={ResultId === 0}
                  >
                    Print
                  </Button>
                </Space>
                <Space>
                  <Popconfirm
                    title="Cancel Changes"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => {
                      setAllowSave(false);
                      setChargeId(0);
                      setChargeDescription('');
                      setResultId(0);
                      setResultNo('');
                      setIsOnlineResultShown(false);
                      form.resetFields();
                    }}
                  >
                    <Button
                      disabled={!allowSave || isOnlineResultShown}
                      type="primary"
                    >
                      Cancel Changes
                    </Button>
                  </Popconfirm>
                  <Button
                    type="primary"
                    onClick={() => {
                      setShowFinalize(true);
                    }}
                    loading={isProcessing}
                    disabled={ResultId === 0}
                  >
                    {isOnlineResultShown
                      ? 'Unshow Online Result'
                      : 'Show to Online Results'}
                  </Button>

                  <Popconfirm
                    title="Delete Result"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={handleDeleteResult}
                  >
                    <Button
                      type="primary"
                      danger
                      loading={isProcessing}
                      disabled={ResultId === 0 || isFinalized}
                    >
                      Delete Result
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
      <ExistingRadiologyResults
        PatientId={appointmentDetails?.fk_PatientInformation_Id}
        handleOpen={() => {}}
        counter="XRAY"
      />
      <Modal
        open={showFinalize}
        destroyOnClose
        onCancel={() => setShowFinalize(false)}
        footer={false}
      >
        <FinalizeForm
          handleFinalizeResult={handleOnlineResult}
          title={
            isOnlineResultShown
              ? 'Unshow Online Result'
              : 'Show to Online Results'
          }
          submitText={isOnlineResultShown ? 'Unshow' : 'Show'}
        />
      </Modal>
    </div>
  );
};
