import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Divider, Form, Input, Radio, Select, Switch } from "antd";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import useAppStore from "../../store";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
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

type QueueSearch = {
  IsMobile?: boolean | string;
  DateRange?: DateRangePreset;
  PatientName?: string;
  MemberNo?: string;
  DepartmentId?: number | string;
  QueueStatus?: "done" | "not-done";
};

type QueueFilterFormValues = {
  DateRange?: DateRangePreset;
  PatientName?: string;
  MemberNo?: string;
  DepartmentId?: number;
  QueueStatus: "done" | "not-done";
};

const DEFAULT_DATE_RANGE: DateRangePreset = "today";

const dateRangeOptions: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "1-week", label: "Last 1 Week" },
  { value: "2-weeks", label: "Last 2 Weeks" },
  { value: "1-month", label: "Last 1 Month" },
  { value: "3-months", label: "Last 3 Months" },
];

const isDateRangePreset = (value: unknown): value is DateRangePreset =>
  dateRangeOptions.some((option) => option.value === value);

const getDateRange = (preset?: DateRangePreset) => {
  const today = dayjs();

  switch (preset) {
    case "1-week":
      return {
        DateFrom: today.subtract(1, "week").format("YYYYMMDD"),
        DateTo: today.format("YYYYMMDD"),
      };
    case "2-weeks":
      return {
        DateFrom: today.subtract(2, "week").format("YYYYMMDD"),
        DateTo: today.format("YYYYMMDD"),
      };
    case "1-month":
      return {
        DateFrom: today.subtract(1, "month").format("YYYYMMDD"),
        DateTo: today.format("YYYYMMDD"),
      };
    case "3-months":
      return {
        DateFrom: today.subtract(3, "month").format("YYYYMMDD"),
        DateTo: today.format("YYYYMMDD"),
      };
    case "today":
    default:
      return {
        DateFrom: today.format("YYYYMMDD"),
        DateTo: today.format("YYYYMMDD"),
      };
  }
};

const RegisteredPatients = () => {
  // const [IsSubmitting, setIsSubmitting] = useState(false);

  const [station] = Route.useParams().station;
  const [expandedRows, setExpandedRows] = useState(null);
  const store = useAppStore();
  const router = useRouter();
  const search = Route.useSearch() as QueueSearch;
  const IsMobile = search.IsMobile === true || search.IsMobile === "true";
  const Name = search.PatientName?.trim() ?? "";
  const MemberNo = search.MemberNo?.trim() ?? "";
  const parsedDepartmentId = Number(search.DepartmentId);
  const DepartmentId =
    Number.isFinite(parsedDepartmentId) && parsedDepartmentId > 0
      ? parsedDepartmentId
      : undefined;
  const isAllAuthorizedDepartments = DepartmentId === undefined;
  const hasSearchTerm =
    !isNullOrUndefinedOrBlank(Name) || !isNullOrUndefinedOrBlank(MemberNo);
  const DateRange = hasSearchTerm
    ? undefined
    : isDateRangePreset(search.DateRange)
      ? search.DateRange
      : DEFAULT_DATE_RANGE;
  const selectedDateRange = getDateRange(DateRange);
  const DateFrom = hasSearchTerm ? "" : selectedDateRange.DateFrom;
  const DateTo = hasSearchTerm ? "" : selectedDateRange.DateTo;
  const isDone = IsMobile || search.QueueStatus === "done";

  const queryClient = useQueryClient();

  const [form] = Form.useForm();
  const patientNameFilter = Form.useWatch("PatientName", form);
  const memberNoFilter = Form.useWatch("MemberNo", form);
  const hasPatientFilter =
    !isNullOrUndefinedOrBlank(patientNameFilter) ||
    !isNullOrUndefinedOrBlank(memberNoFilter);

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
      DateRange,
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
      />
    );
  };

  const rowExpansionTemplate = (data: any) => renderDepartmentPatients(data);

  const updateFilterSearch = (values: QueueFilterFormValues) => {
    setExpandedRows(null);
    void router.navigate({
      to: ".",
      replace: true,
      search: (previous) => ({
        ...previous,
        DateRange: values.DateRange,
        PatientName: isNullOrUndefinedOrBlank(values.PatientName)
          ? undefined
          : values.PatientName,
        MemberNo: isNullOrUndefinedOrBlank(values.MemberNo)
          ? undefined
          : values.MemberNo,
        DepartmentId: values.DepartmentId ?? "all",
        QueueStatus: values.QueueStatus,
      }),
    });
  };

  const handleFilterChange = (
    changedValues: Partial<QueueFilterFormValues>,
    values: QueueFilterFormValues,
  ) => {
    if (
      Object.prototype.hasOwnProperty.call(changedValues, "PatientName") ||
      Object.prototype.hasOwnProperty.call(changedValues, "MemberNo")
    ) {
      const hasNameOrMember =
        !isNullOrUndefinedOrBlank(values.PatientName) ||
        !isNullOrUndefinedOrBlank(values.MemberNo);
      const nextDateRange = hasNameOrMember ? undefined : DEFAULT_DATE_RANGE;

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
      DateRange,
      PatientName: search.PatientName ?? "",
      MemberNo: search.MemberNo ?? "",
      DepartmentId,
      QueueStatus: isDone ? "done" : "not-done",
    });
  }, [
    DateRange,
    DepartmentId,
    form,
    isDone,
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
          DateRange,
          PatientName: search.PatientName ?? "",
          MemberNo: search.MemberNo ?? "",
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
            <Select disabled={hasPatientFilter} options={dateRangeOptions} />
          </Form.Item>
          <Form.Item
            name="PatientName"
            label="Patient Name"
            className="md:col-span-2"
          >
            <Input allowClear />
          </Form.Item>
          <Form.Item
            name="MemberNo"
            label="Member No"
            className="md:col-span-2"
          >
            <Input allowClear />
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
                  <div className="bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                    {department.DepartmentName}
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
