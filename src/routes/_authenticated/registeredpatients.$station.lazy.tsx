import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DatePicker, Divider, Form, Input, Radio, Select, Switch } from "antd";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import useAppStore from "../../store";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import Loading from "../../components/loading";
import PatientsPerCounter from "../../components/PatientsPerCounter";
export const Route = createLazyFileRoute(
  "/_authenticated/registeredpatients/$station",
)({
  component: () => <RegisteredPatients />,
});

type DateRangePreset = "today" | "1-week" | "2-weeks" | "1-month" | "3-months";
type DateRangeValue = [Dayjs, Dayjs];
type FormDateRangeValue =
  | [Dayjs | null | undefined, Dayjs | null | undefined]
  | null
  | undefined;

type QueueSearch = {
  IsMobile?: boolean | string;
  DateRange?: DateRangePreset;
  DateFrom?: string;
  DateTo?: string;
  SearchText?: string;
  PatientName?: string;
  MemberNo?: string;
  DepartmentId?: number | string;
  QueueStatus?: "done" | "not-done";
};

type QueueFilterFormValues = {
  DateRange?: FormDateRangeValue;
  SearchText?: string;
  DepartmentId?: number;
  QueueStatus: "done" | "not-done";
};

type DepartmentItemFilterProps = {
  DepartmentId?: number;
  value?: number;
  onChange: (value?: number) => void;
};

type DepartmentProcedureItem = {
  Id: number;
  Description: string;
};

const DEFAULT_DATE_RANGE: DateRangePreset = "today";
const DATE_QUERY_FORMAT = "YYYYMMDD";
const DATE_DISPLAY_FORMAT = "MM/DD/YYYY";

const dateRangeOptions: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "1-week", label: "Last 1 Week" },
  { value: "2-weeks", label: "Last 2 Weeks" },
  { value: "1-month", label: "Last 1 Month" },
  { value: "3-months", label: "Last 3 Months" },
];

const isDateRangePreset = (value: unknown): value is DateRangePreset =>
  dateRangeOptions.some((option) => option.value === value);

const getDateRange = (
  preset: DateRangePreset = DEFAULT_DATE_RANGE,
): DateRangeValue => {
  const today = dayjs();

  switch (preset) {
    case "1-week":
      return [today.subtract(1, "week"), today];
    case "2-weeks":
      return [today.subtract(2, "week"), today];
    case "1-month":
      return [today.subtract(1, "month"), today];
    case "3-months":
      return [today.subtract(3, "month"), today];
    case "today":
    default:
      return [today, today];
  }
};

const dateRangePresets = dateRangeOptions.map(({ value, label }) => ({
  label,
  value: () => getDateRange(value),
}));

const parseDateQueryValue = (value?: string) => {
  if (!value || !/^\d{8}$/.test(value)) {
    return undefined;
  }

  const parsed = dayjs(
    `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`,
  );

  return parsed.isValid() && parsed.format(DATE_QUERY_FORMAT) === value
    ? parsed
    : undefined;
};

const getDateRangeFromSearch = (search: QueueSearch): DateRangeValue => {
  const dateFrom = parseDateQueryValue(search.DateFrom);
  const dateTo = parseDateQueryValue(search.DateTo);

  if (dateFrom && dateTo) {
    return [dateFrom, dateTo];
  }

  if (isDateRangePreset(search.DateRange)) {
    return getDateRange(search.DateRange);
  }

  return getDateRange();
};

const getDateRangeFromQueryValues = (
  dateFrom: string,
  dateTo: string,
): DateRangeValue | undefined => {
  const parsedDateFrom = parseDateQueryValue(dateFrom);
  const parsedDateTo = parseDateQueryValue(dateTo);

  if (!parsedDateFrom || !parsedDateTo) {
    return undefined;
  }

  return [parsedDateFrom, parsedDateTo];
};

const formatDateRange = (value: FormDateRangeValue) => {
  const dateFrom = value?.[0];
  const dateTo = value?.[1];

  return {
    DateFrom: dateFrom?.format(DATE_QUERY_FORMAT),
    DateTo: dateTo?.format(DATE_QUERY_FORMAT),
  };
};

const DepartmentItemFilter = ({
  DepartmentId,
  value,
  onChange,
}: DepartmentItemFilterProps) => {
  const procedureItems = useQuery<DepartmentProcedureItem[]>({
    queryKey: ["departmentProcedureItems", DepartmentId],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetProcedureItemsByDepartment",
        parameters: {
          DepartmentId,
        },
      });

      return res?.parameters.lst ?? [];
    },
    enabled: Number(DepartmentId) > 0,
    refetchOnWindowFocus: false,
  });

  return (
    <Select
      allowClear
      showSearch
      size="small"
      className="min-w-[220px]"
      loading={procedureItems.isFetching}
      placeholder="All exam/procedure"
      optionFilterProp="label"
      value={value}
      onChange={(selectedValue) => onChange(selectedValue)}
      options={(procedureItems.data ?? []).map((item) => ({
        value: item.Id,
        label: item.Description,
      }))}
    />
  );
};

const RegisteredPatients = () => {
  // const [IsSubmitting, setIsSubmitting] = useState(false);

  const [station] = Route.useParams().station;
  const [expandedRows, setExpandedRows] = useState(null);
  const [departmentItemFilters, setDepartmentItemFilters] = useState<
    Record<string, number | undefined>
  >({});
  const store = useAppStore();
  const router = useRouter();
  const search = Route.useSearch() as QueueSearch;
  const IsMobile = search.IsMobile === true || search.IsMobile === "true";
  const SearchText = (
    search.SearchText ??
    search.PatientName ??
    search.MemberNo ??
    ""
  ).trim();
  const Name = SearchText;
  const MemberNo = "";
  const parsedDepartmentId = Number(search.DepartmentId);
  const DepartmentId =
    Number.isFinite(parsedDepartmentId) && parsedDepartmentId > 0
      ? parsedDepartmentId
      : undefined;
  const isAllAuthorizedDepartments = DepartmentId === undefined;
  const hasSearchTerm = !isNullOrUndefinedOrBlank(SearchText);
  const selectedDateRange = getDateRangeFromSearch(search);
  const DateFrom = hasSearchTerm
    ? ""
    : selectedDateRange[0].format(DATE_QUERY_FORMAT);
  const DateTo = hasSearchTerm
    ? ""
    : selectedDateRange[1].format(DATE_QUERY_FORMAT);
  const isDone = IsMobile || search.QueueStatus === "done";

  const queryClient = useQueryClient();

  const [form] = Form.useForm();
  const searchTextFilter = Form.useWatch("SearchText", form);
  const hasPatientFilter = !isNullOrUndefinedOrBlank(searchTextFilter);

  const departments = useQuery({
    queryKey: ["queueDepartments", store.userId],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetAccessibleDepartments",
        parameters: {
          UserId: store.userId,
        },
      });
      return res?.parameters.lst ?? [];
    },
    refetchOnWindowFocus: false,
    enabled: station === "1",
  });
  const accessibleDepartments = departments.data ?? [];
  const hasSelectedDepartmentAccess =
    DepartmentId !== undefined &&
    accessibleDepartments.some(
      (department: any) => Number(department.Id) === DepartmentId,
    );
  const hasDepartmentScope =
    isAllAuthorizedDepartments || hasSelectedDepartmentAccess;

  // const dateFrom = form.getFieldValue('date')
  //   ? dayjs(form.getFieldValue('date')[0]).format('YYYYMMDD')
  //   : '';
  // const dateTo = form.getFieldValue('date')
  //   ? dayjs(form.getFieldValue('date')[1]).format('YYYYMMDD')
  //   : '';

  const patientPerCounter = useQuery({
    queryKey: [
      "patientPerCounter",
      store.branchCode,
      station,
      DateFrom,
      DateTo,
      isDone,
      Name,
      MemberNo,
      DepartmentId,
      isAllAuthorizedDepartments,
      IsMobile,
    ],
    queryFn: async () => {
      const request = IsMobile
        ? {
            sp: "udp_GetMobileDepartments",
            parameters: {
              BranchCode: store.branchCode,
              DateFrom: DateFrom ?? "",
              DateTo: DateTo ?? "",
              UserId: store.userId,
              Name,
              MemberNo,
              DepartmentId: DepartmentId ?? 0,
            },
          }
        : {
            sp: isDone
              ? "udp_GetQueueDepartments"
              : "udp_GetQueueCountersByDepartment",
            parameters: {
              BranchCode: store.branchCode,
              DateFrom: DateFrom ?? "",
              DateTo: DateTo ?? "",
              Station: station,
              UserId: store.userId,
              isDone,
              Name,
              MemberNo,
              IsMobile: false,
              DepartmentId: DepartmentId ?? 0,
            },
          };
      const res = await PostData("GetRecords", request);
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 5,
    enabled: departments.isSuccess && hasDepartmentScope,
  });

  const renderDepartmentPatients = (data: any, compact = false) => {
    return (
      <PatientsPerCounter
        CounterCode={data.CounterCode}
        DepartmentId={
          data.DepartmentId ?? (isAllAuthorizedDepartments ? 0 : undefined)
        }
        // DateFrom={
        //   form.getFieldValue('DateFrom')
        //     ? dayjs(form.getFieldValue('DateFrom')[0]).format('YYYYMMDD')
        //     : ''
        // }
        // DateTo={
        //   form.getFieldValue('DateTo')
        //     ? dayjs(form.getFieldValue('DateTo')[1]).format('YYYYMMDD')
        //     : ''
        // }
        DateFrom={DateFrom ?? ""}
        DateTo={DateTo ?? ""}
        Station={station}
        isDone={isDone}
        Name={Name}
        MemberNo={MemberNo}
        IsMobile={IsMobile}
        Compact={compact}
        ItemId={
          data.DepartmentId ? departmentItemFilters[data.DepartmentId] : undefined
        }
      />
    );
  };

  const rowExpansionTemplate = (data: any) => renderDepartmentPatients(data);

  const updateFilterSearch = (values: QueueFilterFormValues) => {
    const dateRange = formatDateRange(values.DateRange);

    setExpandedRows(null);
    void router.navigate({
      to: ".",
      replace: true,
      search: (previous) => ({
        ...previous,
        DateRange: undefined,
        DateFrom: dateRange.DateFrom,
        DateTo: dateRange.DateTo,
        SearchText: isNullOrUndefinedOrBlank(values.SearchText)
          ? undefined
          : values.SearchText,
        PatientName: undefined,
        MemberNo: undefined,
        DepartmentId: values.DepartmentId ?? "all",
        QueueStatus: values.QueueStatus,
      }),
    });
  };

  const handleFilterChange = (
    changedValues: Partial<QueueFilterFormValues>,
    values: QueueFilterFormValues,
  ) => {
    if (Object.prototype.hasOwnProperty.call(changedValues, "SearchText")) {
      const hasSearchValue = !isNullOrUndefinedOrBlank(values.SearchText);
      const nextDateRange = hasSearchValue ? undefined : getDateRange();

      form.setFieldValue("DateRange", nextDateRange);
      updateFilterSearch({
        ...values,
        DateRange: nextDateRange,
      });
      return;
    }

    updateFilterSearch(values);
  };

  useEffect(() => {
    setDepartmentItemFilters({});
  }, [DateFrom, DateTo, DepartmentId, SearchText, isDone, IsMobile]);

  useEffect(() => {
    if (!departments.isSuccess) {
      return;
    }

    if (isAllAuthorizedDepartments) {
      return;
    }

    if (hasSelectedDepartmentAccess) {
      return;
    }

    form.setFieldValue("DepartmentId", undefined);
    void router.navigate({
      to: ".",
      replace: true,
      search: (previous) => ({
        ...previous,
        DepartmentId: "all",
      }),
    });
  }, [
    accessibleDepartments,
    departments.isSuccess,
    form,
    hasSelectedDepartmentAccess,
    isAllAuthorizedDepartments,
    router,
  ]);

  useEffect(() => {
    form.setFieldsValue({
      DateRange: hasSearchTerm
        ? undefined
        : getDateRangeFromQueryValues(DateFrom, DateTo),
      SearchText,
      DepartmentId,
      QueueStatus: isDone ? "done" : "not-done",
    });
  }, [
    DateFrom,
    DateTo,
    DepartmentId,
    form,
    hasSearchTerm,
    isDone,
    SearchText,
    search.MemberNo,
    search.PatientName,
  ]);

  useEffect(() => {
    if (station !== "1") {
      void router.navigate({
        to: "/registeredpatients/$station",
        params: {
          station: "1",
        },
        replace: true,
        search: (previous) => previous,
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["patientPerCounter"] });
  }, [queryClient, router, station]);
  return (
    <div className="cardBackGround">
      <Divider>Department List</Divider>
      <Form
        form={form}
        initialValues={{
          DateRange: hasSearchTerm
            ? undefined
            : getDateRangeFromQueryValues(DateFrom, DateTo),
          SearchText,
          DepartmentId,
          QueueStatus: isDone ? "done" : "not-done",
        }}
        layout="vertical"
        onValuesChange={handleFilterChange}
      >
        <div className="grid gap-4 md:grid-cols-12">
          <Form.Item
            name="DateRange"
            label="Date Range"
            className="md:col-span-2"
          >
            <DatePicker.RangePicker
              allowClear={false}
              className="!w-full"
              disabled={hasPatientFilter}
              format={DATE_DISPLAY_FORMAT}
              presets={dateRangePresets}
            />
          </Form.Item>
          <Form.Item
            name="SearchText"
            label="Search"
            className="md:col-span-4"
          >
            <Input allowClear placeholder="Patient name, member no, company" />
          </Form.Item>
          <Form.Item
            name="DepartmentId"
            label="Department"
            className="md:col-span-2"
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="All departments"
              options={accessibleDepartments.map((department: any) => ({
                value: department.Id,
                label: department.Description,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="QueueStatus"
            label="Queue Status"
            className="md:col-span-2"
          >
            <Radio.Group disabled={IsMobile}>
              <Radio value="done"> Completed </Radio>
              <Radio value="not-done"> In Queue </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="Mobile" className="md:col-span-1">
            <Switch
              checked={IsMobile}
              checkedChildren="Yes"
              unCheckedChildren="No"
              onChange={(checked) => {
                const nextQueueStatus = checked ? "done" : "not-done";
                form.setFieldValue("QueueStatus", nextQueueStatus);
                void router.navigate({
                  to: ".",
                  replace: true,
                  search: (prev) => ({
                    ...prev,
                    IsMobile: checked,
                    QueueStatus: nextQueueStatus,
                  }),
                });
              }}
            />
          </Form.Item>
        </div>
      </Form>
      <div className="mt-2">
        {departments.isSuccess && accessibleDepartments.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No department access assigned.
          </div>
        ) : patientPerCounter.isLoading ? (
          <Loading size={64} />
        ) : isDone ? (
          <div className="space-y-2">
            {(patientPerCounter.data ?? []).length === 0 ? (
              <div className="py-8 text-center text-gray-500">No Records!</div>
            ) : (
              (patientPerCounter.data ?? []).map((department: any) => (
                <section
                  key={department.DepartmentId}
                  className="overflow-hidden rounded border border-gray-200"
                >
                  <div className="flex items-center justify-between gap-3 bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                    <span>{department.DepartmentName}</span>
                    <DepartmentItemFilter
                      DepartmentId={department.DepartmentId}
                      value={departmentItemFilters[department.DepartmentId]}
                      onChange={(value) =>
                        setDepartmentItemFilters((previous) => ({
                          ...previous,
                          [department.DepartmentId]: value,
                        }))
                      }
                    />
                  </div>
                  <div className="p-1">
                    {renderDepartmentPatients(department, true)}
                  </div>
                </section>
              ))
            )}
          </div>
        ) : (
          <DataTable
            value={patientPerCounter.data}
            dataKey="RowKey"
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            filterDisplay="row"
            emptyMessage="No Records!"
            stripedRows
            size="normal"
            rowExpansionTemplate={rowExpansionTemplate}
            expandedRows={expandedRows as any}
            onRowToggle={(e) => setExpandedRows(e.data as any)}
            tableStyle={{ fontSize: "12px", fontWeight: "bold" }}
          >
            <Column
              expander={(patientPerCounter.data ?? []).length > 0}
              style={{ width: "5rem" }}
            />
            <Column field="CounterName" header="Counter Name" filter></Column>
            <Column
              field="AppointmentCount"
              header="Appointments"
              className="text-center"
            />
          </DataTable>
        )}
      </div>
    </div>
  );
};
