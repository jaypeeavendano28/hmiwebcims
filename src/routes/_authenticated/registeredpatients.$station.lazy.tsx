import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Radio,
  Select,
  Switch,
  Tooltip,
} from "antd";
import { FileExcelOutlined } from "@ant-design/icons";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import useAppStore from "../../store";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import Loading from "../../components/loading";
import PatientsPerCounter from "../../components/PatientsPerCounter";
import type { TDoctors } from "../../types";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
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

type ProfessionalFeeDepartmentType =
  | "LABORATORY"
  | "CARDIOLOGY"
  | "ULTRASOUND"
  | "XRAY"
  | "OTHER";

type ProfessionalFeeFormValues = {
  ProcedureId?: number;
  ProcedureIds?: number[];
  Month: Dayjs;
  ReaderId: number;
  PfPercentage?: number;
};

type ProfessionalFeeStatementRow = {
  DepartmentType?: ProfessionalFeeDepartmentType;
  ReaderId: number;
  ReaderName?: string;
  ResultId: number;
  BranchCode?: string;
  BranchName?: string;
  AppointmentId: number;
  ChargeId: number;
  ItemId: number;
  ProcedureName?: string;
  MemberNo?: string;
  PatientName?: string;
  Diagnosis?: string;
  DateDone?: string;
  OrNo?: string;
  BaseAmount?: number;
  HmiCarePrice?: number;
  PfAmount?: number;
  HmoCompany?: string;
};

type ProfessionalFeeDepartment = {
  DepartmentId: number;
  DepartmentName: string;
  ProcedureId?: number;
};

const DEFAULT_DATE_RANGE: DateRangePreset = "today";
const DATE_QUERY_FORMAT = "YYYYMMDD";
const DATE_DISPLAY_FORMAT = "MM/DD/YYYY";
const PF_TAX_RATE = 0.1;
const SELECT_ALL_PROCEDURES_VALUE = "__ALL_PROCEDURES__";

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

const sanitizeExcelFileName = (value: string) =>
  value.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const getProfessionalFeeDepartmentType = (
  departmentName?: string,
): ProfessionalFeeDepartmentType => {
  const normalizedName = departmentName?.toUpperCase() ?? "";

  if (normalizedName.includes("LAB")) {
    return "LABORATORY";
  }

  if (normalizedName.includes("CARDIO")) {
    return "CARDIOLOGY";
  }

  if (
    normalizedName.includes("ULTRASOUND") ||
    normalizedName.includes("UTZ")
  ) {
    return "ULTRASOUND";
  }

  if (
    normalizedName.includes("XRAY") ||
    normalizedName.includes("X-RAY") ||
    normalizedName.includes("RADIO")
  ) {
    return "XRAY";
  }

  return "OTHER";
};

const canGenerateProfessionalFee = (departmentName?: string) =>
  getProfessionalFeeDepartmentType(departmentName) !== "OTHER";

const exportProfessionalFeeStatement = (
  rows: ProfessionalFeeStatementRow[],
  values: ProfessionalFeeFormValues,
  procedureName: string,
  readerName: string,
  departmentType: ProfessionalFeeDepartmentType,
) => {
  const procedureText =
    procedureName || rows[0]?.ProcedureName || "EXAM/PROCEDURE";
  const branchName = rows[0]?.BranchName || rows[0]?.BranchCode || "";
  const monthText = values.Month.format("MMMM YYYY").toUpperCase();
  const pfRows = rows.map((row) => ({
    ...row,
    HmiCarePrice:
      row.HmiCarePrice === null || row.HmiCarePrice === undefined
        ? undefined
        : roundCurrency(Number(row.HmiCarePrice)),
    PfAmount: roundCurrency(Number(row.PfAmount ?? 0)),
  }));
  const totalGross = roundCurrency(
    pfRows.reduce((sum, row) => sum + row.PfAmount, 0),
  );
  const lessTax = roundCurrency(totalGross * PF_TAX_RATE);
  const totalNet = roundCurrency(totalGross - lessTax);
  const tableStartRow = 6;
  const totalStartRow = tableStartRow + pfRows.length + 2;
  const checkedByStartRow = totalStartRow + 5;
  const useTaxSummary = departmentType !== "LABORATORY";
  const sheetRows = [
    [],
    ["PROCEDURE :", procedureText, "", "", "MEMBER & NON-MEMBER / HMICARE"],
    ["SPECIALIST :", readerName],
    ["DATE :", monthText],
    ["", branchName ? `HMICARE - ${branchName}` : "HMICARE"],
    [],
    [
      "MEM. #",
      "PATIENT NAME",
      "DIAGNOSIS",
      "DATE DONE",
      "EXAMINATION",
      "PP",
      "O.R #",
      "PF",
    ],
    ...pfRows.map((row) => [
      row.MemberNo ?? "",
      row.PatientName ?? "",
      row.Diagnosis ?? "",
      row.DateDone ? dayjs(row.DateDone).format("MM/DD/YYYY") : "",
      row.ProcedureName ?? "",
      row.HmiCarePrice ?? "",
      row.OrNo ?? "",
      row.PfAmount,
    ]),
    [],
    useTaxSummary
      ? ["", "", "", "", "", "", "TOTAL GROSS", totalGross]
      : ["", "", "", "", "", "", "TOTAL AMT.", totalGross],
    useTaxSummary ? ["", "", "", "", "", "", "LESS 10%", lessTax] : [],
    useTaxSummary ? ["", "", "", "", "", "", "TOTAL NET", totalNet] : [],
    [],
    [],
    ["Checked By:"],
    [],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  const border = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };
  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    border,
  };
  const tableCellStyle = {
    alignment: { vertical: "center", wrapText: true },
    border,
  };
  const centerTableCellStyle = {
    ...tableCellStyle,
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  };
  const currencyCellStyle = {
    ...tableCellStyle,
    alignment: { horizontal: "right", vertical: "center" },
    numFmt: "#,##0.00",
  };
  const metadataLabelStyle = {
    font: { bold: true },
    alignment: { horizontal: "left" },
  };
  const metadataValueStyle = {
    font: { bold: true },
    alignment: { horizontal: "left" },
  };
  const totalLabelStyle = {
    font: { bold: true },
    alignment: { horizontal: "right" },
  };
  const totalValueStyle = {
    font: { bold: true },
    alignment: { horizontal: "right" },
    numFmt: "#,##0.00",
  };

  ws["!cols"] = [
    { wch: 16 },
    { wch: 38 },
    { wch: 42 },
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
  ];
  ws["!merges"] = [{ s: { r: 1, c: 4 }, e: { r: 1, c: 7 } }];

  [1, 2, 3].forEach((rowIndex) => {
    const labelCell = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
    const valueCell = XLSX.utils.encode_cell({ r: rowIndex, c: 1 });
    if (ws[labelCell]) {
      ws[labelCell].s = metadataLabelStyle;
    }
    if (ws[valueCell]) {
      ws[valueCell].s = metadataValueStyle;
    }
  });

  const branchCell = XLSX.utils.encode_cell({ r: 4, c: 1 });
  if (ws[branchCell]) {
    ws[branchCell].s = metadataValueStyle;
  }

  const memberLabelCell = XLSX.utils.encode_cell({ r: 1, c: 4 });
  if (ws[memberLabelCell]) {
    ws[memberLabelCell].s = {
      font: { bold: true },
      alignment: { horizontal: "center" },
    };
  }

  for (let columnIndex = 0; columnIndex <= 7; columnIndex++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: tableStartRow,
      c: columnIndex,
    });
    if (ws[cellAddress]) {
      ws[cellAddress].s = headerStyle;
    }
  }

  pfRows.forEach((_, rowOffset) => {
    const rowIndex = tableStartRow + rowOffset + 1;
    for (let columnIndex = 0; columnIndex <= 7; columnIndex++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      if (!ws[cellAddress]) {
        continue;
      }

      if ([0, 3, 4, 6].includes(columnIndex)) {
        ws[cellAddress].s = centerTableCellStyle;
      } else if ([5, 7].includes(columnIndex)) {
        ws[cellAddress].s = currencyCellStyle;
      } else {
        ws[cellAddress].s = tableCellStyle;
      }
    }
  });

  const totalRows = useTaxSummary
    ? [totalStartRow, totalStartRow + 1, totalStartRow + 2]
    : [totalStartRow];
  totalRows.forEach((rowIndex) => {
    const labelCell = XLSX.utils.encode_cell({ r: rowIndex, c: 6 });
    const valueCell = XLSX.utils.encode_cell({ r: rowIndex, c: 7 });
    if (ws[labelCell]) {
      ws[labelCell].s = totalLabelStyle;
    }
    if (ws[valueCell]) {
      ws[valueCell].s = totalValueStyle;
    }
  });

  const finalTotalCell = XLSX.utils.encode_cell({
    r: useTaxSummary ? totalStartRow + 2 : totalStartRow,
    c: 7,
  });
  if (ws[finalTotalCell]) {
    ws[finalTotalCell].s = {
      ...totalValueStyle,
      border: {
        top: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
      },
    };
  }

  const checkedByCell = XLSX.utils.encode_cell({
    r: checkedByStartRow,
    c: 0,
  });
  if (ws[checkedByCell]) {
    ws[checkedByCell].s = { font: { bold: true } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PF Statement");
  const buffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });
  const fileName = sanitizeExcelFileName(
    `PF_${procedureText}_${readerName}_${values.Month.format("YYYYMM")}`,
  );

  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    `${fileName || "Professional_Fee_Statement"}.xlsx`,
  );
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
  const [pfModalOpen, setPfModalOpen] = useState(false);
  const [isGeneratingPf, setIsGeneratingPf] = useState(false);
  const [pfDepartment, setPfDepartment] = useState<
    ProfessionalFeeDepartment | undefined
  >();
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
  const [pfForm] = Form.useForm<ProfessionalFeeFormValues>();
  const searchTextFilter = Form.useWatch("SearchText", form);
  const hasPatientFilter = !isNullOrUndefinedOrBlank(searchTextFilter);
  const pfDepartmentType = getProfessionalFeeDepartmentType(
    pfDepartment?.DepartmentName,
  );
  const isLaboratoryProfessionalFee = pfDepartmentType === "LABORATORY";
  const isXrayProfessionalFee = pfDepartmentType === "XRAY";
  const isUltrasoundProfessionalFee = pfDepartmentType === "ULTRASOUND";

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
  const doctors = useQuery<TDoctors[]>({
    queryKey: ["professionalFeeDoctors", store.branchCode],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetDoctors",
        parameters: {},
      });

      return res?.parameters.lst ?? [];
    },
    refetchOnWindowFocus: false,
    enabled: pfModalOpen,
  });
  const professionalFeeProcedures = useQuery<DepartmentProcedureItem[]>({
    queryKey: [
      "professionalFeeProcedures",
      store.branchCode,
      pfDepartmentType,
      pfDepartment?.DepartmentId,
    ],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetProfessionalFeeProcedures",
        parameters: {
          BranchCode: store.branchCode,
          DepartmentType: pfDepartmentType,
          DepartmentId: pfDepartment?.DepartmentId ?? 0,
        },
      });

      return res?.parameters.lst ?? [];
    },
    refetchOnWindowFocus: false,
    enabled:
      pfModalOpen &&
      Number(pfDepartment?.DepartmentId) > 0 &&
      !isLaboratoryProfessionalFee,
  });
  const professionalFeeReaders = (doctors.data ?? []).filter((doctor) =>
    pfDepartmentType === "LABORATORY" ? doctor.Pathologist : true,
  );
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

  const handleOpenProfessionalFeeModal = (department: any) => {
    const nextDepartment = {
      DepartmentId: Number(department.DepartmentId),
      DepartmentName: department.DepartmentName ?? "",
      ProcedureId: departmentItemFilters[department.DepartmentId],
    };
    const nextDepartmentType = getProfessionalFeeDepartmentType(
      nextDepartment.DepartmentName,
    );
    const selectedProcedureId = nextDepartment.ProcedureId;

    setPfDepartment(nextDepartment);
    pfForm.resetFields();
    pfForm.setFieldsValue({
      Month: dayjs(),
      ProcedureId:
        nextDepartmentType !== "XRAY" &&
        nextDepartmentType !== "LABORATORY" &&
        nextDepartmentType !== "ULTRASOUND"
          ? selectedProcedureId
          : undefined,
      ProcedureIds:
        (nextDepartmentType === "XRAY" ||
          nextDepartmentType === "ULTRASOUND") &&
        selectedProcedureId
          ? [selectedProcedureId]
          : undefined,
      ReaderId: undefined,
      PfPercentage: nextDepartmentType === "ULTRASOUND" ? 25 : undefined,
    });
    setPfModalOpen(true);
  };

  const handleGenerateProfessionalFee = async (
    values: ProfessionalFeeFormValues,
  ) => {
    try {
      setIsGeneratingPf(true);
      const departmentType = getProfessionalFeeDepartmentType(
        pfDepartment?.DepartmentName,
      );
      const procedureIds = values.ProcedureIds ?? [];
      const pfPercentageValue = Number(values.PfPercentage ?? 25);
      const pfPercentage =
        Number.isFinite(pfPercentageValue) && pfPercentageValue >= 0
          ? pfPercentageValue
          : 25;
      const res = await PostData("GetRecords", {
        sp: "udp_GetProfessionalFeeStatement",
        parameters: {
          BranchCode: store.branchCode,
          Month: values.Month.month() + 1,
          Year: values.Month.year(),
          DepartmentType: departmentType,
          ReaderId: values.ReaderId,
          ItemId: values.ProcedureId ?? 0,
          ItemIdsCsv: procedureIds.join(","),
          DepartmentId: pfDepartment?.DepartmentId ?? 0,
          ...(departmentType === "ULTRASOUND"
            ? { PfPercentage: pfPercentage }
            : {}),
        },
      });
      const rows = (res?.parameters.lst ?? []) as ProfessionalFeeStatementRow[];

      if (rows.length === 0) {
        notification.warning({
          message: "No completed results found for the selected PF filters.",
          placement: "topRight",
          duration: 3,
        });
        return;
      }

      const procedureName =
        departmentType === "LABORATORY"
          ? "HISTOPATH / PAPSMEAR"
          : departmentType === "ULTRASOUND"
          ? (professionalFeeProcedures.data ?? [])
              .filter((procedure) => procedureIds.includes(procedure.Id))
              .map((procedure) => procedure.Description)
              .join(", ") || "ULTRASOUND"
          : departmentType === "XRAY"
            ? (professionalFeeProcedures.data ?? [])
                .filter((procedure) => procedureIds.includes(procedure.Id))
                .map((procedure) => procedure.Description)
                .join(", ") || "XRAY"
            : professionalFeeProcedures.data?.find(
                (procedure) => procedure.Id === values.ProcedureId,
              )?.Description ?? rows[0]?.ProcedureName ?? "";
      const readerName =
        professionalFeeReaders.find((reader) => reader.Id === values.ReaderId)
          ?.Name ?? rows[0]?.ReaderName ?? "";

      exportProfessionalFeeStatement(
        rows,
        values,
        procedureName,
        readerName,
        departmentType,
      );
      setPfModalOpen(false);
      setPfDepartment(undefined);
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Unable to generate PF statement.",
        placement: "topRight",
        duration: 3,
      });
    } finally {
      setIsGeneratingPf(false);
    }
  };

  const handleSelectAllProfessionalFeeProcedures = (
    selectedValues: (number | string)[],
  ) => {
    const allProcedureIds = (professionalFeeProcedures.data ?? []).map(
      (procedure) => procedure.Id,
    );

    pfForm.setFieldValue(
      "ProcedureIds",
      selectedValues.includes(SELECT_ALL_PROCEDURES_VALUE)
        ? allProcedureIds
        : selectedValues.filter(
            (selectedValue): selectedValue is number =>
              typeof selectedValue === "number",
          ),
    );
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
                    <div className="flex flex-wrap items-center justify-end gap-2">
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
                      {canGenerateProfessionalFee(
                        department.DepartmentName,
                      ) && (
                        <Tooltip title="Generate PF">
                          <Button
                            aria-label="Generate PF"
                            className="!h-6 !w-6 !p-0 !text-slate-500 hover:!text-sky-600"
                            icon={<FileExcelOutlined />}
                            size="small"
                            type="text"
                            onClick={() =>
                              handleOpenProfessionalFeeModal(department)
                            }
                          />
                        </Tooltip>
                      )}
                    </div>
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
      <Modal
        open={pfModalOpen}
        title={`Generate Professional Fee${
          pfDepartment?.DepartmentName ? ` - ${pfDepartment.DepartmentName}` : ""
        }`}
        footer={null}
        width={620}
        destroyOnClose
        onCancel={() => {
          setPfModalOpen(false);
          setPfDepartment(undefined);
        }}
      >
        <Form
          form={pfForm}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            Month: dayjs(),
            PfPercentage: 25,
          }}
          onFinish={handleGenerateProfessionalFee}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Form.Item
              name="ReaderId"
              label="Specialist Reader"
              rules={[
                {
                  required: true,
                  message: "Please select specialist reader.",
                },
              ]}
            >
              <Select
                showSearch
                loading={doctors.isFetching}
                placeholder="Select reader"
                optionFilterProp="label"
                options={professionalFeeReaders.map((doctor) => ({
                  value: doctor.Id,
                  label: doctor.Name ?? "",
                }))}
              />
            </Form.Item>
            {!isLaboratoryProfessionalFee &&
              (isXrayProfessionalFee || isUltrasoundProfessionalFee ? (
                <Form.Item
                  name="ProcedureIds"
                  label="Exam/Procedure"
                  rules={[
                    {
                      validator: (_, value?: number[]) =>
                        value && value.length > 0
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Please select exam/procedure."),
                            ),
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    showSearch
                    loading={professionalFeeProcedures.isFetching}
                    placeholder="Select exam/procedure"
                    optionFilterProp="label"
                    maxTagCount="responsive"
                    onChange={handleSelectAllProfessionalFeeProcedures}
                    options={[
                      {
                        value: SELECT_ALL_PROCEDURES_VALUE,
                        label: "Select all",
                      },
                      ...(professionalFeeProcedures.data ?? []).map(
                        (procedure) => ({
                          value: procedure.Id,
                          label: procedure.Description,
                        }),
                      ),
                    ]}
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  name="ProcedureId"
                  label="Exam/Procedure"
                  rules={[
                    {
                      required: true,
                      message: "Please select exam/procedure.",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    loading={professionalFeeProcedures.isFetching}
                    placeholder="Select exam/procedure"
                    optionFilterProp="label"
                    options={(professionalFeeProcedures.data ?? []).map(
                      (procedure) => ({
                        value: procedure.Id,
                        label: procedure.Description,
                      }),
                    )}
                  />
                </Form.Item>
              ))}
            <Form.Item
              name="Month"
              label="Month"
              rules={[
                {
                  required: true,
                  message: "Please select month.",
                },
              ]}
            >
              <DatePicker
                picker="month"
                format="MMMM YYYY"
                className="!w-full"
              />
            </Form.Item>
            {isUltrasoundProfessionalFee && (
              <Form.Item
                name="PfPercentage"
                label="PF Percentage"
                rules={[
                  {
                    required: true,
                    message: "Please enter PF percentage.",
                  },
                ]}
              >
                <InputNumber
                  className="!w-full"
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                />
              </Form.Item>
            )}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              onClick={() => {
                setPfModalOpen(false);
                setPfDepartment(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isGeneratingPf}
            >
              Generate Excel
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
