import { createLazyFileRoute } from "@tanstack/react-router";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import { TAppointments, TDoctors, TRadiologyResult } from "../../types";
import { useEffect, useState } from "react";
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
} from "@syncfusion/ej2-react-pdfviewer";
import {
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
  notification,
} from "antd";
import useAppStore from "../../store";
import dayjs from "dayjs";
import axios from "axios";
import ChargesPerPatient from "../../components/ChargesPerPatient";
import FinalizeForm from "../../components/FinalizeForm";
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + "/api/";
const devApi = import.meta.env.VITE_DEV_API + "/api/";
const apiUrl = isDev ? devApi : prodApi;

export const Route = createLazyFileRoute("/_authenticated/cardioresult/$Id")({
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
function CardioResult  () {
  let viewer: PdfViewerComponent | null;
  const [showFinalize, setShowFinalize] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [Key, setKey] = useState<string>(Math.random().toString());
  const [allowSave, setAllowSave] = useState(false);
  const [chargeDescription, setChargeDescription] = useState("");
  const [chargeId, setChargeId] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [Radiologist, setRadiologist] = useState([]);
  const [RequestingPhysician, setRequestingPhysician] = useState([]);
  const [IsSaving, setIsSaving] = useState(false);
  const [ResultNo, setResultNo] = useState("");
  const [ResultId, setResultId] = useState(0);
  const [pdfFIle,setPdfFile] = useState("")
  const [form] = Form.useForm();
  const store = useAppStore();

  const Id = Route.useParams().Id;
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();
  const templates = [{
    Description:"2D-Echo Report",
    TemplateName:"2decho.pdf"
  },{
    Description:"ECG Report",
    TemplateName:"ecgreport.pdf"
  }]

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
  };

  const handleSubmitForm = async (values: any) => {
  var xx= await viewer!.saveAsBlob()
  console.log(xx)
    return;
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
        Department: "XR",
        ChargeDescription: chargeDescription,
      };

      const res = await PostData("SaveRadiologyResult", valuesToSave);
      if (res) {
        console.log(res);
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });

          setIsSaving(false);
          setResultId(res.parameters.Id);
          setResultNo(res.parameters.ResultNo);
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
  const handleFinalizeResult = async (v: any) => {
    setShowFinalize(false);
    setIsProcessing(true);
    const res = await PostData("FinalizeResult", {
      ResultId: ResultId,
      Table: "RAD",
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
  const handleInitialize = async () => {
    let res = await PostData("GetRecords", {
      sp: "udp_GetDoctors",
      parameters: {},
    });
    if (res) {
      setRequestingPhysician(res.parameters.lst);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetListOfCardiologist",
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
    const isDownload = false;
    const url = apiUrl + "radiologyresult/" + ResultId + "/xray.rdl";
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
  

  const handleOpenResult = async (Id: number) => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetRadiologyResult",
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
      form.setFieldValue("Template", r.Template);
      setAllowSave(true);
      if (!isNullOrUndefinedOrBlank(r.FinalizedBy)) {
        setIsFinalized(true);
      } else {
        setIsFinalized(false);
      }
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
      });
      setResultNo("");
      setResultId(0);
      setIsFinalized(false);
    } else {
      handleOpenResult(v.ResultId);
    }
  };
  const handleChangeTemnplate = (e:any)=>{
   
    if (!isNullOrUndefinedOrBlank(e)) {
      setPdfFile(e)
    }
  }
  const handleChangeDateOfExamination: DatePickerProps['onChange'] = async(dateString)=>{
    var formFields = await viewer!.retrieveFormFields();
    formFields.forEach((element, index) => {
      if (element.name === "DateOfExamination") {
        formFields[index].value = dayjs(dateString).format("MM/DD/YYYY");
        viewer!.updateFormFieldsValue(formFields[index]);
      }
    });
  }


  const handleFillFields =async ()=> {
   
    var formFields = await viewer!.retrieveFormFields();
    if (formFields) {
      formFields.forEach((element, index) => {
        if (element.name === "PatientName") {
          formFields[index].value = appointmentDetails?.Name;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === "Age") {
          formFields[index].value = appointmentDetails?.AgeYears  ;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === "Gender") {
          formFields[index].value = appointmentDetails?.Sex  ;
          viewer!.updateFormFieldsValue(formFields[index]);
        }  else if (element.name === "DateOfExamination") {
          formFields[index].value =dayjs(form.getFieldValue("DateOfExamination")).format("MM/DD/YYYY")  ;
          viewer!.updateFormFieldsValue(formFields[index]);
        } else if (element.name === "RequestingPhysician") {
          const x:TDoctors = RequestingPhysician.filter((f:TDoctors)=>f.Id===form.getFieldValue("RequestingPhysician"))[0]
          formFields[index].value =x.Name  ;
          viewer!.updateFormFieldsValue(formFields[index]);
        }  else if (element.name === "Diagnosis") {
          formFields[index].value = appointmentDetails?.Diagnosis ;
          viewer!.updateFormFieldsValue(formFields[index]);
        }  else if (element.name === "Cardiologist") {
          const x:TDoctors = Radiologist.filter((f:TDoctors)=>f.Id===form.getFieldValue("Cardiologist"))[0]
          formFields[index].value =x.Name  ;
          viewer!.updateFormFieldsValue("Cardiologist")
        }  else if (element.name === "LicenseNo") {
          const x:TDoctors = Radiologist.filter((f:TDoctors)=>f.Id===form.getFieldValue("Cardiologist"))[0]
          formFields[index].value =x.LicNo  ;
          viewer!.updateFormFieldsValue(formFields[index]);
        } 
      });
    }
  }

  useEffect(() => {
    handleGetAppointmentDetails();
    handleInitialize();
    setKey(Math.random().toString());
  }, []);
  useEffect(()=>{
    handleFillFields()
  },[pdfFIle])
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
            <ChargesPerPatient
              AppointmentId={appointmentDetails?.Id}
              handleNewResult={handleNewResult}
              Key={Key}
              Counter="CARDIO"
            />
            {/* <Tabs
              defaultActiveKey="1"
              items={[
                {
                  label: "Charges",
                  key: "1",
                  children: (
                    <ChargesPerPatient
                      AppointmentId={appointmentDetails?.Id}
                      handleNewResult={handleNewResult}
                    />
                  ),
                },
                {
                  label: "Existing Results",
                  key: "2",
                  children: (
                    <ExistingLabResults
                      PatientId={appointmentDetails?.fk_PatientInformation_Id}
                      handleOpen={(data) => handleOpenResult(data)}
                    />
                  ),
                },
              ]}
            /> */}
          </div>
        </div>
        <div className="col-span-9">
          <h1 className="text-center font-bold">
            Cardiology Result for - {chargeDescription}
          </h1>
          {/* Templates */}
          <div>

          </div>

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
            
            <Form.Item label="Template" name="Template">
              <Select onChange={handleChangeTemnplate}>
                {templates.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Description} value={d.TemplateName}>
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
                  message: "Report date is required!",
                },
              ]}
            >
              <DatePicker onChange={handleChangeDateOfExamination}  format="MM/DD/YYYY" />
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
                  message: "Cardiologist is required!",
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
                {Radiologist.map((d: any) => (
                  <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
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
                      setChargeDescription("");
                      setResultId(0);
                      setResultNo("");
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
                    {isFinalized ? "Un-Finalize Result" : "Finalize Result"}
                  </Button>

                  <Button
                    type="primary"
                    danger
                    disabled={ResultId === 0 || isFinalized}
                  >
                    Delete Result
                  </Button>
                </Space>
              </div>
            </Form.Item>
          </Form>
        </div>
      
      </div>
    
      <PdfViewerComponent
        id="container"
        ref={(scope) => { viewer = scope; }}
        documentPath={pdfFIle}
        serviceUrl={apiUrl + "pdfviewer"}
       
        enableFormFieldsValidation={true}
        showNotificationDialog={false}
        style={{ height: "640px" }}
      >
        <Inject
          services={[
            Toolbar,
            Magnification,
            Navigation,
            LinkAnnotation,
            BookmarkView,
            ThumbnailView,
            TextSelection,
            TextSearch,
            Annotation,
            FormFields,
            FormDesigner,
            Print,
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
};
