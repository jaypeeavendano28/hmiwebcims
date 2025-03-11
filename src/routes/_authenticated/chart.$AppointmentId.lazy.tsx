import { createLazyFileRoute } from "@tanstack/react-router";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Space,
} from "antd";
import { TAppointments, TChart, TDoctors, TICd10 } from "../../types";
import { useQuery } from "@tanstack/react-query";
import { isNullOrUndefinedOrBlank, PostData } from "../../helpers";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import useAppStore from "../../store";
import axios from "axios";
import SearchICD from "../../components/SearchICD";

export const Route = createLazyFileRoute(
  "/_authenticated/chart/$AppointmentId"
)({
  component: () => <Chart />,
});
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;
const Chart = () => {
  const [showModal, setShowModal] = useState(false);
  const store = useAppStore();
  const [selected, setSelected] = useState<TChart | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { AppointmentId } = Route.useParams();
  const [Id, setId] = useState<number>(0);
  const [form] = Form.useForm();
  const handleSubmit = async (v: TChart) => {
    const valuesToSave = {
      ...v,
      fk_Appointments_Id: AppointmentId,
      Id,
      Started: dayjs(v.Started).format(),
      Ended: dayjs(v.Ended).format(),
    };

    try {
      setIsProcessing(true);
      const res = await PostData("SaveChart", valuesToSave);
      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });
          setId(res.parameters.Id);
          if (!isNullOrUndefinedOrBlank(selected)) {
            let s: TChart | undefined = selected;
            s!.UpdatedBy = res.parameters.UpdatedBy;
            s!.DateUpdated = res.parameters.DateUpdated;
            setSelected(s);
          }
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
      console.log(error.message);
    }
  };
  const handleClose = (Icd10: TICd10) => {
    form.setFieldsValue({
      Icd10: Icd10.ITEM_CODE,
      Ruv: Icd10.ITEM_DESC,
      AssessmentDiagnosis: Icd10.ITEM_DESC,
    });

    setShowModal(false);
  };

  const patientInformaation = useQuery<TAppointments>({
    queryKey: ["patientInformaation"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetAppointmentDetails",
        parameters: { Id: AppointmentId },
      });
      if (res) {
        return res.parameters.lst[0];
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const specialists = useQuery<TDoctors[]>({
    queryKey: ["specialists"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetDoctors",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const handleGetDetails = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetChart",
      parameters: { AppointmentId },
    });
    if (res) {
      if (res.parameters.lst.length > 0) {
        const x: TChart = res.parameters.lst[0];
        setSelected(x);
        setId(x.Id);
        form.setFieldsValue({
          Started: dayjs(x.Started),
          Ended: dayjs(x.Ended),
          Specialist: x.Specialist,
          RequestingPhysician: x.RequestingPhysician,
          AssessmentDiagnosis: x.AssessmentDiagnosis,
          Icd10: x.Icd10,
          Ruv: x.Ruv,
          Planx: x.Planx,
          AddedBy: x.AddedBy,
          DateAdded: dayjs(x.DateAdded).format("MM/DD/YYYY hh:mm A"),
          UpdatedBy: x.UpdatedBy,
          DateUpdated: dayjs(x.DateAdded).format("MM/DD/YYYY hh:mm A"),
        });
      } else {
        setId(0);
        form.setFieldsValue({
          Started: dayjs(),
        });
      }
    }
  };

  const handlePrint = async () => {
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + store.tokenIdWebCims;

    const url = apiUrl + "/api/GenerateReport";
    try {
      setIsProcessing(true);
      await axios({
        url: url, //your url
        method: "GET",
        responseType: "blob",
        params: {
          ReportName: "chart.rdl",
          AppointmentId: AppointmentId,
        },
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
        setIsProcessing(false);
      });
    } catch (error: any) {
      setIsProcessing(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };
  useEffect(() => {
    handleGetDetails();
  }, []);
  return (
    <>
      <div className="grid  grid-cols-6">
        <div>
          <div className="flex">
            Patient:
            <p className="font-bold">{patientInformaation.data?.Name}</p>
          </div>
        </div>
        <div>
          <div className="flex">
            Age:
            <p className="font-bold">{patientInformaation.data?.AgeYears}</p>
          </div>
        </div>
        <div>
          <div className="flex">
            Sex:
            <p className="font-bold">{patientInformaation.data?.Sex}</p>
          </div>
        </div>
      </div>
      <div className="text-center font-bold text-md">Chart</div>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            name="Specialist"
            label="Specialist"
            rules={[
              {
                required: true,
                message: "Specialist is required!",
              },
            ]}
          >
            <Select
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
              {specialists.data &&
                specialists.data.map((d: TDoctors) => (
                  <Select.Option
                    key={d.Id}
                    value={d.Id}
                    title={d.NameAndSpecialty}
                  >
                    {d.NameAndSpecialty}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="Started"
            label="Started"
            rules={[
              {
                required: true,
                message: "Started is required!",
              },
            ]}
          >
            <DatePicker format="MM/DD/YYYY hh:mm A" showTime />
          </Form.Item>
          <Form.Item
            name="Ended"
            label="Ended"
            rules={[
              {
                required: true,
                message: "Ended is required!",
              },
            ]}
          >
            <DatePicker format="MM/DD/YYYY hh:mm A" showTime />
          </Form.Item>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Form.Item name="RequestingPhysician" label="Requesting Physician">
            <Select
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
              {specialists.data &&
                specialists.data.map((d: TDoctors) => (
                  <Select.Option
                    key={d.Id}
                    value={d.Id}
                    title={d.NameAndSpecialty}
                  >
                    {d.NameAndSpecialty}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </div>
        <Form.Item
          name="AssessmentDiagnosis"
          label="Assessment/Diagnosis"
          rules={[
            {
              required: true,
              message: "Assessment/Diagnosis is required!",
            },
          ]}
        >
          <Input.TextArea rows={5} />
        </Form.Item>
        <div className="grid grid-cols-3 gap-4">
          <Form.Item name="Icd10" label="ICD 10">
            <Input />
          </Form.Item>

          <Form.Item name="Ruv" label="RUV">
            <Input />
          </Form.Item>
          <div className="flex items-center">
            <Button type="primary" onClick={() => setShowModal(true)}>
              Search ICD10/RVS
            </Button>
          </div>
        </div>
        <Form.Item name="Planx" label="Plan">
          <Input.TextArea rows={5} />
        </Form.Item>
        <div className="flex justify-end">
          <Space>
            <Button loading={isProcessing} type="primary" htmlType="submit">
              Submit
            </Button>
            <Button
              onClick={handlePrint}
              loading={isProcessing}
              disabled={Id === 0}
              type="primary"
            >
              Print
            </Button>
          </Space>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p>Added By</p>
            <p className="font-bold">{selected?.AddedBy}</p>
          </div>
          <div>
            <p>Date Added</p>
            <p className="font-bold">
              {dayjs(selected?.DateAdded).format("MM/DD/YYYY hh:mm A")}
            </p>
          </div>

          <div>
            <p>Updated By</p>
            <p className="font-bold">{selected?.UpdatedBy}</p>
          </div>
          <div>
            <p>Date Updated</p>
            <p className="font-bold">
              {dayjs(selected?.DateUpdated).format("MM/DD/YYYY hh:mm A")}
            </p>
          </div>
        </div>
      </Form>
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={1200}
      >
        <SearchICD handleClose={handleClose} />
      </Modal>
    </>
  );
};
