import { createFileRoute } from '@tanstack/react-router';
import useAppStore from '../../store';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  DatePicker,
  Empty,
  Form,
  Input,
  Select,
  Spin,
  Table,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiUrl, PostData } from '../../helpers';
import Cookies from 'js-cookie';
import { Chart } from 'primereact/chart';
import dayjs, { Dayjs } from 'dayjs';
import { TBranches } from '../../types';
import {
  FiCalendar,
  FiRepeat,
  FiSearch,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';

type DashboardSummary = {
  TotalAppointments: number;
  UniquePatients: number;
  NewPatients: number;
  RecurringAppointments: number;
};

type AppointmentTrend = {
  PeriodStart: string;
  TotalAppointments: number;
  NewPatients: number;
  RecurringAppointments: number;
};

type ProcedureUtilization = {
  ItemId: number;
  Procedure: string;
  Department: string;
  PatientCount: number;
  AppointmentCount: number;
  ChargeCount: number;
};

type DashboardData = {
  Summary: DashboardSummary;
  Grouping: 'day' | 'month';
  AppointmentTrend: AppointmentTrend[];
  Procedures: ProcedureUtilization[];
};

type DashboardFilter = {
  branchCode: string;
  dateFrom: Dayjs;
  dateTo: Dayjs;
};

const emptySummary: DashboardSummary = {
  TotalAppointments: 0,
  UniquePatients: 0,
  NewPatients: 0,
  RecurringAppointments: 0,
};

const chartTextColor = '#334155';
const chartGridColor = '#e2e8f0';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: () => <Dashboard />,
});

const Dashboard = () => {
  const branchCode = useAppStore((state) => state.branchCode);
  const setHideSideBar = useAppStore((state) => state.setHideSideBar);
  const [procedureSearch, setProcedureSearch] = useState('');
  const [filter, setFilter] = useState<DashboardFilter>({
    branchCode: branchCode || '01',
    dateFrom: dayjs().startOf('year'),
    dateTo: dayjs().endOf('year'),
  });

  useEffect(() => {
    setHideSideBar('N');
  }, [setHideSideBar]);

  const dashboard = useQuery<DashboardData>({
    queryKey: [
      'dashboard',
      filter.branchCode,
      filter.dateFrom.format('YYYY-MM-DD'),
      filter.dateTo.format('YYYY-MM-DD'),
    ],
    queryFn: async () => {
      const response = await axios.get(`${apiUrl}dashboard`, {
        params: {
          branchCode: filter.branchCode,
          dateFrom: filter.dateFrom.format('YYYY-MM-DD'),
          dateTo: filter.dateTo.format('YYYY-MM-DD'),
        },
        headers: {
          Authorization: `Bearer ${Cookies.get('WebCimsTokenId')}`,
        },
      });

      if (response.data?.status !== 1) {
        throw new Error(
          response.data?.message || 'Unable to load dashboard information.',
        );
      }

      return response.data.parameters as DashboardData;
    },
    staleTime: 0,
  });

  const branches = useQuery<TBranches[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await PostData('GetRecords2', {
        sp: 'udp_GetBranches',
        parameters: {},
      });

      return response?.parameters?.lst ?? [];
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const summary = dashboard.data?.Summary ?? emptySummary;
  const grouping = dashboard.data?.Grouping ?? 'month';
  const appointmentTrend = dashboard.data?.AppointmentTrend ?? [];
  const procedures = dashboard.data?.Procedures ?? [];

  const completeTrend = useMemo(() => {
    const trendByPeriod = new Map(
      appointmentTrend.map((item) => [
        dayjs(item.PeriodStart).format(
          grouping === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD',
        ),
        item,
      ]),
    );
    const periods: AppointmentTrend[] = [];
    let currentPeriod = filter.dateFrom.startOf(grouping);
    const finalPeriod = filter.dateTo.startOf(grouping);

    while (
      currentPeriod.isBefore(finalPeriod) ||
      currentPeriod.isSame(finalPeriod)
    ) {
      const periodKey = currentPeriod.format(
        grouping === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD',
      );
      periods.push(
        trendByPeriod.get(periodKey) ?? {
          PeriodStart: currentPeriod.format('YYYY-MM-DD'),
          TotalAppointments: 0,
          NewPatients: 0,
          RecurringAppointments: 0,
        },
      );
      currentPeriod = currentPeriod.add(1, grouping);
    }

    return periods;
  }, [appointmentTrend, filter.dateFrom, filter.dateTo, grouping]);

  const appointmentChartData = useMemo(
    () => ({
      labels: completeTrend.map((item) =>
        dayjs(item.PeriodStart).format(
          grouping === 'month' ? 'MMM YYYY' : 'MMM D',
        ),
      ),
      datasets: [
        {
          label: 'New patients',
          data: completeTrend.map((item) => item.NewPatients),
          backgroundColor: '#16a34a',
          borderRadius: 3,
        },
        {
          label: 'Recurring visits',
          data: completeTrend.map((item) => item.RecurringAppointments),
          backgroundColor: '#d97706',
          borderRadius: 3,
        },
      ],
    }),
    [completeTrend, grouping],
  );

  const patientMixData = useMemo(
    () => ({
      labels: ['New patients', 'Recurring visits'],
      datasets: [
        {
          data: [summary.NewPatients, summary.RecurringAppointments],
          backgroundColor: ['#16a34a', '#d97706'],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    }),
    [summary.NewPatients, summary.RecurringAppointments],
  );

  const topProcedures = useMemo(
    () => procedures.slice(0, 12).reverse(),
    [procedures],
  );
  const procedureChartData = useMemo(
    () => ({
      labels: topProcedures.map((item) => item.Procedure),
      datasets: [
        {
          label: 'Patients',
          data: topProcedures.map((item) => item.PatientCount),
          backgroundColor: '#2563eb',
          borderRadius: 3,
        },
      ],
    }),
    [topProcedures],
  );

  const filteredProcedures = useMemo(() => {
    const searchValue = procedureSearch.trim().toLowerCase();

    if (!searchValue) return procedures;

    return procedures.filter((item) =>
      `${item.Procedure} ${item.Department}`.toLowerCase().includes(searchValue),
    );
  }, [procedureSearch, procedures]);

  const stackedChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: chartTextColor, usePointStyle: true },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: chartTextColor, maxRotation: 45, minRotation: 0 },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: chartGridColor },
        ticks: { color: chartTextColor, precision: 0 },
      },
    },
  };

  const doughnutChartOptions = {
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: chartTextColor, usePointStyle: true },
      },
    },
  };

  const procedureChartOptions = {
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: chartGridColor },
        ticks: { color: chartTextColor, precision: 0 },
      },
      y: {
        grid: { display: false },
        ticks: { color: chartTextColor },
      },
    },
  };

  const summaryCards = [
    {
      label: 'Appointments',
      value: summary.TotalAppointments,
      icon: <FiCalendar />,
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Unique Patients',
      value: summary.UniquePatients,
      icon: <FiUsers />,
      iconClass: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'New Patients',
      value: summary.NewPatients,
      icon: <FiUserPlus />,
      iconClass: 'bg-green-50 text-green-700',
    },
    {
      label: 'Recurring Visits',
      value: summary.RecurringAppointments,
      icon: <FiRepeat />,
      iconClass: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Appointments Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Branch activity and procedure utilization
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Form.Item label="Branch" className="mb-0 min-w-[220px]">
              <Select
                showSearch
                value={filter.branchCode}
                optionFilterProp="label"
                options={branches.data?.map((branch) => ({
                  value: branch.Code,
                  label: branch.Name,
                }))}
                onChange={(branchCode) =>
                  setFilter((previous) => ({ ...previous, branchCode }))
                }
              />
            </Form.Item>
            <Form.Item label="Appointment Date" className="mb-0">
              <DatePicker.RangePicker
                allowClear={false}
                value={[filter.dateFrom, filter.dateTo]}
                onChange={(dates) => {
                  const dateFrom = dates?.[0];
                  const dateTo = dates?.[1];

                  if (!dateFrom || !dateTo) return;

                  setFilter((previous) => ({
                    ...previous,
                    dateFrom,
                    dateTo,
                  }));
                }}
              />
            </Form.Item>
          </div>
        </div>

        {dashboard.isError && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message="Unable to load dashboard"
            description={(dashboard.error as Error).message}
          />
        )}

        <Spin spinning={dashboard.isFetching}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryCards.map((item) => (
              <section
                key={item.label}
                className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {item.value.toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-md text-lg ${item.iconClass}`}
                  >
                    {item.icon}
                  </span>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Appointment Trend
                </h2>
                <p className="text-xs text-slate-500">
                  First visits and recurring visits by {grouping}
                </p>
              </div>
              <div className="h-[330px]">
                <Chart
                  type="bar"
                  data={appointmentChartData}
                  options={stackedChartOptions}
                  style={{ height: '100%' }}
                />
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Patient Visit Type
                </h2>
                <p className="text-xs text-slate-500">
                  New patients compared with recurring appointments
                </p>
              </div>
              <div className="h-[330px]">
                {summary.TotalAppointments > 0 ? (
                  <Chart
                    type="doughnut"
                    data={patientMixData}
                    options={doughnutChartOptions}
                    style={{ height: '100%' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="mt-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Exam and Procedure Utilization
                </h2>
                <p className="text-xs text-slate-500">
                  Unique patients with active, non-inventory procedure charges
                </p>
              </div>
              <Input
                allowClear
                value={procedureSearch}
                onChange={(event) => setProcedureSearch(event.target.value)}
                prefix={<FiSearch className="text-slate-400" />}
                placeholder="Search procedure or department"
                className="w-full sm:w-[320px]"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(520px,1fr)]">
              <div className="h-[420px] min-w-0 border-r-0 border-slate-200 xl:border-r xl:pr-4">
                {topProcedures.length > 0 ? (
                  <Chart
                    type="bar"
                    data={procedureChartData}
                    options={procedureChartOptions}
                    style={{ height: '100%' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                )}
              </div>

              <Table<ProcedureUtilization>
                rowKey="ItemId"
                size="small"
                dataSource={filteredProcedures}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 25, 50],
                }}
                scroll={{ x: 620 }}
                columns={[
                  {
                    title: 'Procedure',
                    dataIndex: 'Procedure',
                    ellipsis: true,
                  },
                  {
                    title: 'Department',
                    dataIndex: 'Department',
                    width: 150,
                    ellipsis: true,
                  },
                  {
                    title: 'Patients',
                    dataIndex: 'PatientCount',
                    width: 90,
                    align: 'right',
                  },
                  {
                    title: 'Appointments',
                    dataIndex: 'AppointmentCount',
                    width: 115,
                    align: 'right',
                  },
                ]}
              />
            </div>
          </section>
        </Spin>
      </div>
    </div>
  );
};
