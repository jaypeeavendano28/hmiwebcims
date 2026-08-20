import { createLazyFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Select,
  Space,
  Table,
  notification,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { FiFilter, FiPackage, FiRefreshCcw } from 'react-icons/fi';
import { TbClipboardList } from 'react-icons/tb';
import { PostData } from '../../helpers';
import useAppStore from '../../store';
import { TBranches, TDepartments } from '../../types';

export const Route = createLazyFileRoute('/_authenticated/transaction-summary')(
  {
    component: () => <TransactionSummary />,
  },
);

type TChargeCount = {
  ItemId: number;
  ItemName: string;
  ChargeCount: number;
};

type TChargeCountRow = TChargeCount & {
  key: string;
};

type TProcedureFilters = {
  DepartmentId: number;
  DateFrom: string;
  DateTo: string;
  BranchCode: string;
};

type TPackageFilters = {
  DateFrom: string;
  DateTo: string;
  BranchCode: string;
};

type TProcedureFormValues = {
  DepartmentId: number;
  Date: [Dayjs, Dayjs];
  BranchCode: string;
};

type TPackageFormValues = {
  Date: [Dayjs, Dayjs];
  BranchCode: string;
};

const defaultDepartmentId = 1000;
const compactTableClassName =
  '[&_.ant-table-cell]:!px-2 [&_.ant-table-cell]:!py-1 [&_.ant-table-tbody>tr>td]:!text-xs [&_.ant-table-tbody>tr>td]:!leading-tight [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-summary>tr>td]:!text-xs';

const toDateParam = (date: Dayjs) => dayjs(date).format('MM/DD/YYYY');

const getCount = (record: TChargeCount) => Number(record.ChargeCount ?? 0);

const getRows = (data: TChargeCount[] | undefined): TChargeCountRow[] =>
  (data ?? []).map((item, index) => ({
    ...item,
    key: `${item.ItemId}-${index}`,
  }));

const getGrandTotal = (data: TChargeCount[] | undefined) =>
  (data ?? []).reduce((sum, item) => sum + getCount(item), 0);

const chargeCountColumns: TableColumnsType<TChargeCountRow> = [
  {
    title: 'Procedure',
    dataIndex: 'ItemName',
    key: 'ItemName',
    render: (value: string) => value ?? '',
    sorter: (a, b) => (a.ItemName ?? '').localeCompare(b.ItemName ?? ''),
  },
  {
    title: 'Count',
    dataIndex: 'ChargeCount',
    key: 'ChargeCount',
    align: 'right',
    width: 64,
    render: (value: number) => Number(value ?? 0),
    sorter: (a, b) => getCount(a) - getCount(b),
  },
];

const TransactionSummary = () => {
  const store = useAppStore();
  const branchCode = store.branchCode || '01';
  const [procedureForm] = Form.useForm<TProcedureFormValues>();
  const [packageForm] = Form.useForm<TPackageFormValues>();

  const getProcedureFormDefaults = (): TProcedureFormValues => ({
    BranchCode: branchCode,
    DepartmentId: defaultDepartmentId,
    Date: [dayjs(), dayjs()],
  });

  const getPackageFormDefaults = (): TPackageFormValues => ({
    BranchCode: branchCode,
    Date: [dayjs(), dayjs()],
  });

  const getProcedureFilters = (
    values: TProcedureFormValues,
  ): TProcedureFilters => ({
    DepartmentId: values.DepartmentId,
    DateFrom: toDateParam(values.Date[0]),
    DateTo: toDateParam(values.Date[1]),
    BranchCode: values.BranchCode,
  });

  const getPackageFilters = (values: TPackageFormValues): TPackageFilters => ({
    DateFrom: toDateParam(values.Date[0]),
    DateTo: toDateParam(values.Date[1]),
    BranchCode: values.BranchCode,
  });

  const [procedureFilters, setProcedureFilters] = useState<TProcedureFilters>(
    () => getProcedureFilters(getProcedureFormDefaults()),
  );
  const [packageFilters, setPackageFilters] = useState<TPackageFilters>(() =>
    getPackageFilters(getPackageFormDefaults()),
  );

  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await PostData('GetRecords2', {
        sp: 'udp_GetBranches',
        parameters: {},
      });
      return (res?.parameters?.lst ?? []) as TBranches[];
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDepartments',
        parameters: {},
      });
      return (res?.parameters?.lst ?? []) as TDepartments[];
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const procedures = useQuery({
    queryKey: ['charge_count_per_dept_item', procedureFilters],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargeCountPerDeptItem',
        parameters: procedureFilters,
      });
      return (res?.parameters?.lst ?? []) as TChargeCount[];
    },
    enabled:
      !!procedureFilters.BranchCode && !!procedureFilters.DepartmentId,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const packages = useQuery({
    queryKey: ['charge_count_per_package_item', packageFilters],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargeCountPerPackageItem',
        parameters: packageFilters,
      });
      return (res?.parameters?.lst ?? []) as TChargeCount[];
    },
    enabled: !!packageFilters.BranchCode,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const branchOptions = useMemo(
    () =>
      (branches.data ?? []).map((branch) => ({
        value: branch.Code,
        label: branch.Name ?? branch.Code,
      })),
    [branches.data],
  );

  const departmentOptions = useMemo(
    () =>
      (departments.data ?? []).map((department) => ({
        value: department.Id,
        label: department.Description ?? department.Id.toString(),
      })),
    [departments.data],
  );

  const handleInvalidDateRange = (dateFrom: Dayjs, dateTo: Dayjs) => {
    if (!dayjs(dateFrom).isAfter(dateTo, 'day')) {
      return false;
    }

    notification.error({
      message: 'Date From must not be later than Date To.',
      placement: 'topRight',
      duration: 3,
    });

    return true;
  };

  const handleProcedureFilter = (values: TProcedureFormValues) => {
    if (handleInvalidDateRange(values.Date[0], values.Date[1])) {
      return;
    }

    setProcedureFilters(getProcedureFilters(values));
  };

  const handlePackageFilter = (values: TPackageFormValues) => {
    if (handleInvalidDateRange(values.Date[0], values.Date[1])) {
      return;
    }

    setPackageFilters(getPackageFilters(values));
  };

  const handleProcedureReset = () => {
    const values = getProcedureFormDefaults();

    procedureForm.setFieldsValue(values);
    setProcedureFilters(getProcedureFilters(values));
  };

  const handlePackageReset = () => {
    const values = getPackageFormDefaults();

    packageForm.setFieldsValue(values);
    setPackageFilters(getPackageFilters(values));
  };

  const procedureRows = getRows(procedures.data);
  const packageRows = getRows(packages.data);

  return (
    <div className="cardBackGround">
      <div className="mb-2 text-lg font-semibold">Census Summary</div>
      <div className="grid items-start gap-3 xl:grid-cols-2">
        <Card
          size="small"
          className="[&_.ant-card-body]:!p-3"
          title={
            <Space>
              <TbClipboardList />
              Procedures
            </Space>
          }
        >
          <Form
            form={procedureForm}
            layout="vertical"
            requiredMark={false}
            initialValues={getProcedureFormDefaults()}
            onFinish={handleProcedureFilter}
          >
            <div className="grid gap-x-2 md:grid-cols-6">
              <Form.Item
                name="BranchCode"
                label="Branch"
                className="!mb-2 md:col-span-2"
                rules={[{ required: true, message: 'Please select branch' }]}
              >
                <Select
                  size="small"
                  showSearch
                  optionFilterProp="label"
                  options={branchOptions}
                  loading={branches.isLoading}
                />
              </Form.Item>
              <Form.Item
                name="DepartmentId"
                label="Department"
                className="!mb-2 md:col-span-2"
                rules={[
                  { required: true, message: 'Please select department' },
                ]}
              >
                <Select
                  size="small"
                  showSearch
                  optionFilterProp="label"
                  options={departmentOptions}
                  loading={departments.isLoading}
                />
              </Form.Item>
              <Form.Item
                name="Date"
                label="Date"
                className="!mb-2 md:col-span-2"
                rules={[
                  { required: true, message: 'Please select date range' },
                ]}
              >
                <DatePicker.RangePicker
                  size="small"
                  format="MM/DD/YYYY"
                  className="!w-full"
                />
              </Form.Item>
            </div>

            <div className="mb-2 flex justify-end gap-1.5">
              <Button
                size="small"
                type="primary"
                htmlType="submit"
                icon={<FiFilter />}
                loading={procedures.isFetching}
              >
                Filter
              </Button>
              <Button
                size="small"
                icon={<FiRefreshCcw />}
                onClick={handleProcedureReset}
              >
                Reset
              </Button>
            </div>
          </Form>

          <Table
            size="small"
            className={compactTableClassName}
            columns={chargeCountColumns}
            dataSource={procedureRows}
            loading={procedures.isLoading || procedures.isFetching}
            pagination={false}
            scroll={{ x: 360 }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} className="!px-2 !py-1">
                  <strong>Grand Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell
                  index={1}
                  align="right"
                  className="!px-2 !py-1"
                >
                  <strong>{getGrandTotal(procedures.data)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>

        <Card
          size="small"
          className="[&_.ant-card-body]:!p-3"
          title={
            <Space>
              <FiPackage />
              Packages
            </Space>
          }
        >
          <Form
            form={packageForm}
            layout="vertical"
            requiredMark={false}
            initialValues={getPackageFormDefaults()}
            onFinish={handlePackageFilter}
          >
            <div className="grid gap-x-2 md:grid-cols-4">
              <Form.Item
                name="BranchCode"
                label="Branch"
                className="!mb-2 md:col-span-2"
                rules={[{ required: true, message: 'Please select branch' }]}
              >
                <Select
                  size="small"
                  showSearch
                  optionFilterProp="label"
                  options={branchOptions}
                  loading={branches.isLoading}
                />
              </Form.Item>
              <Form.Item
                name="Date"
                label="Date"
                className="!mb-2 md:col-span-2"
                rules={[
                  { required: true, message: 'Please select date range' },
                ]}
              >
                <DatePicker.RangePicker
                  size="small"
                  format="MM/DD/YYYY"
                  className="!w-full"
                />
              </Form.Item>
            </div>

            <div className="mb-2 flex justify-end gap-1.5">
              <Button
                size="small"
                type="primary"
                htmlType="submit"
                icon={<FiFilter />}
                loading={packages.isFetching}
              >
                Filter
              </Button>
              <Button
                size="small"
                icon={<FiRefreshCcw />}
                onClick={handlePackageReset}
              >
                Reset
              </Button>
            </div>
          </Form>

          <Table
            size="small"
            className={compactTableClassName}
            columns={chargeCountColumns}
            dataSource={packageRows}
            loading={packages.isLoading || packages.isFetching}
            pagination={false}
            scroll={{ x: 360 }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} className="!px-2 !py-1">
                  <strong>Grand Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell
                  index={1}
                  align="right"
                  className="!px-2 !py-1"
                >
                  <strong>{getGrandTotal(packages.data)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      </div>
    </div>
  );
};
