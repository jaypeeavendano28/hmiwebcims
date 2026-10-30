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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PostData, apiUrl, isNullOrUndefinedOrBlank } from '../../helpers';
import useAppStore from '../../store';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { DataTable, type DataTableProps } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { TAppointments } from '../../types';
import { Column } from 'primereact/column';
import { SlBookOpen } from 'react-icons/sl';
import { BiNote, BiTrash } from 'react-icons/bi';
import { GiMedicines } from 'react-icons/gi';
import RequestForMedicines from '../../components/RequestForMedicines';
import { FaFileWaveform } from 'react-icons/fa6';
import Cookies from 'js-cookie';
import { TbCurrencyPeso } from 'react-icons/tb';
import ResultStatus from '../../components/ResultStatus';
import axios from 'axios';
// import axios from 'axios';
export const Route = createFileRoute('/_authenticated/appointments')({
  component: () => <Appointments />,
});

type DateRangePreset = 'today' | '1-week' | '2-weeks' | '1-month' | '3-months';
type DateRangeValue = [Dayjs, Dayjs];
type FormDateRangeValue =
  | [Dayjs | null | undefined, Dayjs | null | undefined]
  | null
  | undefined;

const DEFAULT_DATE_RANGE: DateRangePreset = 'today';
const DATE_QUERY_FORMAT = 'YYYYMMDD';
const DATE_DISPLAY_FORMAT = 'MM/DD/YYYY';

const dateRangeOptions: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '1-week', label: 'Last 1 Week' },
  { value: '2-weeks', label: 'Last 2 Weeks' },
  { value: '1-month', label: 'Last 1 Month' },
  { value: '3-months', label: 'Last 3 Months' },
];

const getDateRange = (
  preset: DateRangePreset = DEFAULT_DATE_RANGE,
): DateRangeValue => {
  const today = dayjs();

  switch (preset) {
    case '1-week':
      return [today.subtract(1, 'week'), today];
    case '2-weeks':
      return [today.subtract(2, 'week'), today];
    case '1-month':
      return [today.subtract(1, 'month'), today];
    case '3-months':
      return [today.subtract(3, 'month'), today];
    case 'today':
    default:
      return [today, today];
  }
};

const dateRangePresets = dateRangeOptions.map(({ value, label }) => ({
  label,
  value: () => getDateRange(value),
}));

const formatDateRange = (value: FormDateRangeValue) => {
  const dateFrom = value?.[0];
  const dateTo = value?.[1];

  return {
    DateFrom: dateFrom?.format(DATE_QUERY_FORMAT),
    DateTo: dateTo?.format(DATE_QUERY_FORMAT),
  };
};

type AppointmentSearch = {
  DateFrom: string | null;
  DateTo: string | null;
  PatientName: string;
  TypeOfAppointment: string;
};

type AppointmentTableFilters = NonNullable<DataTableProps<TAppointments[]>['filters']>;

const getColumnFilterValue = (filters: AppointmentTableFilters, field: string) => {
  const filter = filters[field];
  return filter && 'value' in filter
    ? String(filter.value ?? '').trim()
    : '';
};

const Appointments = () => {
  const [search, setSearch] = useState<AppointmentSearch>(() => {
    const dateRange = formatDateRange(getDateRange());
    return {
      DateFrom: dateRange.DateFrom ?? null,
      DateTo: dateRange.DateTo ?? null,
      PatientName: '',
      TypeOfAppointment: Cookies.get('TypeOfAppointment') ?? 'D',
    };
  });
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [columnFilters, setColumnFilters] = useState<AppointmentTableFilters>({
    AppointmentNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
    AppointmentTypeDesc: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DateOnly: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DateAdded: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Company: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
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
  const patientNameFilter = Form.useWatch('PatientName', form);
  const hasPatientNameFilter = !isNullOrUndefinedOrBlank(patientNameFilter);

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', store.branchCode, search, first, rows, columnFilters],
    enabled: Boolean(store.branchCode),
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointments',
        parameters: {
          BranchCode: store.branchCode,
          ...search,
          PageNumber: Math.floor(first / rows) + 1,
          PageSize: rows,
          AppointmentNoFilter: getColumnFilterValue(columnFilters, 'AppointmentNo'),
          AppointmentTypeDescFilter: getColumnFilterValue(columnFilters, 'AppointmentTypeDesc'),
          NameFilter: getColumnFilterValue(columnFilters, 'Name'),
          DateOnlyFilter: getColumnFilterValue(columnFilters, 'DateOnly'),
          DateAddedFilter: getColumnFilterValue(columnFilters, 'DateAdded'),
          CompanyFilter: getColumnFilterValue(columnFilters, 'Company'),
        },
      });

      if (res?.status !== 1 || !Array.isArray(res.parameters?.lst)) {
        throw new Error(res?.message ?? 'Unable to load appointments.');
      }

      const appointments = res.parameters.lst as TAppointments[];
      return {
        appointments,
        totalRecords: Number(appointments[0]?.TotalCount ?? 0),
      };
    },
  });
  const appointments = appointmentsQuery.data?.appointments ?? [];

  useEffect(() => {
    if (first > 0 && appointmentsQuery.isSuccess && appointments.length === 0) {
      setFirst(Math.max(0, first - rows));
    }
  }, [first, rows, appointmentsQuery.isSuccess, appointments.length]);

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
          if (appointments.length === 1 && first > 0) {
            setFirst(Math.max(0, first - rows));
          }
          void q.invalidateQueries({ queryKey: ['appointments'] });
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
    const canDelete = data.CanDelete !== false;
    const deleteTooltip = canDelete
      ? 'Delete Appointment'
      : data.DeleteBlockReason || 'Appointment already has movement.';

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
        {/* <Tooltip title="Patient Examination Record">
          <Link
            to="/patientexamrecord/$Id"
            params={{
              Id: data.Id!.toString(),
            }}
          >
            <FaFileMedical size={24} />
          </Link>
        </Tooltip> */}
        {/* <Tooltip title="Consultation Results">
          <Link
            to="/consultation/$Id"
            params={{
              Id: data.Id!.toString(),
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
        <Tooltip title={deleteTooltip}>
          <Popconfirm
            title="Delete Appointment?"
            cancelText="No"
            okText="Yes"
            onConfirm={() => handleDelete(data)}
            disabled={!canDelete}
          >
            <Button
              danger
              type="primary"
              icon={<BiTrash />}
              disabled={!canDelete}
            />
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
    form.setFieldValue('TypeOfAppointment', value);
    void handleSearch();
  };

  const handleDateRangeChange = (value: FormDateRangeValue) => {
    if (!value?.[0] || !value?.[1]) {
      return;
    }

    form.setFieldValue('DateRange', value);
    void handleSearch(value);
  };

  useEffect(() => {
    void handleWithAccess();
  }, []);
  const handleSearch = (dateRangeOverride?: FormDateRangeValue) => {
    const patientName = String(form.getFieldValue('PatientName') ?? '').trim();
    const dateRange = formatDateRange(
      dateRangeOverride ?? form.getFieldValue('DateRange') ?? getDateRange(),
    );
    const nextSearch: AppointmentSearch = {
      DateFrom: patientName ? null : dateRange.DateFrom ?? null,
      DateTo: patientName ? null : dateRange.DateTo ?? null,
      PatientName: patientName,
      TypeOfAppointment: form.getFieldValue('TypeOfAppointment') ?? 'D',
    };
    const isSameSearch =
      search.DateFrom === nextSearch.DateFrom &&
      search.DateTo === nextSearch.DateTo &&
      search.PatientName === nextSearch.PatientName &&
      search.TypeOfAppointment === nextSearch.TypeOfAppointment;

    setFirst(0);
    setExpandedRows(null);
    if (first === 0 && isSameSearch) {
      void appointmentsQuery.refetch();
    } else {
      setSearch(nextSearch);
    }
  };
  return (
    <div className="cardBackGround">
      <Divider>Appointments</Divider>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          DateRange: getDateRange(),
          TypeOfAppointment: search.TypeOfAppointment,
        }}
        onFinish={() => handleSearch()}
      >
        <div className="grid md:grid-cols-8 gap-4">
          <Form.Item
            name="TypeOfAppointment"
            label="Type of Appointment"
            className="col-span-2"
            // rules={[
            //   { required: true, message: 'Please select type of appointment!' },
            // ]}
          >
            <Select onChange={handleTypeChange}>
              <Select.Option value="D">Diagnostic</Select.Option>
              <Select.Option value="H">Hemodialysis/ASC</Select.Option>
              <Select.Option value="M">Mobile</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="DateRange" label="Date Range" className="col-span-2">
            <DatePicker.RangePicker
              allowClear={false}
              className="!w-full"
              disabled={hasPatientNameFilter}
              format={DATE_DISPLAY_FORMAT}
              onChange={handleDateRangeChange}
              presets={dateRangePresets}
            />
          </Form.Item>
          <Form.Item
            name="PatientName"
            label="Patient Name"
            className="col-span-2"
          >
            <Input
              onChange={(event) => {
                const hasValue = !isNullOrUndefinedOrBlank(event.target.value);

                form.setFieldValue(
                  'DateRange',
                  hasValue ? undefined : getDateRange(),
                );
              }}
            />
          </Form.Item>
          <div className="flex flex-col justify-center">
            <div className="flex flex-row">
              <Space>
                <Button type="primary" htmlType="submit">
                  Search
                </Button>
                <Link to="/appointmentdetails/new">
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
          lazy
          loading={appointmentsQuery.isFetching}
          first={first}
          rows={rows}
          totalRecords={appointmentsQuery.data?.totalRecords ?? 0}
          onPage={(event) => {
            setExpandedRows(null);
            setFirst(event.first);
            setRows(event.rows);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage={
            appointmentsQuery.isError
              ? 'Unable to load appointments. Please retry.'
              : 'No Records!'
          }
          stripedRows
          size="small"
          filterDisplay="row"
          filters={columnFilters}
          onFilter={(event) => {
            setExpandedRows(null);
            setFirst(0);
            setColumnFilters(event.filters);
          }}
          rowExpansionTemplate={rowExpansionTemplate}
          expandedRows={expandedRows as any}
          onRowToggle={(e) => setExpandedRows(e.data as any)}
        >
          <Column
            expander={appointments.length > 0}
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
            filterMatchMode={FilterMatchMode.CONTAINS}
            // style={{ minWidth: "12rem" }}
          ></Column>
          <Column
            field="AppointmentTypeDesc"
            header="Appointment Type"
            filter
            filterMatchMode={FilterMatchMode.CONTAINS}
            // style={{ minWidth: "12rem" }}
          ></Column>
          <Column
            field="Name"
            header="Name"
            filter
            filterMatchMode={FilterMatchMode.CONTAINS}
            // style={{ minWidth: "12rem" }}
          ></Column>
          <Column
            field="DateOnly"
            header="Appointment Date"
            // style={{ minWidth: "12rem" }}
            filter
            filterMatchMode={FilterMatchMode.CONTAINS}
          ></Column>
          <Column
            field="DateAdded"
            header="Date Added"
            // style={{ minWidth: "12rem" }}
            filter
            filterMatchMode={FilterMatchMode.CONTAINS}
          ></Column>

          <Column
            field="Company"
            header="Patient Company"
            // style={{ minWidth: "12rem" }}
            filter
            filterMatchMode={FilterMatchMode.CONTAINS}
          ></Column>
          {/* <Column
            field="QueueNo"
            header="Queue No."
            // style={{ minWidth: "12rem" }}
            filter
          ></Column> */}
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
