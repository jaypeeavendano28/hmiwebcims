import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, DatePicker, Empty, Spin } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { MdGroups } from 'react-icons/md';
import { PostData } from '../../helpers';
import useAppStore from '../../store';

export const Route = createFileRoute('/_authenticated/queueoverview')({
  component: () => <QueueOverview />,
});

type DepartmentQueueOverview = {
  DepartmentId: number;
  DepartmentName: string;
  InQueue: number;
  DoneToday: number;
  MaximumWaitTime: number;
  AverageTurnaroundTime: number;
};

const cardColors = [
  'bg-emerald-500',
  'bg-blue-600',
  'bg-cyan-600',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-600',
];

const formatMinutes = (value?: number) => {
  const minutes = Math.max(0, Math.round(Number(value ?? 0)));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes <= 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
};

const getNumber = (value: unknown) => Number(value ?? 0);

const QueueOverview = () => {
  const branchCode = useAppStore((state) => state.branchCode);
  const userId = useAppStore((state) => state.userId);
  const setHideSideBar = useAppStore((state) => state.setHideSideBar);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ]);

  useEffect(() => {
    setHideSideBar('N');
  }, [setHideSideBar]);

  const queueOverview = useQuery<DepartmentQueueOverview[]>({
    queryKey: [
      'department-queue-overview',
      branchCode || '01',
      dateRange[0].format('YYYYMMDD'),
      dateRange[1].format('YYYYMMDD'),
      userId || '0',
    ],
    queryFn: async () => {
      const response = await PostData('GetRecords', {
        sp: 'udp_GetDepartmentQueueOverview',
        parameters: {
          BranchCode: branchCode || '01',
          DateFrom: dateRange[0].format('YYYYMMDD'),
          DateTo: dateRange[1].format('YYYYMMDD'),
          UserId: Number(userId || 0),
        },
      });

      if (response?.status !== 1) {
        throw new Error(
          response?.message || 'Unable to load queue overview.',
        );
      }

      return response.parameters?.lst ?? [];
    },
    refetchInterval: 30000,
  });

  const rows = queueOverview.data ?? [];

  const totals = useMemo(
    () =>
      rows.reduce(
        (summary, row) => ({
          inQueue: summary.inQueue + getNumber(row.InQueue),
          doneToday: summary.doneToday + getNumber(row.DoneToday),
          maxWait: Math.max(summary.maxWait, getNumber(row.MaximumWaitTime)),
          turnaroundTotal:
            summary.turnaroundTotal + getNumber(row.AverageTurnaroundTime),
          turnaroundCount:
            getNumber(row.AverageTurnaroundTime) > 0
              ? summary.turnaroundCount + 1
              : summary.turnaroundCount,
        }),
        {
          inQueue: 0,
          doneToday: 0,
          maxWait: 0,
          turnaroundTotal: 0,
          turnaroundCount: 0,
        },
      ),
    [rows],
  );

  const averageTurnaround =
    totals.turnaroundCount > 0
      ? totals.turnaroundTotal / totals.turnaroundCount
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="m-0 text-xl font-semibold text-slate-900">
            Department Queue Overview
          </h1>
          <p className="m-0 text-sm text-slate-500">
            Live queue, completed procedures, wait time, and turnaround time
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DatePicker.RangePicker
            allowClear={false}
            value={dateRange}
            onChange={(value) => {
              if (value?.[0] && value?.[1]) {
                setDateRange([value[0], value[1]]);
              }
            }}
          />
          <Button
            icon={<FiRefreshCw />}
            loading={queueOverview.isFetching}
            onClick={() => queueOverview.refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Current Queue
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {totals.inQueue.toLocaleString()}
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Done Today
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {totals.doneToday.toLocaleString()}
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Maximum Wait
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {formatMinutes(totals.maxWait)}
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Average Turnaround
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {formatMinutes(averageTurnaround)}
          </div>
        </div>
      </div>

      {queueOverview.isError ? (
        <Alert
          type="error"
          showIcon
          message={(queueOverview.error as Error).message}
        />
      ) : null}

      {queueOverview.isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white py-16">
          <Empty description="No queue overview data" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {rows.map((row, index) => {
            const color = cardColors[index % cardColors.length];

            return (
              <div
                key={row.DepartmentId}
                className="grid grid-cols-[128px_1fr] overflow-hidden border border-slate-200 bg-white shadow-sm sm:grid-cols-[160px_1fr]"
              >
                <div
                  className={`${color} flex min-h-[150px] items-center justify-center text-white`}
                >
                  <MdGroups className="text-6xl opacity-90" />
                </div>
                <div className="flex flex-col justify-center px-5 py-4">
                  <div className="mb-2 text-xl font-bold text-slate-900">
                    {row.DepartmentName}
                  </div>
                  <div className="space-y-1 text-base text-slate-700">
                    <div>
                      In Queue:{' '}
                      <span className="font-semibold text-slate-950">
                        {getNumber(row.InQueue).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      Done Today:{' '}
                      <span className="font-semibold text-slate-950">
                        {getNumber(row.DoneToday).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      Maximum Wait Time:{' '}
                      <span className="font-semibold text-slate-950">
                        {formatMinutes(row.MaximumWaitTime)}
                      </span>
                    </div>
                    <div>
                      Average Turnaround Time for {row.DepartmentName}:{' '}
                      <span className="font-semibold text-slate-950">
                        {formatMinutes(row.AverageTurnaroundTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
