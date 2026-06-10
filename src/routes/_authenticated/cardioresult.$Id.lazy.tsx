import { createLazyFileRoute } from '@tanstack/react-router';
import { PostData, isNullOrUndefinedOrBlank } from '../../helpers';
import { TAppointments, TDoctors } from '../../types';
import { useEffect, useState } from 'react';
import { getInstance } from '@syncfusion/ej2-base';
import {
  PdfViewerComponent,
  Toolbar,
  Magnification,
  Navigation,
  LinkAnnotation,
  BookmarkView,
  ThumbnailView,
  Print,
  TextSelection,
  Annotation,
  TextSearch,
  FormFields,
  FormDesigner,
  Inject,
} from '@syncfusion/ej2-react-pdfviewer';
import {
  AutoComplete,
  Button,
  DatePicker,
  DatePickerProps,
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
import ChargesPerPatient from '../../components/ChargesPerPatient';
import FinalizeForm from '../../components/FinalizeForm';
import { ExistingCadioResults } from '../../components/ExistingCardioResult';

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + '/api/';
const devApi = import.meta.env.VITE_DEV_API + '/api/';
const apiUrl = isDev ? devApi : prodApi;

export const Route = createLazyFileRoute('/_authenticated/cardioresult/$Id')({
  component: () => <CardioResult />,
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
function CardioResult() {
  let viewer: PdfViewerComponent | null;
  const [Interpretation, setInterprestation] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [showFinalize, setShowFinalize] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [Key, setKey] = useState<string>(Math.random().toString());
  const [allowSave, setAllowSave] = useState(false);
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeId, setChargeId] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [Radiologist, setRadiologist] = useState([]);
  const [RequestingPhysician, setRequestingPhysician] = useState([]);
  const [IsSaving, setIsSaving] = useState(false);
  const [ResultId, setResultId] = useState(0);
  const [pdfFIle, setPdfFile] = useState('');
  const [CardioKeywords, setCardioKeywords] = useState<any[]>([]);
  const [form] = Form.useForm();
  const store = useAppStore();

  const Id = Route.useParams().Id;
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();
  const templates = [
    {
      Description: '2D-Echo Report',
      TemplateName: '2decho.pdf',
    },
    {
      Description: 'ECG Report',
      TemplateName: 'ecgreport.pdf',
    },
    {
      Description: 'Treadmill Report',
      TemplateName: 'treadmill.pdf',
    },
  ];

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

  const handleGetCardioKeywords = async () => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetCardioKeywords',
      parameters: {},
    });
    if (res) {
      setCardioKeywords(
        Array.isArray(res.parameters.lst) ? res.parameters.lst : [],
      );
    }
  };

  const ajaxRequestInitiate = (args: any) => {
    if (viewer?.serverActionSettings.load === 'Load') {
      args.JsonData['PatientName'] = appointmentDetails?.Name;

      viewer!.setJsonData(args.JsonData);
    }
  };
  async function handleSubmitForm() {
    setIsSaving(true);
    let viewer1: any = getInstance(
      document.getElementById('container')!,
      PdfViewerComponent,
    );

    var x = viewer1.formFieldCollection;

    var obj: any = [];
    x.forEach((e: any) => {
      obj.push({ name: e.name, value: e.value });
    });
    var a = JSON.stringify(obj);
    const res = await PostData('SaveCardiologyResult', {
      AdmissionId: Id,
      Result: a,
      ChargeId: chargeId,
      Template: form.getFieldValue('Template'),
      Id: ResultId,
      ChargeDescription: chargeDescription,
      DateOfExamination: dayjs(form.getFieldValue('DateOfExamination')).format(
        'YYYY-MM-DD',
      ),
      RequestingPhysician: form.getFieldValue('RequestingPhysician'),
      Cardiologist: form.getFieldValue('Cardiologist'),
    });
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: 'Result Successfully saved!',
          placement: 'topRight',
          duration: 5,
        });
        setResultId(res.message);
        setKey(Math.random().toString());
        setIsSaving(false);
      } else {
        setIsSaving(false);
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 5,
        });
      }
    }
    try {
    } catch (error: any) {
      console.error(error);
    }
  }
  const handleFinalizeResult = async (v: any) => {
    setShowFinalize(false);
    setIsProcessing(true);
    const res = await PostData('FinalizedCardiologyResult', {
      Id: ResultId,
      Username: v.Username,
      Password: v.Password,
      Mode: isFinalized ? 'U' : 'F',
    });

    try {
      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: isFinalized
              ? 'Result successfully un-finalized!'
              : 'Result successfully finalized!',
            placement: 'topRight',
            duration: 3,
          });

          setIsFinalized(!isFinalized);
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
  const handleInitialize = async () => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetDoctors',
      parameters: {},
    });
    if (res) {
      setRequestingPhysician(res.parameters.lst);
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetListOfCardiologist',
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      setRadiologist(res.parameters.lst);
    }
  };
  const handlePrint = async () => {
    setIsProcessing(true);
    viewer!.print.print();
    setIsProcessing(false);
  };

  const handleOpenResult = async (Id: any) => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetCardiologyResult',
      parameters: {
        Id: Id,
      },
    });

    if (res) {
      const r: any = res.parameters.lst[0];
      form.setFieldsValue({
        FinalizedBy: r.FinalizedBy,
        DateFinalized: r.DateFinalized,
        Cardiologist: r.Cardiologist,
        RequestingPhysician: r.RequestingPhysician,
        DateOfExamination: dayjs(r.DateOfExamination),
      });
      setChargeDescription(r.ChargeDescription);

      setResultId(r.Id);
      setChargeId(r.ChargeId!);
      setChargeDescription(r.ChargeDescription!);

      setAllowSave(true);

      if (r.FinalizedBy === '') {
        setIsFinalized(false);
      } else {
        setIsFinalized(true);
      }
      setResult(JSON.parse(r.Result));
      form.setFieldsValue({
        Template: r.Template,
      });
      handleChangeTemnplate(r.Template);
    }
  };

  const handleSetResults = async () => {
    var formFields = await viewer!.retrieveFormFields();
    if (formFields) {
      result.forEach((e: any) => {
        formFields.forEach((element: any, index: any) => {
          if (element.name === e.name) {
            formFields[index].value = e.value;
            viewer!.updateFormFieldsValue(formFields[index]);
          }
        });
      });
    }
  };
  const handleNewResult = async (v: any) => {
    if (isNullOrUndefinedOrBlank(v.ResultId)) {
      setAllowSave(true);
      setChargeId(v.Id);
      setChargeDescription(v.Description);

      form.resetFields();
      form.setFieldsValue({
        DateXrayed: dayjs(),
        DateRead: dayjs(),
        ReportDate: dayjs(),
        DateOfExamination: dayjs(),
      });
      setResultId(0);
      setIsFinalized(false);
    } else {
      handleOpenResult(v.ResultId);
    }
  };
  const handleChangeTemnplate = (e: any) => {
    if (!isNullOrUndefinedOrBlank(e)) {
      setPdfFile(e);
      handleFillFields();
      setAllowSave(true);
    }
  };
  const handleChangeDateOfExamination: DatePickerProps['onChange'] = async (
    dateString,
  ) => {
    var formFields = await viewer!.retrieveFormFields();
    formFields.forEach((element, index) => {
      if (element.name === 'DateOfExamination') {
        formFields[index].value = dayjs(dateString).format('MM/DD/YYYY');
        viewer!.updateFormFieldsValue(formFields[index]);
      }
    });
  };

  const handleFillFields = async () => {
    var formFields = await viewer!.retrieveFormFields();

    if (formFields) {
      formFields.forEach((element, index) => {
        if (element.name === 'PatientName') {
          formFields[index].value = appointmentDetails?.Name;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'Age') {
          formFields[index].value = appointmentDetails?.AgeYears;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'ContactNo') {
          formFields[index].value = appointmentDetails?.ContactNos;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'Gender') {
          formFields[index].value = appointmentDetails?.Sex;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'DateOfExamination') {
          formFields[index].value = dayjs(
            form.getFieldValue('DateOfExamination'),
          ).format('MM/DD/YYYY');
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'RequestingPhysician') {
          const x: TDoctors = RequestingPhysician.filter(
            (f: TDoctors) => f.Id === form.getFieldValue('RequestingPhysician'),
          )[0];
          formFields[index].value = x.Name;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'Diagnosis') {
          formFields[index].value = appointmentDetails?.Diagnosis;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'Cardiologist') {
          const x: TDoctors = Radiologist.filter(
            (f: TDoctors) => f.Id === form.getFieldValue('Cardiologist'),
          )[0];
          formFields[index].value = x.Name;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'LicenseNo') {
          const x: TDoctors = Radiologist.filter(
            (f: TDoctors) => f.Id === form.getFieldValue('Cardiologist'),
          )[0];
          formFields[index].value = x.LicNo;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'Company') {
          formFields[index].value =
            appointmentDetails?.HmoCompanyName?.toString() ?? '';
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === 'Interpretation') {
          formFields[index].value = Interpretation;
          viewer!.updateFormFieldsValue(formFields[index]);
        }
      });
    }
  };

  const handleSetInterpretationField = async (value: string) => {
    if (!viewer) {
      return;
    }

    const pdfViewer = viewer;
    const formFields = await pdfViewer.retrieveFormFields();
    formFields?.forEach((element, index) => {
      if (element.name === 'Interpretation') {
        formFields[index].value = value;
        pdfViewer.updateFormFieldsValue(formFields[index]);
      }
    });
  };

  useEffect(() => {
    handleGetAppointmentDetails();
    handleInitialize();
    setKey(Math.random().toString());
    handleGetCardioKeywords();
  }, []);
  useEffect(() => {
    handleFillFields();
  }, [pdfFIle]);
  useEffect(() => {
    handleFillFields();
  }, [Interpretation]);

  // useEffect(() => {
  //   if (result !== null) {
  //     handleSetResults();
  //   }
  // }, [result]);
  const handleDocumentLoaded = () => {
    console.log('Doc loaded');

    if (result !== null) {
      handleSetResults();
    }
  };

  const handleDelete = async () => {
    const res = await PostData('DeleteCardiologyResult', {
      Id: Id,
      ChargeId: chargeId,
    });

    if (res) {
      if (res.status === 1) {
        location.reload();
      } else {
        notification.error({
          message: 'Sucessfully deleted!',
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };
  return (
    <div className="cardBackGround">
      <div className="grid lg:grid-cols-3">
        <div>
          <p>Name</p>
          <p className="font-bold">{appointmentDetails?.Name}</p>
        </div>
        <div>
          <p>Age</p>
          <p className="font-bold">
            {appointmentDetails?.AgeYears}Y{appointmentDetails?.AgeMonths}M
            {appointmentDetails?.AgeDays}D
          </p>
        </div>
        <div>
          <p>Sex</p>
          <p className="font-bold">{appointmentDetails?.Sex}</p>
        </div>
      </div>
      <Divider>Cardiology Department Result</Divider>
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="col-span-3">
          <div className="mt-2">
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
                      Counter="CARDIO"
                    />
                  ),
                },
                {
                  label: 'Existing Results',
                  key: '2',
                  children: (
                    <ExistingCadioResults
                      PatientId={appointmentDetails?.fk_PatientInformation_Id}
                      AppointmentId={appointmentDetails?.Id}
                      handleOpen={(data) => handleOpenResult(data.Id)}
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
        <div className="col-span-9">
          <h1 className="text-center font-bold">
            Cardiology Result for - {chargeDescription}
          </h1>
          {/* Templates */}
          <div></div>

          <Form
            {...formItemLayout}
            form={form}
            onFinish={handleSubmitForm}
            scrollToFirstError
          >
            <Form.Item label="Result Id." name="ResultId">
              <strong>{ResultId}</strong>
            </Form.Item>
            {/* 
            <Form.Item label="Result No." name="ResultNo">
              <strong>{ResultNo}</strong>
            </Form.Item> */}

            <Form.Item label="Template" name="Template">
              <Select onChange={handleChangeTemnplate} disabled={ResultId != 0}>
                {templates.map((d: any) => (
                  <Select.Option
                    key={d.Id}
                    title={d.Description}
                    value={d.TemplateName}
                  >
                    {d.Description}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Date Of Examination"
              name="DateOfExamination"
              rules={[
                {
                  required: true,
                  message: 'Report date is required!',
                },
              ]}
            >
              <DatePicker
                onChange={handleChangeDateOfExamination}
                format="MM/DD/YYYY"
              />
            </Form.Item>

            <Form.Item label="Requesting Physician" name="RequestingPhysician">
              <Select
                showSearch
                allowClear
                filterOption={(inputValue, option: any) =>
                  option.title
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
                onChange={handleFillFields}
              >
                {RequestingPhysician.map((d: any) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Cardiologist"
              name="Cardiologist"
              rules={[
                {
                  required: true,
                  message: 'Cardiologist is required!',
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
                onChange={handleFillFields}
              >
                {Radiologist.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {pdfFIle === 'ecgreport.pdf' && (
              <Form.Item label="Keywords" name="Keywords">
                <AutoComplete
                  showSearch
                  allowClear
                  filterOption={(inputValue, option: any) =>
                    (option?.title ?? option?.value ?? '')
                      .toString()
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                  onKeyDown={(e: any) => {
                    if (e.key === 'Tab') {
                      const interpretation =
                        Interpretation + e.target.value + '\n';
                      setInterprestation(interpretation);
                      handleSetInterpretationField(interpretation);
                      form.setFieldValue('Keywords', '');
                    }
                  }}
                  onSelect={(value) => {
                    const interpretation = Interpretation + value + '\n';
                    setInterprestation(interpretation);
                    handleSetInterpretationField(interpretation);
                    form.setFieldValue('Keywords', '');
                  }}
                >
                  {CardioKeywords.map((d: any) => (
                    <Select.Option
                      key={d.Id}
                      title={d.Description ?? ''}
                      value={d.Description ?? ''}
                    >
                      {d.Legend}
                    </Select.Option>
                  ))}
                </AutoComplete>
              </Form.Item>
            )}
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

                    disabled={!allowSave || isFinalized}
                    loading={isProcessing || IsSaving}
                  >
                    Submit
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      handlePrint();
                    }}
                    loading={isProcessing}
                    // disabled={IsSaving || ReportStatus === "F"}
                    disabled={ResultId === 0 || !isFinalized}
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
                      form.resetFields();
                    }}
                  >
                    <Button disabled={!allowSave} type="primary">
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
                    {isFinalized ? 'Un-Finalize Result' : 'Finalize Result'}
                  </Button>

                  <Popconfirm
                    title="Delete this result?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => {
                      handleDelete();
                    }}
                  >
                    <Button
                      type="primary"
                      danger
                      disabled={ResultId === 0 || isFinalized === false}
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

      <PdfViewerComponent
        id="container"
        ref={(scope) => {
          viewer = scope;
        }}
        documentPath={pdfFIle}
        serviceUrl={apiUrl + 'pdfviewer'}
        ajaxRequestInitiate={ajaxRequestInitiate}
        enableFormFieldsValidation={true}
        showNotificationDialog={false}
        style={{ height: '640px' }}
        enableInkAnnotation={false}
        enableToolbar={false}
        enableAnnotation={false}
        enableDownload={true}
        documentLoad={handleDocumentLoaded}
      >
        <Inject
          services={[
            Toolbar,
            Magnification,
            Navigation,
            Annotation,
            LinkAnnotation,
            BookmarkView,
            ThumbnailView,
            Print,
            TextSelection,
            TextSearch,
            FormDesigner,
            FormFields,
          ]}
        />
      </PdfViewerComponent>
      <Modal
        open={showFinalize}
        destroyOnClose
        onCancel={() => setShowFinalize(false)}
        footer={false}
      >
        <FinalizeForm handleFinalizeResult={handleFinalizeResult} />
      </Modal>
    </div>
  );
}
