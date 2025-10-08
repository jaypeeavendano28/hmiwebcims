import { createLazyFileRoute } from "@tanstack/react-router";
import { PostData, WithAccess, isNullOrUndefinedOrBlank } from "../../helpers";
import {
  TAppointments,
  TLaboratoryResultMain,
  TLaboratoryResultTemplates,
} from "../../types";
import { useEffect, useState } from "react";
import {
  AutoComplete,
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
} from "antd";
import useAppStore from "../../store";
import { round } from "lodash";
import LabResult from "../../components/LabResult";
import dayjs from "dayjs";
import axios from "axios";
import ChargesPerPatient from "../../components/ChargesPerPatient";
import ExistingLabResults from "../../components/ExistingLabResults";
import FinalizeForm from "../../components/FinalizeForm";
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + "/api/";
const devApi = import.meta.env.VITE_DEV_API + "/api/";
const apiUrl = isDev ? devApi : prodApi;
export const Route = createLazyFileRoute(
  "/_authenticated/laboratoryresults/$Id"
)({
  component: () => <LaboratoryResults />,
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

const LaboratoryResults = () => {
  const [allowSave, setAllowSave] = useState(false);
  const [key, setKey] = useState(Math.random().toString());
  const [isFinalized, setIsFinalized] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [specimen, setSpecimen] = useState([]);
  const [branchDetails, setBranchDetails] = useState({});
  // const [Remarks, setRemarks] = useState([]);
  const [Medtechs, setMedtechs] = useState([]);
  const [Pathologist, setPathologist] = useState([]);
  const [RequestingPhysician, setRequestingPhysician] = useState([]);
  const [IsSaving, setIsSaving] = useState(false);
  const [ResultNo, setResultNo] = useState("");
  const [ResultId, setResultId] = useState(0);
  const [rowsCol1, setRowsCol1] = useState([]);
  const [form] = Form.useForm();
  const [form1] = Form.useForm();
  const store = useAppStore();
  const [templates, setTemplates] = useState<
    TLaboratoryResultTemplates[] | undefined
  >();
  const Id = Route.useParams().Id;
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();
  const handleOpenResult = async (Id: number) => {
    setResultId(Id);
    let res = await PostData("GetRecords", {
      sp: "udp_GetLabResultMain",
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      const x: TLaboratoryResultMain = res.parameters.lst[0];
      form1.setFieldValue("Template", x.fk_LaboratoryResultTemplates_Id);
      form.setFieldsValue({
        ReportDate: dayjs(x.ReportDate),
        DateReceived: dayjs(x.DateReceived),
        Pathologist: x.Pathologist,
        Medtech: x.Medtech,
        ResultNo: x.ResultNo,
        RequestingPhysician: x.RequestingPhysician,
        Specimen: x.Specimen,
        Remarks: x.Remarks,
        LabNo: x.LabNo,
        FinalizedBy: x.FinalizedBy,
        DateFinalized: x.DateFinalized,
      });

      if (!isNullOrUndefinedOrBlank(x.FinalizedBy)) {
        setIsFinalized(true);
        setAllowSave(false);
      } else {
        setIsFinalized(false);
        setAllowSave(true);
      }
    }
    res = await PostData("GetRecords", {
      sp: "udp_GetLabResultMain",
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      const x: TLaboratoryResultMain = res.parameters.lst[0];
      form1.setFieldValue("Template", x.fk_LaboratoryResultTemplates_Id);
      form.setFieldsValue({
        ReportDate: dayjs(x.ReportDate),
        DateReceived: dayjs(x.DateReceived),
        DateCollected: isNullOrUndefinedOrBlank(x.DateCollected)
          ? undefined
          : dayjs(x.DateCollected),
        Pathologist: x.Pathologist,
        Medtech: x.Medtech,
        ResultNo: x.ResultNo,
        RequestingPhysician: x.RequestingPhysician,
        Specimen: x.Specimen,
        Remarks: x.Remarks,
      });
    }
    res = await PostData("GetRecords", {
      sp: "udp_GetLabResultDetails",
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      setRowsCol1(res.parameters.lst);
    }
  };
  const handleGetAppointmentDetails = async () => {
    let res = await PostData("GetRecords", {
      sp: "udp_GetAppointmentDetails",
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      setAppointmentDetails(res.parameters.lst[0]);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetLaboratoryResultTemplates2",
      parameters: {
        BranchCode: store.branchCode,
        AppointmentId: Id,
      },
    });
    if (res) {
      setTemplates(res.parameters.lst);
    }
  };
  const handleNew =  () => {
    if (isNullOrUndefinedOrBlank(form1.getFieldValue("Template"))) {
      notification.error({
        message: "Please select a template!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }
    handleLoadTemplate();
    form.resetFields();
    form.setFieldsValue({
      ReportDate: dayjs(),
      DateReceived: dayjs(),
      TemplateId: form1.getFieldValue("Template"),
    });
    setResultNo("");
    setResultId(0);
    setIsFinalized(false);
    setAllowSave(true);
  };
  const handleLoadTemplate = async () => {
    setRowsCol1([]);

    const res = await PostData("GetRecords", {
      sp: "udp_GetLaboratoryResultTemplate",
      parameters: {
        TemplateId: form1.getFieldValue("Template"),
        PatientId: appointmentDetails?.fk_PatientInformation_Id,
        Barcode: "",
        ChargeId: "",
        AppointmentId: appointmentDetails?.Id,
      },
    });
    if (res) {
      setRowsCol1(res.parameters.lst);
    }
  };
  const handleSaveResult = async (x: any) => {
    const data: any = [...rowsCol1];
    const index = data.findIndex((obj: any) => obj.Id === x.Id);
    data[index].Flag = "";
    if (
      !isNullOrUndefinedOrBlank(data[index].IsFrom) &&
      !isNullOrUndefinedOrBlank(data[index].IsTo)
    ) {
      if (data[index].ShowHighLow === "Y" && x.ResultSi > 0) {
        if (x.ResultSi < data[index].IsFrom) {
          data[index].Flag = "L";
        } else if (x.ResultSi > data[index].IsTo) {
          data[index].Flag = "H";
        }
      }
    }

    if (
      !isNullOrUndefinedOrBlank(data[index].Conversion) &&
      !isNullOrUndefinedOrBlank(x.ResultSi)
    ) {
      if (Number(data[index].Conversion) > 0) {
        data[index].ResultConventional = round(
          Number(x.ResultSi) * Number(data[index].Conversion),
          2
        );
      }
    }
    data[index].ResultSi = x.ResultSi;
    data[index].ShowInPrintOut = x.ShowInPrintOut;

    setRowsCol1(data);
  };
  const handleSubmitForm = async (values: any) => {
    console.log(rowsCol1);
    try {
      const valuesToSave = {
        Main: {
          ...values,
          BranchCode: store.branchCode,
          ReportDate: dayjs(new Date()).format("YYYY-MM-DD"),
          DateReceived: dayjs(values.DateReceived).format("YYYY-MM-DD"),
          fk_tblPatientInformation_PatientId:
            appointmentDetails?.fk_PatientInformation_Id,
          Id: ResultId,
          fk_tblChargesMain_ChargeId: "",
          fk_LaboratoryResultTemplates_Id: form1.getFieldValue("Template"),
          Username: store.username,
          ResultNo: ResultNo,
          AdmissionId: appointmentDetails?.Id,
      
        },
        Details: rowsCol1,
      };
      setIsProcessing(true);
      const res = await PostData("SaveLaboratoryResultNew", valuesToSave);
      if (res) {
        setIsProcessing(false);
        if (res.result.status === 1) {
          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });

          setIsSaving(false);
          setResultId(res.result.parameters.ResultId);
          setResultNo(res.result.parameters.ResultNo);
          setKey(Math.random().toString());
        } else {
          setIsProcessing(false);
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setIsProcessing(false);
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };

  const handleInitialize = async () => {
    let res = await PostData("GetRecords", {
      sp: "udp_GetDoctors",
      parameters: {},
    });
    if (res) {
      setRequestingPhysician(res.parameters.lst);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetListOfMedtechs",
      parameters: {
        BranchCode: store.branchCode,
        Type: "M",
      },
    });
    if (res) {
      setMedtechs(res.parameters.lst);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetListOfPathologist",
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      setPathologist(res.parameters.lst);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetBranchDetails",
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      setBranchDetails(res.parameters.lst[0]);
      console.log(branchDetails);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetSpecimen",
      parameters: {},
    });
    if (res) {
      setSpecimen(res.parameters.lst);
    }

    ///udp_GetBranchDetails
  };
  const handleDeleteResult = async () => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: 33,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-Laboratory Result-Delete",
          placement: "topRight",
          duration: 3,
        });
      } else {
        try {
          setIsProcessing(true);
          const res = await PostData("DeleteResult", {
            Id: ResultId,
            Table: "LAB",
          });
          if (res) {
            setIsProcessing(false);
            if (res.status === 1) {
              notification.success({
                message: "Result successfully deleted!",
                placement: "topRight",
                duration: 3,
              });
              location.reload();
            } else {
              notification.error({
                message: res.message,
                placement: "topRight",
                duration: 3,
              });
            }
          }
        } catch (error: any) {
          setIsProcessing(false);
          notification.error({
            message: error.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    }
  };
  const handlePrint = async () => {
    setIsProcessing(true);
    const isDownload = false;
    const url = apiUrl + "labresult/" + ResultId + "/clinicalchem.rdl";
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + store.tokenIdWebCims;
    try {
      await axios({
        url: url, //your url
        method: "GET",
        responseType: "blob",
      }).then((response: any) => {
        let newBlob;
        if (isDownload === false) {
          newBlob = new Blob([response.data], {
            type: "application/pdf",
          });

          const data = window.URL.createObjectURL(newBlob);

          const a = document.createElement("a");

          a.setAttribute("href", data);
          a.setAttribute("target", "_blank");

          a.click();
          setIsProcessing(false);
        } else {
          newBlob = new Blob([response.data], {
            type: "application/excel",
          });
          const a = document.createElement("a");
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(newBlob);
          a.href = url;
          a.download = "download.xls";
          a.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 0);
          setIsProcessing(false);
        }
      });
    } catch (error: any) {
      setIsProcessing(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };
  const handleFinalizeResult = async (v: any) => {
    setShowFinalize(false);
    setIsProcessing(true);
    const res = await PostData("FinalizeResult", {
      ResultId: ResultId,
      Table: "LAB",
      Username: v.Username,
      Password: v.Password,
      Mode: isFinalized ? "U" : "F",
    });

    try {
      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: isFinalized
              ? "Result successfully un-finalized!"
              : "Result successfully finalized!",
            placement: "topRight",
            duration: 3,
          });
          handleOpenResult(ResultId);
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setIsProcessing(false);
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };
  useEffect(() => {
    handleGetAppointmentDetails();
    handleInitialize();
  }, []);
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
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="col-span-3">
          <Divider>Results</Divider>

          <Form form={form1} layout="vertical">
            <Form.Item name="Template" label="Template">
              <Select style={{ width: "100%" }}>
                {templates?.map((v: TLaboratoryResultTemplates) => (
                  <Select.Option key={v.Id} value={v.Id}>
                    {v.Description}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>

          <Button type="primary" onClick={handleNew}>
            New
          </Button>
          <div className="mt-2">
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  label: "Charges",
                  key: "1",
                  children: (
                    <ChargesPerPatient
                      AppointmentId={appointmentDetails?.Id}
                      Counter="LAB"
                      Key={key}
                    />
                  ),
                },
                {
                  label: "Existing Results",
                  key: "2",
                  children: (
                    <ExistingLabResults
                      PatientId={appointmentDetails?.fk_PatientInformation_Id}
                      handleOpen={(data) => handleOpenResult(data.Id)}
                      Key={key}
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
        <div className="col-span-9">
          <h1 className="text-center font-bold">Laboratory Result</h1>
          <div className="mt-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="font-bold text-md">Test Name</div>
              <div className="font-bold text-md">Result(SI)</div>
              <div className="font-bold text-md">Reference Value(SI)</div>
              {/* <div className="font-bold text-md">Result(Conv.)</div>
              <div className="font-bold text-md">Reference Value(Conv.)</div> */}
              <div className="font-bold text-md">Flag</div>
            </div>
            {rowsCol1.map((v: any) => (
              <>
                {/* {v.IsWithResult === "N" && (
                  <div
                    key={v.Id}
                    className={v.IsBold === "Y" ? "font-bold" : "font-normal"}
                  >
                    {v.Test}
                  </div>
                )} */}
                <>
                  <LabResult
                    data={v}
                    handleSaveResult={(x: any) => handleSaveResult(x)}
                    key={v.Id}
                    ResultId={ResultId}
                  />
                </>
                {/* {v.IsWithResult === "Y" && (
                  <>
                    <LabResult
                      data={v}
                      handleSaveResult={(x: any) => handleSaveResult(x)}
                      key={v.Id}
                    />
                  </>
                )} */}
              </>
            ))}
          </div>
          <Form
            //  layout="vertical"
            {...formItemLayout}
            form={form}
            onFinish={handleSubmitForm}
            scrollToFirstError
          >
            <Form.Item label="Result Id." name="ResultId">
              <strong>{ResultId}</strong>
            </Form.Item>
            <Form.Item label="Template Id." name="TemplateId">
              <strong>{form1.getFieldValue("Template")}</strong>
            </Form.Item>
            <Form.Item label="Result No." name="ResultNo">
              <strong>{ResultNo}</strong>
            </Form.Item>
   
            <Form.Item
              label="Date Received"
              name="DateReceived"
              rules={[
                {
                  required: true,
                  message: "Date received is required!",
                },
              ]}
            >
              <DatePicker showTime showToday format="MM/DD/YYYY hh:mm A" />
            </Form.Item>
            <Form.Item
              label="Date Recorded"
              name="DateCollected"
              // rules={[
              //   {
              //     required: true,
              //     message: "Date received is required!",
              //   },
              // ]}
            >
              <DatePicker showTime showToday format="MM/DD/YYYY hh:mm A" />
            </Form.Item>
            <Form.Item
              label="Specimen"
              name="Specimen"
              rules={[
                {
                  max: 100,
                  message: "Specimen must not exceed 100 characters!",
                },
              ]}
              normalize={(v) => v.toUpperCase()}
            >
              <AutoComplete options={specimen} placeholder="Please select" />
            </Form.Item>
            <Form.Item
              label="Lab No."
              name="LabNo"
              // rules={[
              //   { required: true, message: "Specimen is required!" },
              //   {
              //     max: 100,
              //     message: "Specimen must not exceed 100 characters!",
              //   },
              // ]}
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>
            {/* <Form.Item
              label="Test Principle"
              name="TestPrinciple"
              rules={[
                {
                  max: 200,
                },
              ]}
            >
              <AutoComplete
                options={testPrinciple}
                placeholder="Please select"
              />
            </Form.Item> */}
            <Form.Item label="Requesting Physician" name="RequestingPhysician">
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
            <Form.Item
              label="Medical Technologist"
              name="Medtech"
              rules={[
                {
                  required: true,
                  message: "Medical technologist is required!",
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
                {Medtechs.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Pathologist"
              name="Pathologist"
              rules={[
                {
                  required: true,
                  message: "Pathologist is required!",
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
                {Pathologist.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Remarks" name="Remarks">
              <Input.TextArea rows={4} />
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

                    disabled={rowsCol1.length <= 0 || isFinalized}
                    loading={isProcessing || IsSaving}
                  >
                    Save
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      handlePrint();
                    }}
                    loading={isProcessing}
                    disabled={!isFinalized}
                  >
                    Print
                  </Button>
                </Space>
                <Space>
                  <Popconfirm
                    title="Cancel Changes?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => {
                      window.location.reload();
                    }}
                  >
                    <Button
                      danger
                      type="primary"
                      loading={isProcessing}
                      disabled={!allowSave}
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
                    {isFinalized ? "Un-Finalize Result" : "Finalize Result"}
                  </Button>

                  <Popconfirm
                    title="Delete this result?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => handleDeleteResult()}
                  >
                    <Button
                      danger
                      type="primary"
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
};
