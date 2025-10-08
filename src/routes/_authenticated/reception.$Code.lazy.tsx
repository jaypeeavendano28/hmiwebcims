import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/userAuth";
import {
  App,
  Button,
  DatePicker,
  Divider,
  Form,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tooltip,
} from "antd";
import useAppStore from "../../store";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import dayjs from "dayjs";
import { BellOutlined } from "@ant-design/icons";
import { FilterMatchMode } from "primereact/api";
import Calling from "../../components/calling";
import { TQNo } from "../../types";
import Loading from "../../components/loading";
import { BiNotepad } from "react-icons/bi";
import { GiCancel } from "react-icons/gi";
import { AxiosError } from "axios";

export const Route = createLazyFileRoute("/_authenticated/reception/$Code")({
  component: () => <Reception />,
});

const Reception = () => {
  const { notification } = App.useApp();
  const { Code } = Route.useParams();
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState<TQNo | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [filters] = useState({
    QNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const q = useQueryClient();
  const [IsSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [date, setDate] = useState(dayjs(new Date()).format("YYYYMMDD"));
  const store = useAppStore();
  const router = useRouter();
  const auth = useAuth();
  const handleInitialize = async () => {
    const res = await auth.isWithAccess(14);

    if (!res) {
      notification.error({
        message: "Access denied-Reception",
        placement: "topRight",
        duration: 3,
      });
      store.setHideSideBar("N");
      router.navigate({
        to: "/",
      });
    }
    form.setFieldValue("Counter", localStorage.getItem("counter"));
  };

  const counters = useQuery({
    queryKey: ["counters"],
    queryFn: async () => {
      let res = await PostData("GetRecords", {
        sp: "udp_GetReceptionCounters",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
  });

  const patientsOnQueue = useQuery({
    queryKey: ["patientsOnQueue", Code],
    queryFn: async () => {
      let res = await PostData("GetRecords", {
        sp: "udp_GetQueueList",
        parameters: {
          date: date,
          code: Code,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    //refetchInterval: 1000 * 30,
  });

  const donePatients = useQuery({
    queryKey: ["donePatients", Code],
    queryFn: async () => {
      let res = await PostData("GetRecords", {
        sp: "udp_GetQList",
        parameters: {
          date: date,
          option: "D",
          code: Code,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 5,
  });
  const handleRefresh = (values: any) => {
    setDate(dayjs(values.Date).format("YYYYMMDD"));
    q.invalidateQueries({ queryKey: ["patientsOnQueue"] });
  };

  const handleCall = async (data: TQNo) => {
    if (isNullOrUndefinedOrBlank(form.getFieldValue("Counter"))) {
      notification.error({
        message: "Please select a counter!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    const valuesToSave = {
      ...data,
      Username: store.username,
      Counter: form.getFieldValue("Counter"),
    };

    setIsSubmitting(true);
    const res = await PostData("CallReception", valuesToSave);
    if (res) {
      if (res.status === 1) {
        if (data.Status === "C") {
          setShowModal(true);
          q.invalidateQueries({ queryKey: ["patientsOnQueue"] });
        } else if (data.Status === "O") {
          setSelectedRecord(undefined);
          setIsSubmitting(false);
          q.invalidateQueries({ queryKey: ["patientsOnQueue"] });
        } else if (data.Status === "A") {
          setIsSubmitting(false);
          setShowModal(false);

          localStorage.setItem("code", data?.Code!);
          navigate({
            to: "/appointmentdetails/$Id",
            params: {
              Id: "0",
            },
          });
        }
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 5,
        });
      }
    }
  };
  const handleCancel = async (data: TQNo) => {
    try {
      setIsSubmitting(true);
      const res = await PostData("CancelQReception", data);
      if (res) {
        setIsSubmitting(false);

        if (res.status === 1) {
          q.invalidateQueries({ queryKey: ["patientsOnQueue"] });
          notification.success({
            message: "Successfully cancelled!",
            placement: "topRight",
            duration: 5,
          });
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 5,
          });
        }
      }
    } catch (error: AxiosError | any) {
      setIsSubmitting(false);
      notification.error({
        message: error.response?.data.message || error.message,
        placement: "topRight",
        duration: 5,
      });
    }
  };

  const actionBodyTemplate = (data: TQNo) => {
    return (
      <Space>
        <Tooltip title="Call">
          <Button
            type="primary"
            icon={<BellOutlined />}
            onClick={() => {
              setSelectedRecord(data);
              sessionStorage.setItem(
                "selectedInReception",
                JSON.stringify(data)
              );
              handleCall({ ...data, Status: "C" });
            }}
            className="text-center"
            loading={IsSubmitting}
          />
        </Tooltip>
        <Tooltip title="Cancel">
          <Popconfirm
            title="Are you sure to cancel this queue?"
            onConfirm={() => handleCancel(data)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              icon={<GiCancel />}
              // onClick={() => {
              //   handleCancel(data);
              // }}
              danger
              className="text-center"
              loading={IsSubmitting}
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    );
  };
  const actionBodyTemplate2 = (data: TQNo) => {
    return (
      <Space>
        <Tooltip title="Appointment Details">
          <Button
            type="primary"
            icon={<BiNotepad />}
            onClick={() => {
              sessionStorage.setItem(
                "selectedInReception",
                JSON.stringify(data)
              );
              navigate({
                to: "/appointmentdetails/$Id",
                params: {
                  Id: isNullOrUndefinedOrBlank(data.AppointmentId)
                    ? "0"
                    : data.AppointmentId!.toString(),
                },
              });
            }}
            className="text-center"
            loading={IsSubmitting}
          />
        </Tooltip>
      </Space>
    );
  };
  const handleAccept = () => {
    setShowModal(false);
    sessionStorage.setItem(
      "selectedInReception",
      JSON.stringify(selectedRecord)
    );
  };
  useEffect(() => {
    store.setHideSideBar("N");

    handleInitialize();
  }, []);
  return (
    <div className="cardBackground">
      <Divider>
        Reception-
        {Code === "1"
          ? "Diagnostic/APE/Consultation"
          : "Hemodialysis/Ambulatory"}
      </Divider>
      <div>
        <Form
          form={form}
          onFinish={handleRefresh}
          layout="vertical"
          initialValues={{
            Date: dayjs(),
          }}
        >
          <div className="grid grid-cols-6">
            <Form.Item name="Date" label="Date">
              <DatePicker
                format="MM/DD/YYYY"
                onChange={() => handleRefresh(form.getFieldsValue())}
              />
            </Form.Item>
            <Form.Item label="Counter" name="Counter">
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
                onChange={(v) => {
                  localStorage.setItem("counter", v);
                }}
              >
                {counters.data &&
                  counters.data.map((d: any) => (
                    <Select.Option
                      key={d.Code}
                      value={d.Code}
                      title={d.CounterName}
                    >
                      {d.CounterName}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <div className="flex justify-center items-center">
              <Button htmlType="submit" type="primary">
                Refresh List
              </Button>
            </div>
          </div>
        </Form>
      </div>
      <div></div>

      <div className="mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-center font-bold text-md mb-2">
              Patients On Queue
            </div>
            {patientsOnQueue.isLoading || patientsOnQueue.isFetching ? (
              <Loading size={64} />
            ) : (
              <DataTable
                value={patientsOnQueue.data}
                // tableStyle={{ minWidth: "50rem" }}
                // paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                filterDisplay="row"
                emptyMessage="No Records!"
                stripedRows
                size="small"
              >
                <Column
                  field="action"
                  header="Action"
                  body={(dataNotCalled) => actionBodyTemplate(dataNotCalled)}
                ></Column>
                <Column field="QNo" header="Queue No." filter></Column>
                <Column field="Counter" header="Counter" filter></Column>
                <Column field="StatusDesc" header="Status"></Column>
                <Column field="CalledCount" header="Call Count"></Column>
              </DataTable>
            )}
          </div>
          <div>
            <div className="text-center font-bold text-md mb-2">
              Attended Patients
            </div>
            <DataTable
              value={donePatients.data}
              // tableStyle={{ minWidth: "50rem" }}
              // paginator
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
              filterDisplay="row"
              emptyMessage="No Records!"
              stripedRows
              size="small"
              filters={filters}
            >
              <Column
                field="action"
                header="Action"
                body={(dataCalled) => actionBodyTemplate2(dataCalled)}
              ></Column>
              <Column field="QNo" header="Queue No." filter></Column>
              <Column field="Counter" header="Counter" filter></Column>
              {/* <Column field="AppointmentId" header="Appointment Id"></Column> */}
            </DataTable>
          </div>
        </div>
      </div>
      <Modal
        open={showModal}
        destroyOnClose
        onCancel={() => {
          setIsSubmitting(false);
          setShowModal(false);
        }}
        okText="Accept"
        cancelText="Cancel"
        onOk={handleAccept}
        footer={false}
      >
        <Calling size={200} />
        <div className="font-bold text-2xl text-center">
          Calling-{selectedRecord?.QNo}
        </div>
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            type="primary"
            danger
            onClick={() => {
              const data: TQNo = JSON.parse(
                sessionStorage.getItem("selectedInReception")!
              );

              handleCall({ ...data, Status: "O" });
              setShowModal(false);
            }}
          >
            Out When Called
          </Button>
          <Button
            type="primary"
            onClick={() => {
              const data: TQNo = JSON.parse(
                sessionStorage.getItem("selectedInReception")!
              );

              handleCall({ ...data, Status: "A" });
              setShowModal(false);
            }}
          >
            Accept
          </Button>
        </div>
      </Modal>
    </div>
  );
};
