import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { useAuth } from '../../hooks/userAuth';
import { useEffect, useState } from 'react';
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
  Tooltip,
  notification,
} from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { PostData, apiUrl, isNullOrUndefinedOrBlank } from '../../helpers';
import useAppStore from '../../store';
import dayjs from 'dayjs';
import { DataTable } from 'primereact/datatable';
import { TAppointments } from '../../types';
import { Column } from 'primereact/column';
import { SlBookOpen } from 'react-icons/sl';
import { BiNote, BiTrash } from 'react-icons/bi';
import { GiMedicines } from 'react-icons/gi';
import RequestForMedicines from '../../components/RequestForMedicines';
import { FaFileMedical, FaFileWaveform } from 'react-icons/fa6';
import Cookies from 'js-cookie';
import { TbCurrencyPeso } from 'react-icons/tb';
import ResultStatus from '../../components/ResultStatus';
import axios from 'axios';
export const Route = createFileRoute('/_authenticated/appointments')({
  component: () => <Appointments />,
});

const Appointments = () => {
  const [appointments, setAppointments] = useState<
    TAppointments[] | undefined
  >();
  const [selectedRecord, setSelectedRecord] = useState<
    TAppointments | undefined
  >();
  const [showRequest, setShowRequest] = useState(false);
  const [expandedRows, setExpandedRows] = useState(null);
  const q = useQueryClient();
  const [form] = Form.useForm();
  const store = useAppStore();
  const auth = useAuth();
  const router = useRouter();
  const TypeOfAppointment = form.getFieldValue('TypeOfAppointment');

  const handleWithAccess = async () => {
    const res = await auth.isWithAccess(15);
    if (res === false) {
      notification.error({
        message: 'Access denied-Appointments',
        placement: 'topRight',
        duration: 3,
      });
      router.navigate({
        to: '/',
      });
    }
  };

  const handleDelete = async (data: TAppointments) => {
    try {
      const res = await PostData('DeleteAppointment', {
        Id: data.Id,
      });

      if (res) {
        if (res.status === 1) {
          notification.success({
            message: 'Sucessfully deleted!',
            placement: 'topRight',
            duration: 3,
          });
          q.invalidateQueries({
            queryKey: ['appointments'],
          });
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const [isProcessing, setIsProccessing] = useState(false);

  const handlePrintPatientMedicalRecordSheet = async (id: number) => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;
    setIsProccessing(true);
    const url = apiUrl + 'GenerateReport';
    try {
      // setIsProccessing(true);
      await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'PatientMedicalRecordSheet.rdl',
          AppointmentId: id,
          BranchCode: store.branchCode,
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
  const handleRequest = (data: any) => {
    setSelectedRecord(data);
    setShowRequest(true);
  };
  const actionBodyTemplate = (data: TAppointments) => {
    return (
      <Space>
        <Tooltip title="Open">
          <Link
            to="/appointmentdetails/$Id"
            params={{
              Id: data.Id!.toString(),
            }}
          >
            <SlBookOpen size={24} />
          </Link>
        </Tooltip>

        <Tooltip title="Mer">
          <Link
            to="/mer/$AppointmentId"
            params={{
              AppointmentId: data.Id!.toString(),
            }}
          >
            <BiNote size={24} />
          </Link>
        </Tooltip>
        <Tooltip title="Patient Examination Record">
          <Link
            to="/patientexamrecord/$Id"
            params={{
              Id: data.Id!.toString(),
            }}
          >
            <FaFileMedical size={24} />
          </Link>
        </Tooltip>
        {/* <Tooltip title="Chart">
          <Link
            to="/chart/$AppointmentId"
            params={{
              AppointmentId: data.Id!.toString(),
            }}
          >
            <FaFileWaveform size={24} />
          </Link>
        </Tooltip> */}
        <Tooltip title="Patient Medical Record Sheet">
          {/* <Link
            to="/chart/$AppointmentId"
            params={{
              AppointmentId: data.Id!.toString(),
            }}
          >
            <FaFileWaveform size={24} />
          </Link> */}
          <Button
            className="!p-0 !h-5"
            type="link"
            disabled={isProcessing}
            onClick={() => handlePrintPatientMedicalRecordSheet(data.Id!)}
          >
            <FaFileWaveform size={24} className="text-blue-600" />
          </Button>
        </Tooltip>
        <Tooltip title="Request for medicines">
          <Link>
            <GiMedicines
              size={24}
              onClick={() => {
                handleRequest(data);
              }}
            />
          </Link>
        </Tooltip>
        <Tooltip title="Billing">
          <Link
            to="/billing/$AppointmentId"
            params={{
              AppointmentId: data.Id!.toString(),
            }}
          >
            <TbCurrencyPeso size={24} />
          </Link>
        </Tooltip>
        <Tooltip title="Delete Appointment">
          <Popconfirm
            title="Delete Appointment?"
            cancelText="No"
            okText="Yes"
            onConfirm={() => handleDelete(data)}
          >
            <Button danger type="primary" icon={<BiTrash />} />
          </Popconfirm>
        </Tooltip>
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TAppointments) => {
    return (
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="p-3">
            <div>Appointment No.</div>
            <div>
              <strong>{data.AppointmentNo}</strong>
            </div>
            <div>Appointment Id</div>
            <div>
              <strong>{data.Id}</strong>
            </div>

            <div>Updated By</div>
            <div>
              <strong>{data.UpdatedBy}</strong>
            </div>
            <div>Date Updated</div>
            <div>
              <strong>{data.DateUpdated}</strong>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <Divider>Result Status</Divider>
          <ResultStatus AppointmentId={data.Id!} />
        </div>
      </div>
    );
  };
  const handleTypeChange = (value: string) => {
    Cookies.set('TypeOfAppointment', value);
    handleSearch();
  };

  useEffect(() => {
    handleWithAccess();
    form.setFieldsValue({
      DateFrom: dayjs(),
      DateTo: dayjs(),
      TypeOfAppointment: Cookies.get('TypeOfAppointment'),
    });
    q.invalidateQueries({
      queryKey: ['appointments'],
    });
  }, []);
  const handleSearch = async () => {
    try {
      const TypeOfAppointment = form.getFieldValue('TypeOfAppointment');

      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointments',
        parameters: {
          BranchCode: store.branchCode,
          DateFrom: isNullOrUndefinedOrBlank(form.getFieldValue('DateFrom'))
            ? dayjs().format('YYYYMMDD')
            : dayjs(form.getFieldValue('DateFrom')).format('YYYYMMDD'),
          DateTo: isNullOrUndefinedOrBlank(form.getFieldValue('DateTo'))
            ? dayjs().format('YYYYMMDD')
            : dayjs(form.getFieldValue('DateTo')).format('YYYYMMDD'),
          PatientName: isNullOrUndefinedOrBlank(
            form.getFieldValue('PatientName'),
          )
            ? ''
            : form.getFieldValue('PatientName'),
          TypeOfAppointment,
        },
      });
      if (res) {
        setAppointments(res.parameters.lst);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    handleSearch();
  }, [TypeOfAppointment]);

  useEffect(() => {
    handleSearch();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Appointments</Divider>

      <Form form={form} layout="vertical" onFinish={() => handleSearch()}>
        <div className="grid md:grid-cols-8 gap-4">
          <Form.Item
            name="TypeOfAppointment"
            label="Type of Appointment"
            className="col-span-2"
            rules={[
              { required: true, message: 'Please select type of appointment!' },
            ]}
          >
            <Select onChange={handleTypeChange}>
              <Select.Option value="D">Diagnostic</Select.Option>
              <Select.Option value="H">Hemodialysis/ASC</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="DateFrom" label="Date From">
            <DatePicker
              format="MM/DD/YYYY"
              onChange={() => {
                handleSearch();
              }}
            />
          </Form.Item>
          <Form.Item name="DateTo" label="Date To">
            <DatePicker
              format="MM/DD/YYYY"
              onChange={() => {
                handleSearch();
              }}
            />
          </Form.Item>
          <Form.Item
            name="PatientName"
            label="Patient Name"
            className="col-span-2"
          >
            <Input
              onChange={() => {
                q.invalidateQueries({
                  queryKey: ['appointments'],
                });
              }}
            />
          </Form.Item>
          <div className="flex flex-col justify-center">
            <div className="flex flex-row">
              <Space>
                <Button type="primary" htmlType="submit">
                  Search
                </Button>
                <Link
                  to="/appointmentdetails/$Id"
                  params={{
                    Id: '0',
                  }}
                >
                  <Button type="primary">New</Button>
                </Link>
              </Space>
            </div>
          </div>
        </div>
      </Form>
      <div className="mt-2">
        <DataTable
          value={appointments}
          // tableStyle={{ minWidth: "50rem" }}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          filterDisplay="row"
          rowExpansionTemplate={rowExpansionTemplate}
          expandedRows={expandedRows as any}
          onRowToggle={(e) => setExpandedRows(e.data as any)}
        >
          <Column
            expander={appointments && appointments!.length > 0}
            style={{ width: '2rem' }}
          />
          <Column
            field="action"
            header="Action"
            body={(data: any) => actionBodyTemplate(data)}
          ></Column>
          <Column
            field="AppointmentNo"
            header="Appointment No."
            filter
            // style={{ minWidth: "12rem" }}
          ></Column>
          <Column
            field="AppointmentType"
            header="Appointment Type"
            filter
            // style={{ minWidth: "12rem" }}
          ></Column>
          <Column
            field="Name"
            header="Name"
            filter
            // style={{ minWidth: "12rem" }}
          ></Column>
          <Column
            field="DateAdded"
            header="Date Added"
            // style={{ minWidth: "12rem" }}
            filter
          ></Column>
          <Column
            field="QueueNo"
            header="Queue No."
            // style={{ minWidth: "12rem" }}
            filter
          ></Column>
        </DataTable>
      </div>
      <Modal
        open={showRequest}
        destroyOnClose
        onCancel={() => setShowRequest(false)}
        footer={false}
        width={window.innerWidth - 100}
      >
        <RequestForMedicines
          Name={selectedRecord?.Name}
          AppointmentId={selectedRecord?.Id}
        />
      </Modal>
    </div>
  );
};
