/* eslint-disable react-hooks/exhaustive-deps */
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { PostData, WithAccess, isNullOrUndefinedOrBlank } from '../../helpers';
import useAppStore from '../../store';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Space,
  Tooltip,
  notification,
} from 'antd';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Calling from '../../components/calling';
import { TAppointments, TCharges } from '../../types';
import { BiSearch } from 'react-icons/bi';
import ListOfAppointments from '../../components/ListOfAppointments';
import _ from 'lodash';
import { BsMegaphoneFill } from 'react-icons/bs';
import Cookies from 'js-cookie';
import ListOfOr from '../../components/ListOfOr';
import axios from 'axios';
import {
  FiFileText,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiSave,
} from 'react-icons/fi';

export const Route = createFileRoute('/_authenticated/cashier')({
  component: () => <Cashier />,
});
// const isDev = import.meta.env.DEV;
// const prodApi = import.meta.env.VITE_PROD_API;
// const devApi = import.meta.env.VITE_DEV_API;

// const ApiUrl = isDev ? devApi : prodApi;
const Cashier = () => {
  const [AppointmentId, setAppointmentId] = useState<number | undefined>(
    undefined,
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

  const [open, setOpen] = useState(false);

  const [isProcessing, setIsProccessing] = useState(false);

  const isDev = import.meta.env.DEV;
  const prodApi = import.meta.env.VITE_PROD_API;
  const devApi = import.meta.env.VITE_DEV_API;
  const apiUrl = isDev ? devApi : prodApi;

  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: 'udp_WithAccess',
      parameters: {
        Username: store.username,
        ModuleId: 23,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: 'Access denied for module-Cashier',
          placement: 'topRight',
          duration: 3,
        });
        router.navigate({
          to: '/',
        });
      }
    }
  };

  const handleGetInQueue = async () => {
    const cashierLocation = Cookies.get('CashierLoc');

    let res = await PostData('GetRecords', {
      sp: 'udp_GetPatientPerCounterWithMode',
      parameters: {
        BranchCode: store.branchCode,
        Date: !isNullOrUndefinedOrBlank(form.getFieldValue('Date'))
          ? dayjs(form.getFieldValue('Date')).format('YYYYMMDD')
          : dayjs().format('YYYYMMDD'),
        Mode: 'N',
        CounterName: cashierLocation,
        Mode2: form.getFieldValue('TypeOfAppointment'),
      },
    });
    if (res) {
      setInQueue(res.parameters.lst);
    }
  };
  const handleGetCashierLocations = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetCashierLocations',
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      setCashierLocations(res.parameters.lst);
    }
  };
  const handleGetCharges = async (AppointmentId: number) => {
    let mode = '';
    const cashierLocation = form1.getFieldValue('CashierLocation');

    if (cashierLocation === 'CASHIERHEMO') {
      mode = 'H';
    } else if (cashierLocation === 'CASHIERPHA') {
      mode = 'P';
    } else if (cashierLocation === 'CASHIER') {
      mode = 'D';
    }

    const res = await PostData('GetRecords', {
      sp: 'udp_GetChargesByAppointmentIdForCashier',
      parameters: {
        AppointmentId: AppointmentId,
        Mode: mode,
      },
    });
    if (res) {
      setCharges(res.parameters.lst);
    }
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
              handleCall({ ...data, Status: 'C' });
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
    const res = await PostData('GetRecords', {
      sp: 'udp_GetAppointmentDetails',
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
    let cashierLocation = '';

    if (form.getFieldValue('TypeOfAppointment') === 'D') {
      cashierLocation = 'CASHIER';
    } else if (form.getFieldValue('TypeOfAppointment') === 'H') {
      cashierLocation = 'CASHIERHEMO';
    } else if (form.getFieldValue('TypeOfAppointment') === 'P') {
      cashierLocation = 'CASHIERPHA';
    }

    const valuesToSave = {
      ...data,
      Username: store.username,
      Counter: cashierLocation,
      QNo: data.QueueNo,
      Code: cashierLocation,
    };

    const res = await PostData('CallCounter', valuesToSave);
    if (res) {
      if (res.status === 1) {
        if (data.Status === 'C') {
          setShowModal(true);
        } else if (data.Status === 'O') {
          setSelectedRecord({});
          handleGetInQueue();
        } else if (data.Status === 'A') {
          setShowModal(false);
          handleSelect(selectedRecord.fk_Appointments_Id);
        }
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
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
    const value = form1.getFieldValue('CashierLocation');
    Cookies.set('CashierLocation', value);
    const res = await PostData('GetRecords', {
      sp: 'udp_GetLastOrNo',
      parameters: {
        BranchCode: store.branchCode,
        CashierLocation: value,
      },
    });
    if (res) {
      form1.setFieldValue('OrNo', res.parameters.lst[0].OrNo.toString());
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
    if (!isNullOrUndefinedOrBlank(Cookies.get('CashierLocation'))) {
      form1.setFieldValue('CashierLocation', Cookies.get('CashierLocation'));
      handleGetLastOrNo();
    }
  };
  const handleSavePayment = async () => {
    try {
      if (isNullOrUndefinedOrBlank(charges)) {
        notification.error({
          message: 'Amount to be paid must be greater than zero!',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      let qCounter = '';

      if (form.getFieldValue('TypeOfAppointment') === 'D') {
        qCounter = 'CASHIER';
      } else if (form.getFieldValue('TypeOfAppointment') === 'H') {
        qCounter = 'CASHIERHEMO';
      } else if (form.getFieldValue('TypeOfAppointment') === 'P') {
        qCounter = 'CASHIERPHA';
      }

      const v = await form1.validateFields();

      const cashAmount: number = isNullOrUndefinedOrBlank(
        form1.getFieldValue('Cash'),
      )
        ? 0
        : form1.getFieldValue('Cash');
      const c: number = cashAmount - amount;
      setChange(c);

      if (c < 0) {
        notification.error({
          message: 'Invalid cash amount!',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }
      setSetIsSubmitting(true);

      const res = await PostData('SavePayment', {
        Main: {
          ...v,
          Amount: amount,
          fk_Branches_Code: store.branchCode,
          CashierLocation: form1.getFieldValue('CashierLocation'),
          QId: isNullOrUndefinedOrBlank(selectedRecord) ? 0 : selectedRecord.Id,
          QCounter: qCounter,
        },
        Details: charges,
      });
      if (res) {
        setSetIsSubmitting(false);
        if (res.status === 1) {
          notification.success({
            message: 'Payment successfully saved!',
            placement: 'topRight',
            duration: 3,
          });
          handleRefresh();
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setSetIsSubmitting(false);
      if (!error.errorFields) {
        notification.error({
          message: error.message,
          placement: 'topRight',
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
      form1.getFieldValue('Cash'),
    )
      ? 0
      : form1.getFieldValue('Cash');
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
    if (value === 'H') {
      Cookies.set('CashierLoc', 'CASHIERHEMO');
    } else if (value === 'D') {
      Cookies.set('CashierLoc', 'CASHIER');
    } else if (value === 'P') {
      Cookies.set('CashierLoc', 'CASHIERPHA');
    }

    Cookies.set('TypeOfAppointment', value);

    handleGetInQueue();
  };

  useEffect(() => {
    handleComputeAmount();
    handleComputeChange();
  }, [charges]);

  useEffect(() => {
    if (!isNullOrUndefinedOrBlank(Cookies.get('TypeOfAppointment'))) {
      form.setFieldValue('TypeOfAppointment', Cookies.get('TypeOfAppointment'));
    }
    handleWithAccess();
    handleGetInQueue();
    form.setFieldValue('Date', dayjs());
    handleGetCashierLocations();
    if (!isNullOrUndefinedOrBlank(Cookies.get('CashierLocation'))) {
      form1.setFieldValue('CashierLocation', Cookies.get('CashierLocation'));
      handleGetLastOrNo();
    }
  }, []);

  const handlePrint = async (values: any) => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport';
    const [from, to] = values.date;
    try {
      setIsProccessing(true);
      await axios({
        url: url, //your url
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'Cashier.rdl',
          DateFrom: dayjs(from).startOf('minute').format('YYYY-MM-DDTHH:mm:ss'),
          DateTo: dayjs(to).endOf('minute').format('YYYY-MM-DDTHH:mm:ss'),
          BranchCode: store.branchCode,
          Type: store.userId,
        },
      }).then((response) => {
        let newBlob;
        newBlob = new Blob([response.data], {
          type: 'application/pdf',
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement('a');

        a.setAttribute('href', data);
        a.setAttribute('target', '_blank');

        a.click();
        // setIsSubmitting(false);
      });
    } catch (error: any) {
      // setIsSubmitting(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    } finally {
      setIsProccessing(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Cashier</h1>
            <p className="mt-1 text-xs font-medium uppercase text-slate-500">
              Branch {store.branchCode}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button icon={<FiFileText />} onClick={() => setShowListOfOr(true)}>
              Official Receipts
            </Button>
            <Popover
              open={open}
              content={
                <Form
                  className="w-[420px] max-w-[calc(100vw-48px)]"
                  onFinish={(values: any) => {
                    handlePrint(values);
                    setOpen(false);
                  }}
                  initialValues={{
                    date: [dayjs().startOf('day'), dayjs().endOf('day')],
                  }}
                  requiredMark={false}
                >
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Cashier report period
                  </p>
                  <Form.Item
                    name="date"
                    className="!mb-3"
                    rules={[
                      {
                        required: true,
                        message: 'Please select the report period',
                      },
                    ]}
                  >
                    <DatePicker.RangePicker
                      format="MM/DD/YYYY hh:mm A"
                      showTime={{ format: 'hh:mm A', use12Hours: true }}
                      className="!w-full"
                    />
                  </Form.Item>
                  <div className="flex items-center justify-end gap-2">
                    <Button onClick={() => setOpen(false)} size="small">
                      Close
                    </Button>
                    <Button
                      htmlType="submit"
                      loading={isProcessing}
                      type="primary"
                      size="small"
                      icon={<FiPrinter />}
                    >
                      Print
                    </Button>
                  </div>
                </Form>
              }
              trigger="click"
              arrow={false}
              placement="bottomRight"
            >
              <Button
                type="primary"
                icon={<FiPrinter />}
                loading={isProcessing}
                onClick={() => setOpen(true)}
              >
                Cashier Report
              </Button>
            </Popover>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(380px,0.8fr)_minmax(0,1.7fr)]">
          <section className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <h2 className="text-sm font-semibold text-slate-900">In Queue</h2>
              <span className="min-w-8 rounded bg-slate-100 px-2 py-1 text-center text-xs font-semibold text-slate-700">
                {inQueue?.length ?? 0}
              </span>
            </div>

            <Form
              form={form}
              layout="vertical"
              className="grid grid-cols-1 gap-x-4 border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"
              style={{ padding: '16px 20px 8px' }}
              initialValues={{ Date: dayjs() }}
              onFinish={() => q.invalidateQueries({ queryKey: ['inQueue'] })}
            >
              <Form.Item
                name="TypeOfAppointment"
                label="Appointment Type"
                className="!mb-3"
                rules={[
                  {
                    required: true,
                    message: 'Please select type of appointment!',
                  },
                ]}
              >
                <Select onChange={handleTypeChange}>
                  <Select.Option value="D">Diagnostic</Select.Option>
                  <Select.Option value="H">Hemodialysis/ASC</Select.Option>
                  <Select.Option value="P">Pharmacy</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="Date" label="Date" className="!mb-3">
                <DatePicker format="MM/DD/YYYY" className="w-full" />
              </Form.Item>
            </Form>

            <div className="overflow-x-auto px-4 py-3">
              <DataTable
                value={inQueue}
                tableStyle={{ minWidth: '22rem' }}
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                filterDisplay="row"
                emptyMessage="No records"
                stripedRows
                size="small"
                rowExpansionTemplate={rowExpansionTemplate}
                expandedRows={expandedRows as any}
                onRowToggle={(e) => setExpandedRows(e.data as any)}
              >
                <Column
                  expander={(inQueue?.length ?? 0) > 0}
                  style={{ width: '2.5rem' }}
                />
                <Column
                  field="action"
                  header="Action"
                  body={(data) => actionBodyTemplate(data)}
                  style={{ width: '4.5rem' }}
                />
                <Column field="QueueNo" header="Queue No." />
                <Column field="IsSeniorOrPwd" header="Senior/PWD" />
                <Column field="StatusDesc" header="Status" />
              </DataTable>
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex min-h-14 flex-col justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Payment Details
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {AppointmentId === undefined
                    ? 'No appointment selected'
                    : AppointmentId === 0
                      ? 'Manual payment'
                      : `Appointment #${AppointmentId}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  icon={<FiPlus />}
                  onClick={() => {
                    form1.setFieldValue('Date', dayjs());
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
                  <Button icon={<FiRefreshCw />} disabled={!newMode}>
                    Reset
                  </Button>
                </Popconfirm>
              </div>
            </div>

            <Form
              form={form1}
              layout="vertical"
              initialValues={{ Date: dayjs() }}
              scrollToFirstError
              onFinish={handleSavePayment}
              style={{ padding: 20 }}
            >
              <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(320px,0.8fr)_minmax(440px,1.2fr)]">
                <div className="min-w-0 2xl:border-r 2xl:border-slate-200 2xl:pr-6">
                  <h3 className="mb-3 text-xs font-semibold uppercase text-slate-500">
                    Receipt Information
                  </h3>

                  <Form.Item
                    name="CashierLocation"
                    label="Cashier Location"
                    className="!mb-3"
                    rules={[
                      {
                        required: true,
                        message: 'Cashier location is required!',
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

                  <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                    <Form.Item name="Date" label="Date" className="!mb-3">
                      <DatePicker
                        format="MM/DD/YYYY"
                        className="w-full"
                        onChange={() => {
                          handleGetInQueue();
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="OrNo"
                      label="O.R. No."
                      className="!mb-3"
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="fk_Appointments_Id"
                    label="Appointment ID"
                    className="!mb-3"
                  >
                    <Input
                      readOnly
                      suffix={
                        <Tooltip title="Search patient">
                          <Button
                            type="text"
                            size="small"
                            icon={<BiSearch />}
                            onClick={() => setShowPatient(true)}
                          />
                        </Tooltip>
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    name="Payee"
                    label="Payee"
                    className="!mb-0"
                    rules={[
                      {
                        required: true,
                        message: 'Payee is required!',
                      },
                    ]}
                    normalize={(v) => v.toUpperCase()}
                  >
                    <Input />
                  </Form.Item>
                </div>

                <div className="min-w-0 2xl:pl-1">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-slate-500">
                        Charges
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {charges?.length ?? 0} item(s)
                      </p>
                    </div>
                    <Button
                      icon={<FiPlus />}
                      onClick={() => setShowAddCharges(true)}
                      disabled={AppointmentId === undefined}
                    >
                      Add Charge
                    </Button>
                  </div>

                  <div className="overflow-x-auto border-y border-slate-200">
                    <DataTable
                      value={charges}
                      tableStyle={{ minWidth: '28rem' }}
                      emptyMessage="No records"
                      stripedRows
                      size="small"
                      filterDisplay="row"
                      rowExpansionTemplate={rowExpansionTemplate}
                      expandedRows={expandedRows as any}
                      onRowToggle={(e) => setExpandedRows(e.data as any)}
                    >
                      <Column field="Description" header="Description" />
                      <Column
                        field="Net"
                        header="Amount"
                        className="text-right"
                        alignHeader="right"
                        body={(data: TCharges) =>
                          Number(data.Net ?? 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        }
                        style={{ width: '9rem' }}
                      />
                    </DataTable>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                    <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase text-blue-700">
                        Amount Due
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-950">
                        {amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div>
                      <Form.Item
                        name="Cash"
                        label="Cash Amount"
                        className="!mb-2"
                        rules={[{ required: true }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          onBlur={handleComputeChange}
                        />
                      </Form.Item>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                        <span className="text-sm font-medium text-slate-600">
                          Change
                        </span>
                        <span
                          className={`text-xl font-semibold ${
                            change < 0 ? 'text-red-600' : 'text-green-700'
                          }`}
                        >
                          {change.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      type="primary"
                      size="large"
                      icon={<FiSave />}
                      loading={isSubmitting}
                      onClick={() => handleSavePayment()}
                    >
                      Save Payment
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          </section>
        </div>
      </div>
      <Modal
        title="Queue Call"
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
        <div className="text-center text-2xl font-semibold text-slate-900">
          Calling {selectedRecord?.QueueNo}
        </div>
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            type="primary"
            danger
            onClick={() => {
              handleCall({ ...selectedRecord, Status: 'O' });
              setShowModal(false);
            }}
          >
            Out When Called
          </Button>
          <Button
            type="primary"
            onClick={() => {
              handleCall({ ...selectedRecord, Status: 'A' });
              setShowModal(false);
            }}
          >
            Accept
          </Button>
        </div>
      </Modal>
      <Modal
        title="Select Appointment"
        open={showPatients}
        onCancel={() => setShowPatient(false)}
        width="min(1200px, calc(100vw - 32px))"
        footer={false}
        destroyOnClose
      >
        <ListOfAppointments
          handleSelect={handleSelect}
          TypeOfAppointment={form.getFieldValue('TypeOfAppointment')}
        />
      </Modal>
      <Modal
        title="Add Charge"
        open={showAddCharges}
        onCancel={() => setShowAddCharges(false)}
        destroyOnClose
        footer={false}
        width={520}
      >
        <Form form={formOthers} layout="vertical" onFinish={handleAddCharges}>
          <Form.Item
            name="Description"
            label="Description"
            rules={[
              {
                required: true,
                message: 'Description is required!',
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
                message: 'Amount is required!',
              },
            ]}
          >
            <InputNumber
              style={{
                width: '100%',
              }}
            />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" icon={<FiPlus />}>
              Add
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={showListOfOr}
        onCancel={() => setShowListOfOr(false)}
        footer={false}
        width="min(1500px, calc(100vw - 32px))"
        destroyOnClose
      >
        <ListOfOr />
      </Modal>
    </div>
  );
};
