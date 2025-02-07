/* eslint-disable react-hooks/exhaustive-deps */
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PostData, WithAccess, isNullOrUndefinedOrBlank } from "../../helpers";
import useAppStore from "../../store";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tooltip,
  notification,
} from "antd";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import Calling from "../../components/calling";
import { TAppointments, TCharges } from "../../types";
import { BiSearch } from "react-icons/bi";
import ListOfAppointments from "../../components/ListOfAppointments";
import _ from "lodash";
import { BsMegaphoneFill } from "react-icons/bs";
import Cookies from "js-cookie";
import ListOfOr from "../../components/ListOfOr";

export const Route = createFileRoute("/_authenticated/cashier")({
  component: () => <Cashier />,
});
// const isDev = import.meta.env.DEV;
// const prodApi = import.meta.env.VITE_PROD_API;
// const devApi = import.meta.env.VITE_DEV_API;

// const ApiUrl = isDev ? devApi : prodApi;
const Cashier = () => {
  const [AppointmentId, setAppointmentId] = useState<number | undefined>(
    undefined
  );
  const [showListOfOr, setShowListOfOr] = useState(false);
  const [showAddCharges, setShowAddCharges] = useState(false);
  const [isSubmitting, setSetIsSubmitting] = useState(false);
  const [change, setChange] = useState(0);
  const [amount, setAmount] = useState<number>(0);
  const [newMode, setNewMode] = useState(false);
  const [showPatients, setShowPatient] = useState(false);
  const [charges, setCharges] = useState<TCharges[] | undefined>([]);
  const [expandedRows, setExpandedRows] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState<any | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [cashierLocations, setCashierLocations] = useState([]);
  const [inQueue, setInQueue] = useState([]);
  const q = useQueryClient();
  const [form] = Form.useForm();
  const [form1] = Form.useForm();
  const [formOthers] = Form.useForm();
  const store = useAppStore();
  const router = useRouter();
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: 23,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-Cashier",
          placement: "topRight",
          duration: 3,
        });
        router.navigate({
          to: "/",
        });
      }
    }
  };

  const handleGetInQueue = async () => {
    const cashierLocation = Cookies.get("CashierLoc");
    let res = await PostData("GetRecords", {
      sp: "udp_GetPatientPerCounterWithMode",
      parameters: {
        BranchCode: store.branchCode,
        Date: !isNullOrUndefinedOrBlank(form.getFieldValue("Date"))
          ? dayjs(form.getFieldValue("Date")).format("YYYYMMDD")
          : dayjs().format("YYYYMMDD"),
        Mode: "N",
        CounterName: cashierLocation,
        Mode2: form.getFieldValue("TypeOfAppointment"),
      },
    });
    if (res) {
      setInQueue(res.parameters.lst);
    }
  };
  const handleGetCashierLocations = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetCashierLocations",
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      setCashierLocations(res.parameters.lst);
    }
  };
  const handleGetCharges = async (AppointmentId: number) => {
    let mode = "";
    const cashierLocation = form1.getFieldValue("CashierLocation");

    if (cashierLocation === "CASHIERHEMO") {
      mode = "H";
    } else if (cashierLocation === "CASHIERPHA") {
      mode = "P";
    } else if (cashierLocation === "CASHIER") {
      mode = "D";
    }
    console.log(mode);
    const res = await PostData("GetRecords", {
      sp: "udp_GetChargesByAppointmentIdForCashier",
      parameters: {
        AppointmentId: AppointmentId,
        Mode: mode,
      },
    });
    if (res) {
      setCharges(res.parameters.lst);
    }
  };
  const CardTitile = () => {
    return (
      <div className="mb-2">
        <p className="text-center">Payment Details</p>
        <Space>
          <Button
            type="primary"
            onClick={() => {
              form1.setFieldValue("Date", dayjs());
              setAppointmentId(0);
              setNewMode(true);
              handleGetLastOrNo();
            }}
            disabled={newMode}
          >
            New
          </Button>
          <Popconfirm
            title="Refresh fields now?"
            onConfirm={() => {
              handleRefresh();
            }}
            okText="Yes"
            cancelText="No"
            disabled={!newMode}
          >
            <Button disabled={!newMode} type="primary">
              Refresh Fields
            </Button>
          </Popconfirm>
        </Space>
      </div>
    );
  };
  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Call">
          <Button
            type="primary"
            icon={<BsMegaphoneFill />}
            className="text-center"
            disabled={newMode}
            onClick={() => {
              setSelectedRecord(data);
              handleCall({ ...data, Status: "C" });
              setShowModal(true);
            }}
          />
        </Tooltip>
      </Space>
    );
  };
  const handleSelect = async (appointmenttId: number) => {
    setAppointmentId(appointmenttId);
    setNewMode(true);
    setShowPatient(false);
    const res = await PostData("GetRecords", {
      sp: "udp_GetAppointmentDetails",
      parameters: {
        Id: appointmenttId,
      },
    });
    if (res) {
      const x: TAppointments = res.parameters.lst[0];
      form1.setFieldsValue({
        fk_Appointments_Id: appointmenttId,
        Payee: x.Name,
        Date: dayjs(),
      });
    }
    handleGetCharges(appointmenttId);
    handleGetLastOrNo();
  };

  const handleCall = async (data: any) => {
    // if (data.Status === "C") {
    //   const speech = new SpeechSynthesisUtterance();
    //   const voices = window.speechSynthesis.getVoices();
    //   speech.voice = voices[0]; // change voice

    //   speech.text =
    //     "Patient " + data.QueueNo + " please proceed to " + data.CounterCode;
    //   window.speechSynthesis.speak(speech);
    //   window.speechSynthesis.speak(speech);
    //   window.speechSynthesis.speak(speech);
    // }
    let cashierLocation = "";

    if (form.getFieldValue("TypeOfAppointment") === "D") {
      cashierLocation = "CASHIER";
    } else if (form.getFieldValue("TypeOfAppointment") === "H") {
      cashierLocation = "CASHIERHEMO";
    } else if (form.getFieldValue("TypeOfAppointment") === "P") {
      cashierLocation = "CASHIERPHA";
    }

    const valuesToSave = {
      ...data,
      Username: store.username,
      Counter: cashierLocation,
      QNo: data.QueueNo,
      Code: cashierLocation,
    };

    const res = await PostData("CallCounter", valuesToSave);
    if (res) {
      if (res.status === 1) {
        if (data.Status === "C") {
          setShowModal(true);
        } else if (data.Status === "O") {
          setSelectedRecord({});
          handleGetInQueue();
        } else if (data.Status === "A") {
          setShowModal(false);
          handleSelect(selectedRecord.fk_Appointments_Id);
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
  const rowExpansionTemplate = (data: any) => {
    return (
      <div className="p-3">
        <div>Appointment Id</div>
        <div>
          <strong>{data.fk_Appointments_Id}</strong>
        </div>
      </div>
    );
  };
  const handleGetLastOrNo = async () => {
    const value = form1.getFieldValue("CashierLocation");
    Cookies.set("CashierLocation", value);
    const res = await PostData("GetRecords", {
      sp: "udp_GetLastOrNo",
      parameters: {
        BranchCode: store.branchCode,
        CashierLocation: value,
      },
    });
    if (res) {
      form1.setFieldValue("OrNo", res.parameters.lst[0].OrNo.toString());
    }
  };
  const handleRefresh = () => {
    setAppointmentId(undefined);
    setAmount(0);
    setChange(0);
    setCharges([]);
    setNewMode(false);
    form1.resetFields();
    handleGetInQueue();
    if (!isNullOrUndefinedOrBlank(Cookies.get("CashierLocation"))) {
      form1.setFieldValue("CashierLocation", Cookies.get("CashierLocation"));
      handleGetLastOrNo();
    }
  };
  const handleSavePayment = async () => {
    try {
      if (isNullOrUndefinedOrBlank(charges)) {
        notification.error({
          message: "Amount to be paid must be greater than zero!",
          placement: "topRight",
          duration: 3,
        });
        return;
      }

      let qCounter = "";

      if (form.getFieldValue("TypeOfAppointment") === "D") {
        qCounter = "CASHIER";
      } else if (form.getFieldValue("TypeOfAppointment") === "H") {
        qCounter = "CASHIERHEMO";
      } else if (form.getFieldValue("TypeOfAppointment") === "P") {
        qCounter = "CASHIERPHA";
      }

      const v = await form1.validateFields();

      const cashAmount: number = isNullOrUndefinedOrBlank(
        form1.getFieldValue("Cash")
      )
        ? 0
        : form1.getFieldValue("Cash");
      const c: number = cashAmount - amount;
      setChange(c);

      if (c < 0) {
        notification.error({
          message: "Invalid cash amount!",
          placement: "topRight",
          duration: 3,
        });
        return;
      }
      setSetIsSubmitting(true);
      const res = await PostData("SavePayment", {
        Main: {
          ...v,
          Amount: amount,
          fk_Branches_Code: store.branchCode,
          CashierLocation: form1.getFieldValue("CashierLocation"),
          QId: selectedRecord.Id,
          QCounter: qCounter,
        },
        Details: charges,
      });
      if (res) {
        setSetIsSubmitting(false);
        if (res.status === 1) {
          notification.success({
            message: "Payment successfully saved!",
            placement: "topRight",
            duration: 3,
          });
          handleRefresh();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setSetIsSubmitting(false);
      if (!error.errorFields) {
        notification.error({
          message: error.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };

  const handleComputeAmount = () => {
    let a: number = 0;
    charges?.map((v: any) => {
      a += v.Net;
    });

    setAmount(a);
  };
  const handleComputeChange = () => {
    const cashAmount: number = isNullOrUndefinedOrBlank(
      form1.getFieldValue("Cash")
    )
      ? 0
      : form1.getFieldValue("Cash");
    const c = cashAmount - amount;
    setChange(c);
  };

  // const handlePrintCheckList = async () => {
  //   setSetIsSubmitting(true);
  //   axios.defaults.headers.common["Authorization"] =
  //     "Bearer " + store.tokenIdWebCims;
  //   const url =
  //     ApiUrl +
  //     "/api/GenerateReport?ReportName=checklist.rdl&AppointmentId=" +
  //     AppointmentId;

  //   try {
  //     await axios({
  //       url: url, //your url
  //       method: "GET",
  //       responseType: "blob",
  //       params: {},
  //     }).then((response) => {
  //       let newBlob;
  //       newBlob = new Blob([response.data], {
  //         type: "application/pdf",
  //       });

  //       const data = window.URL.createObjectURL(newBlob);

  //       const a = document.createElement("a");

  //       a.setAttribute("href", data);
  //       a.setAttribute("target", "_blank");

  //       a.click();
  //       setSetIsSubmitting(false);
  //     });
  //   } catch (error: any) {
  //     let errorString = error.response.data;
  //     errorString = JSON.parse(await error.response.data.text());
  //     return { Status: 0, Message: errorString.Message };
  //   }
  // };
  const handleAddCharges = async (v: any) => {
    formOthers.resetFields();
    console.log(v);
    setShowAddCharges(false);
    let addedCharges: TCharges[] = charges as TCharges[];
    const x: TCharges = {
      Id: 0,
      fk_Appointments_Id: 0,
      Description: v.Description,
      Qty: 1,
      Price: v.Amount,
      HmoAmount: 0,
      CashPayment: 0,
      Net: v.Amount,
    };
    addedCharges.push(x);
    setCharges(addedCharges);
    handleComputeAmount();
  };
  const handleTypeChange = (value: string) => {
    if (value === "H") {
      Cookies.set("CashierLoc", "CASHIERHEMO");
    } else if (value === "D") {
      Cookies.set("CashierLoc", "CASHIER");
    } else if (value === "P") {
      Cookies.set("CashierLoc", "CASHIERPHA");
    }

    Cookies.set("TypeOfAppointment", value);

    handleGetInQueue();
  };

  useEffect(() => {
    handleComputeAmount();
    handleComputeChange();
  }, [charges]);

  useEffect(() => {
    if (!isNullOrUndefinedOrBlank(Cookies.get("TypeOfAppointment"))) {
      form.setFieldValue("TypeOfAppointment", Cookies.get("TypeOfAppointment"));
    }
    handleWithAccess();
    handleGetInQueue();
    form.setFieldValue("Date", dayjs());
    handleGetCashierLocations();
    if (!isNullOrUndefinedOrBlank(Cookies.get("CashierLocation"))) {
      form1.setFieldValue("CashierLocation", Cookies.get("CashierLocation"));
      handleGetLastOrNo();
    }
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Cashier</Divider>
      <Button type="primary" onClick={() => setShowListOfOr(true)}>
        List of Official Receipts
      </Button>
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="col-span-4">
          <Card title="In Queue">
            <Form
              form={form}
              onFinish={() => q.invalidateQueries({ queryKey: ["inQueue"] })}
            >
              <Form.Item
                name="TypeOfAppointment"
                label="Type of Appointment"
                rules={[
                  {
                    required: true,
                    message: "Please select type of appointment!",
                  },
                ]}
              >
                <Select onChange={handleTypeChange}>
                  <Select.Option value="D">Diagnostic</Select.Option>
                  <Select.Option value="H">Hemodialysis/ASC</Select.Option>
                  <Select.Option value="P">PHARMACY</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="Date" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
            </Form>
            <DataTable
              value={inQueue}
              // tableStyle={{ minWidth: "50rem" }}
              // paginator
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
              filterDisplay="row"
              emptyMessage="No Records!"
              stripedRows
              size="small"
              rowExpansionTemplate={rowExpansionTemplate}
              expandedRows={expandedRows as any}
              onRowToggle={(e) => setExpandedRows(e.data as any)}
              // filters={filters}
            >
              <Column
                expander={inQueue?.length > 0}
                style={{ width: "2rem" }}
              />
              <Column
                field="action"
                header="Action"
                body={(data) => actionBodyTemplate(data)}
              ></Column>
              <Column field="QueueNo" header="Queue No."></Column>
              <Column field="IsSeniorOrPwd" header="Senior/Pwd"></Column>
              <Column field="StatusDesc" header="Status"></Column>
            </DataTable>
          </Card>
        </div>
        <div className="col-span-8">
          <Card title={<CardTitile />}>
            <Form
              form={form1}
              layout="vertical"
              scrollToFirstError
              onFinish={handleSavePayment}
            >
              <div className="grid lg:grid-cols-2 gap-2">
                <div>
                  <div>
                    <Form.Item
                      name="CashierLocation"
                      label="Cashier Location"
                      rules={[
                        {
                          required: true,
                          message: "Cashier location is required!",
                        },
                      ]}
                    >
                      <Select onChange={handleGetLastOrNo}>
                        {cashierLocations.map((v: any) => (
                          <Select.Option key={v.Code} value={v.Code}>
                            {v.Description}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-2">
                    <Form.Item name="Date" label="Date">
                      <DatePicker
                        format="MM/DD/YYYY"
                        onChange={() => {
                          handleGetInQueue();
                        }}
                      />
                    </Form.Item>
                    <Form.Item name="fk_Appointments_Id" label="Appointment Id">
                      <Input readOnly />
                    </Form.Item>
                    <div className="flex justify-start items-center">
                      <Tooltip title="Search Patient">
                        <Button
                          type="primary"
                          icon={<BiSearch />}
                          onClick={() => setShowPatient(true)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  <Form.Item
                    name="Payee"
                    label="Payee"
                    rules={[
                      {
                        required: true,
                        message: "Payee is required!",
                      },
                    ]}
                    normalize={(v) => v.toUpperCase()}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="OrNo"
                    label="O.R. No."
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </div>
                <div>
                  <div>
                    <Button
                      type="primary"
                      onClick={() => setShowAddCharges(true)}
                      disabled={AppointmentId === undefined}
                    >
                      Add Charges
                    </Button>
                    <DataTable
                      value={charges}
                      emptyMessage="No Records!"
                      stripedRows
                      size="small"
                      filterDisplay="row"
                      rowExpansionTemplate={rowExpansionTemplate}
                      expandedRows={expandedRows as any}
                      onRowToggle={(e) => setExpandedRows(e.data as any)}
                    >
                      {/* <Column
                        field="action"
                        header="Action"
                        body={(data: any) => actionBodyTemplate(data)}
                      ></Column> */}
                      <Column field="Description" header="Description"></Column>
                      <Column field="Net" header="Gross"></Column>
                    </DataTable>
                  </div>
                  <div className="flex justify-end font-bold text-xl">
                    Total:
                    {amount.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </div>

                  <Divider>Payment Options</Divider>
                  <Form.Item
                    name="Cash"
                    label="Cash Amount"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      onBlur={handleComputeChange}
                    />
                  </Form.Item>
                  <div className="flex justify-end font-bold text-xl">
                    Change:{" "}
                    {change.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </div>

                  <div className="flex justify-end mt-2">
                    <Space>
                      <Button
                        type="primary"
                        //  htmlType="submit"
                        // disabled={change < 0}
                        loading={isSubmitting}
                        onClick={() => handleSavePayment()}
                      >
                        Submit
                      </Button>
                      {/* <Button
                        type="primary"
                        //  htmlType="submit"
                        disabled={
                          AppointmentId! <= 0 || AppointmentId === undefined
                        }
                        loading={isSubmitting}
                        onClick={handlePrintCheckList}
                      >
                        Print Check List
                      </Button> */}
                    </Space>
                  </div>
                </div>
              </div>
            </Form>
          </Card>
        </div>
      </div>
      <Modal
        open={showModal}
        destroyOnClose
        onCancel={() => {
          setShowModal(false);
        }}
        okText="Accept"
        cancelText="Cancel"
        footer={false}
      >
        <Calling size={200} />
        <div className="font-bold text-2xl text-center">
          Calling-{selectedRecord?.QueueNo}
        </div>
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            type="primary"
            danger
            onClick={() => {
              handleCall({ ...selectedRecord, Status: "O" });
              setShowModal(false);
            }}
          >
            Out When Called
          </Button>
          <Button
            type="primary"
            onClick={() => {
              handleCall({ ...selectedRecord, Status: "A" });
              setShowModal(false);
            }}
          >
            Accept
          </Button>
        </div>
      </Modal>
      <Modal
        open={showPatients}
        onCancel={() => setShowPatient(false)}
        width={1200}
        footer={false}
        destroyOnClose
      >
        <ListOfAppointments
          handleSelect={handleSelect}
          TypeOfAppointment={form.getFieldValue("TypeOfAppointment")}
        />
      </Modal>
      <Modal
        open={showAddCharges}
        onCancel={() => setShowAddCharges(false)}
        destroyOnClose
        footer={false}
      >
        <Form form={formOthers} layout="vertical" onFinish={handleAddCharges}>
          <Form.Item
            name="Description"
            label="Description"
            rules={[
              {
                required: true,
                message: "Description is required!",
              },
            ]}
            normalize={(v) => v.toUpperCase()}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            name="Amount"
            label="Amount"
            rules={[
              {
                required: true,
                message: "Amount is required!",
              },
            ]}
          >
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit">
              Add
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={showListOfOr}
        onCancel={() => setShowListOfOr(false)}
        footer={false}
        width={screen.width - 200}
        destroyOnClose
      >
        <ListOfOr />
      </Modal>
    </div>
  );
};
