import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import { useForm } from "antd/es/form/Form";
import {
  TAppointments,
  TDoctors,
  TFamilyMedicalHistory,
  TMer,
  TMerOthers,
} from "../../types";
import {
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  notification,
} from "antd";
import dayjs from "dayjs";
import { FaBars } from "react-icons/fa6";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import axios from "axios";
import useAppStore from "../../store";
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;
export const Route = createFileRoute(
  "/_authenticated/merschool/$AppointmentId"
)({
  component: () => <MerSchool />,
});

const MerSchool = () => {
  const store = useAppStore();
  const [selectedFamMed, setSelectedFamMed] = useState<
    TFamilyMedicalHistory[] | null
  >(null);
  const [showFamilyMedHistory, setShowFamilyMedHistory] = useState(false);
  const [familyMedicalHistory, setFamilyMedicalHistory] = useState<
    TMerOthers[]
  >([]);

  const [doctors, setDoctors] = useState<TDoctors[] | undefined>([]);
  const { AppointmentId } = Route.useParams();
  const [form] = useForm();

  const handleInitialize = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetFamilyMedicalHistory",
      parameters: {},
    });
    if (res) {
      setFamilyMedicalHistory(res.parameters.lst);
    }
  };
  const handleGetAppointmentDetails = async () => {
    let res = await PostData("GetRecords", {
      sp: "udp_GetAppointmentDetails",
      parameters: {
        Id: AppointmentId,
      },
    });
    if (res) {
      const x: TAppointments = res.parameters.lst[0];
      form.setFieldsValue({
        Name: x.Name,
        MemberNo: x.MemberNo,
        DateOfBirthStr: x.DateOfBirthStr,
        Age: x.AgeYears,
        ContactNos: x.ContactNos,
        AppointmentId: AppointmentId,
        Address: x.Address,
      });
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetDoctors",
      parameters: {},
    });
    if (res) {
      setDoctors(res.parameters.lst);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetMerDetails",
      parameters: {
        AppointmentId: AppointmentId,
        Type: "S",
      },
    });
    if (res) {
      if (res.parameters.lst.length > 0) {
        const x: TMer = res.parameters.lst[0];
        form.setFieldsValue({
          MerNo: x.MerNo,
          MerDate: dayjs(x.MerDate),
          NatureOfExamination: x.NatureOfExamination,
          FamilyHistory: x.FamilyHistory,
          Allergy: x.Allergy,
          PastDisease: x.PastDisease,
          Others: x.Others,
          Accidents: x.Accidents,
          PresentSymptoms: x.PresentSymptoms,
          Bp: x.Bp,
          Pr: x.Pr,
          Temp: x.Temp,
          Height: x.Height,
          Rr: x.Rr,
          Weight: x.Weight,
          VaLeft: x.VaLeft,
          VaRight: x.VaRight,
          WithCorrectionLeft: x.WithCorrectionLeft,
          WithCorrectionRight: x.WithCorrectionRight,
          Ishihara: x.Ishihara,
          EentStatus: x.EentStatus,
          EentRemarls: x.EentRemarls,
          ChestStatus: x.ChestStatus,
          ChestRemarks: x.ChestRemarks,
          HeartStatus: x.HeartStatus,
          HeartRemarks: x.HeartRemarks,
          AbdomenStatus: x.AbdomenStatus,
          AbdomenRemarks: x.AbdomenRemarks,
          ExtremitiesStatus: x.ExtremitiesStatus,
          ExtremitiesRemarks: x.ExtremitiesRemarks,
          OthersStatus: x.OthersStatus,
          OthersRemarks: x.OthersRemarks,
          AttendingPhysician: x.AttendingPhysician,
          ChestXrayDate: isNullOrUndefinedOrBlank(x.ChestXrayDate)
            ? undefined
            : dayjs(x.ChestXrayDate),
          ChestXrayStudyNo: x.ChestXrayStudyNo,
          ChestXrayView: x.ChestXrayView,
          ChestXrayResult: x.ChestXrayResult,
          UrinalysisDate: isNullOrUndefinedOrBlank(x.UrinalysisDate)
            ? undefined
            : dayjs(x.UrinalysisDate),
          UrinalysisResult: x.UrinalysisResult,
          EcgDate: isNullOrUndefinedOrBlank(x.EcgDate)
            ? undefined
            : dayjs(x.EcgDate),
          EcgResult: x.EcgResult,
          CbcDate: isNullOrUndefinedOrBlank(x.CbcDate)
            ? undefined
            : dayjs(x.CbcDate),
          CbcResult: x.CbcResult,
          FecalysisDate: isNullOrUndefinedOrBlank(x.FecalysisDate)
            ? undefined
            : dayjs(x.FecalysisDate),
          FecalysisResult: x.FecalysisResult,
          DrugTestDate: isNullOrUndefinedOrBlank(x.DrugTestDate)
            ? undefined
            : dayjs(x.DrugTestDate),
          DrugTestResult: x.DrugTestResult,
          TreadmillDate: isNullOrUndefinedOrBlank(x.TreadmillDate)
            ? undefined
            : dayjs(x.TreadmillDate),
          TreadmillResult: x.TreadmillResult,
          EchoDate: isNullOrUndefinedOrBlank(x.EchoDate)
            ? undefined
            : dayjs(x.EchoDate),
          EchoResult: x.EchoResult,
          UltrasoundDate: isNullOrUndefinedOrBlank(x.UltrasoundDate)
            ? undefined
            : dayjs(x.UltrasoundDate),
          UltrasoundResult: x.UltrasoundResult,
          ClassA: x.ClassA,
          ClassB: x.ClassB,
          ClassC: x.ClassC,
          ClassC1: x.ClassC1,
          ClassC2: x.ClassC2,
          ClassD: x.ClassD,
          ClassO: x.ClassO,
          Remarks: x.Remarks,
          EvaluatedBy: x.EvaluatedBy,
        });
      }
    }
  };
  const handleSetFamilyMed = () => {
    let s: string = isNullOrUndefinedOrBlank(
      form.getFieldValue("FamilyHistory")
    )
      ? ""
      : form.getFieldValue("FamilyHistory");
    selectedFamMed?.map((v: TFamilyMedicalHistory) => {
      if (s === "") {
        s = v.Description!;
      } else {
        s = s + "," + v.Description!;
      }
    });
    form.setFieldValue("FamilyHistory", s);
  };
  const handleSubmitForm = async (v: TMer) => {
    try {
      const valuesToSave = {
        ...v,

        MerDate: isNullOrUndefinedOrBlank(v.MerDate)
          ? undefined
          : dayjs(v.MerDate).format("YYYY-MM-DD"),
        ChestXrayDate: isNullOrUndefinedOrBlank(v.ChestXrayDate)
          ? undefined
          : dayjs(v.ChestXrayDate).format("YYYY-MM-DD"),
        UrinalysisDate: isNullOrUndefinedOrBlank(v.UrinalysisDate)
          ? undefined
          : dayjs(v.UrinalysisDate).format("YYYY-MM-DD"),
        EcgDate: isNullOrUndefinedOrBlank(v.EcgDate)
          ? undefined
          : dayjs(v.EcgDate).format("YYYY-MM-DD"),
        CbcDate: isNullOrUndefinedOrBlank(v.CbcDate)
          ? undefined
          : dayjs(v.CbcDate).format("YYYY-MM-DD"),
        FecalysisDate: isNullOrUndefinedOrBlank(v.FecalysisDate)
          ? undefined
          : dayjs(v.FecalysisDate).format("YYYY-MM-DD"),
        DrugTestDate: isNullOrUndefinedOrBlank(v.DrugTestDate)
          ? undefined
          : dayjs(v.DrugTestDate).format("YYYY-MM-DD"),
        TreadmillDate: isNullOrUndefinedOrBlank(v.TreadmillDate)
          ? undefined
          : dayjs(v.TreadmillDate).format("YYYY-MM-DD"),
        EchoDate: isNullOrUndefinedOrBlank(v.EchoDate)
          ? undefined
          : dayjs(v.EchoDate).format("YYYY-MM-DD"),
        UltrasoundDate: isNullOrUndefinedOrBlank(v.UltrasoundDate)
          ? undefined
          : dayjs(v.UltrasoundDate).format("YYYY-MM-DD"),
        Type: "S",
      };
      const res = await PostData("SaveMer", valuesToSave);

      if (res) {
        if (res.status === 1) {
          form.setFieldsValue({
            MerNo: res.parameters.MerNo,
          });

          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };
  const handlePrint = async () => {
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + store.tokenIdWebCims;
    const url =
      apiUrl +
      "/api/GenerateReport?ReportName=mer.rdl&BranchCode=" +
      store.branchCode +
      "&AppointmentId=" +
      AppointmentId +
      "&Type=S";

    try {
      await axios({
        url: url, //your url
        method: "GET",
        responseType: "blob",
        params: {},
      }).then((response) => {
        let newBlob;
        newBlob = new Blob([response.data], {
          type: "application/pdf",
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement("a");

        a.setAttribute("href", data);
        a.setAttribute("target", "_blank");

        a.click();
      });
    } catch (error: any) {
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };
  useEffect(() => {
    handleInitialize();
    handleGetAppointmentDetails();
  }, []);
  useEffect(() => {
    handleSetFamilyMed();
  }, [selectedFamMed]);
  return (
    <div className="cardBackGround">
      <Divider>MEDICAL EVALUATION REPORT</Divider>
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
        onFinish={handleSubmitForm}
      >
        <div className="font-bold text-xl text-center">
          PATIENT'S INFORMATION
        </div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="Name" label="Name" className="col-span-2">
            <Input readOnly className="font-bold" />
          </Form.Item>
          <Form.Item name="MerNo" label="MER No." className="col-span-2">
            <Input readOnly className="font-bold" />
          </Form.Item>
          <Form.Item
            name="MerDate"
            label="MER Date"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
          <Form.Item name="AppointmentId" label="Appointment Id">
            <Input readOnly className="font-bold" />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="NatureOfExamination" label="Nature Of Examination">
            <Input />
          </Form.Item>
          <Form.Item name="MemberNo" label="Member No.">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="DateOfBirthStr" label="Birthday">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="Age" label="Age">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="Occupation" label="Occupation">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="ContactNos" label="Contact Nos.">
            <Input readOnly />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="Address" label="Address" className="col-span-6">
            <Input readOnly />
          </Form.Item>
        </div>
        <div className="font-bold text-xl text-center mb-2">
          SIGNIFICANT MEDICAL HISTORY
        </div>
        <div className="grid lg:grid-cols-12 gap-4">
          <Form.Item
            name="FamilyHistory"
            label="Family History"
            className="col-span-5"
          >
            <Input />
          </Form.Item>
          <div className="flex justify-start items-center">
            <Button
              icon={<FaBars />}
              type="primary"
              onClick={() => {
                setSelectedFamMed(null);
                setShowFamilyMedHistory(true);
              }}
            />
          </div>
          <Form.Item name="Allergy" label="Allergy" className="col-span-6">
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Form.Item name="PastDisease" label="Past Disease">
            <Input />
          </Form.Item>

          <Form.Item name="Others" label="Others">
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Form.Item name="Accidents" label="Accident’s/Operations">
            <Input />
          </Form.Item>

          <Form.Item name="PresentSymptoms" label="Present Symptoms">
            <Input />
          </Form.Item>
        </div>
        <div className="font-bold text-xl mb-2">VITAL SIGNS</div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="Bp" label="Blood Pressure">
            <Input />
          </Form.Item>
          <Form.Item name="Pr" label="Pulse Rate">
            <Input />
          </Form.Item>
          <Form.Item name="Temp" label="Temperature">
            <Input />
          </Form.Item>
          <Form.Item name="Rr" label="Respiratory Rate">
            <Input />
          </Form.Item>
          <Form.Item name="Height" label="Height">
            <Input />
          </Form.Item>
          <Form.Item name="Weight" label="Weight">
            <Input />
          </Form.Item>
        </div>
        <div className="font-bold text-xl mb-2">VISUAL EXAMINATION</div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="VaLeft" label="Visual Acuity (Left)">
            <Input />
          </Form.Item>
          <Form.Item name="VaRight" label="Visual Acuity (Right)">
            <Input />
          </Form.Item>
          <Form.Item name="WithCorrectionLeft" label="With Correction (Left)">
            <Input />
          </Form.Item>
          <Form.Item name="WithCorrectionRight" label="With Correction (Right)">
            <Input />
          </Form.Item>
          <Form.Item name="Ishihara" label="Ishihara">
            <Input />
          </Form.Item>
        </div>
        <div className="font-bold text-xl mb-2 text-center">FINDINGS</div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="font-bold text-xl mb-2">PHYSICAL EXAMINATION</div>
          <div className="font-bold text-xl mb-2">STATUS</div>
          <div className="font-bold text-xl mb-2">REMARKS</div>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">EENT</div>
          <Form.Item name="EentStatus" noStyle>
            <Input />
          </Form.Item>
          <Form.Item name="EentRemarls" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">CHEST/LUNGS</div>
          <Form.Item name="ChestStatus" noStyle>
            <Input />
          </Form.Item>
          <Form.Item name="ChestRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">HEART</div>
          <Form.Item name="HeartStatus" noStyle>
            <Input />
          </Form.Item>
          <Form.Item name="HeartRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">ABDOMEN</div>
          <Form.Item name="AbdomenStatus" noStyle>
            <Input />
          </Form.Item>
          <Form.Item name="AbdomenRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">EXTREMITIES</div>
          <Form.Item name="ExtremitiesStatus" noStyle>
            <Input />
          </Form.Item>
          <Form.Item name="ExtremitiesRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">OTHERS</div>
          <Form.Item name="OthersStatus" noStyle>
            <Input />
          </Form.Item>
          <Form.Item name="OthersRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <Form.Item label="Attending Physician" name="AttendingPhysician">
            <Select
              style={{ width: "100%" }}
              showSearch
              allowClear
              filterOption={(input, option) =>
                (
                  option!.children
                    ?.toString()
                    .toLocaleLowerCase() as unknown as string
                ).includes(input.toLocaleLowerCase())
              }
            >
              {doctors &&
                doctors.map((d: TDoctors) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                    {d.Name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">CHEST-XRAY</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="ChestXrayDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="ChestXrayStudyNo" label="Study No.">
                <Input />
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="ChestXrayView" label="View">
                <Input />
              </Form.Item>
              <Form.Item name="ChestXrayResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">URINALYSIS</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="UrinalysisDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="UrinalysisResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">ECG</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="EcgDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="EcgResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">CBC</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="CbcDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="CbcResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">FECALYSIS</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="FecalysisDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="FecalysisResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">DRUG TEST</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="DrugTestDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="DrugTestResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">TREADMILL</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="TreadmillDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="TreadmillResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">2D ECHO</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="EchoDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="EchoResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">ULTRASOUND</div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="UltrasoundDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="UltrasoundResult" label="Result">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">OTHERS</div>

            <Form.Item name="OthersResult" label="Result">
              <Input.TextArea rows={4} />
            </Form.Item>
          </div>
        </div>
        <div className="font-bold text-xl text-center">EVALUATION</div>
        <div className="font-bold">
          I certify that I have examined and found the examinee to be:
        </div>
        <div>
          <Form.Item
            name="ClassA"
            label="Class A"
            noStyle
            valuePropName="checked"
          >
            <Checkbox>Class A – Medically fit for employment</Checkbox>
          </Form.Item>
        </div>
        <div>
          <Form.Item
            name="ClassB"
            label="Class B"
            noStyle
            valuePropName="checked"
          >
            <Checkbox>
              Class B – Medically fit for employment with manageable findings:
            </Checkbox>
          </Form.Item>
        </div>
        <div>
          <Form.Item
            name="ClassC"
            label="Class C"
            noStyle
            valuePropName="checked"
          >
            <Checkbox>Class C – Employable but requires:</Checkbox>
          </Form.Item>
        </div>
        <div className="ml-4">
          <Form.Item
            name="ClassC1"
            label="Class C"
            noStyle
            valuePropName="checked"
          >
            <Checkbox>
              Regular follow-up treatment/periodic evaluation.
            </Checkbox>
          </Form.Item>
        </div>
        <div className="ml-4">
          <Form.Item
            name="ClassC2"
            label="Class C"
            noStyle
            valuePropName="checked"
          >
            <Checkbox>
              Special placement at work or limited duty in a special assignment
            </Checkbox>
          </Form.Item>
        </div>
        <div>
          <Form.Item
            name="ClassD"
            label="Class D"
            noStyle
            valuePropName="checked"
          >
            <Checkbox>Class D- Medically unfit for employment</Checkbox>
          </Form.Item>
        </div>
        <div>
          <Form.Item
            name="ClassO"
            label="Class O"
            noStyle
            valuePropName="checked"
          >
            <Checkbox>Class O – Peding due to:</Checkbox>
          </Form.Item>
        </div>

        <div>
          <Form.Item name="Remarks" label="Remarks">
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Form.Item
            label="Evaluated By"
            name="EvaluatedBy"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              style={{ width: "100%" }}
              showSearch
              allowClear
              filterOption={(input, option) =>
                (
                  option!.children
                    ?.toString()
                    .toLocaleLowerCase() as unknown as string
                ).includes(input.toLocaleLowerCase())
              }
            >
              {doctors &&
                doctors.map((d: TDoctors) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                    {d.Name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <div className="flex justify-start items-center">
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button type="primary" onClick={handlePrint}>
                Print
              </Button>
            </Space>
          </div>
        </div>
      </Form>

      <Modal
        open={showFamilyMedHistory}
        onCancel={() => setShowFamilyMedHistory(false)}
        footer={false}
        width={400}
      >
        <DataTable
          dataKey="Id"
          value={familyMedicalHistory}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          selection={selectedFamMed}
          onSelectionChange={(e: any) => {
            const value = e.value as TMer[];
            setSelectedFamMed(value);
          }}
          //   selectionMode="multiple"
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
          ></Column>
          <Column
            field="Description"
            header="Description"
            style={{ minWidth: "12rem" }}
          ></Column>
        </DataTable>
      </Modal>
    </div>
  );
};
