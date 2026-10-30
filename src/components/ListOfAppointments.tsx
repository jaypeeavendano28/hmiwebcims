import { FC, useEffect, useState } from "react";
import { Button, DatePicker, Divider, Form, Input, Space, Tooltip } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DataTable, type DataTableProps } from "primereact/datatable";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import useAppStore from "../store";
import { PostData } from "../helpers";
import { TAppointments } from "../types";
import Loading from "./loading";
import { FaCheck } from "react-icons/fa6";
type Props = {
  handleSelect: (patientId: number) => void;
  TypeOfAppointment?: string;
};

type AppointmentTableFilters = NonNullable<DataTableProps<TAppointments[]>["filters"]>;

const getColumnFilterValue = (filters: AppointmentTableFilters, field: string) => {
  const filter = filters[field];
  return filter && "value" in filter
    ? String(filter.value ?? "").trim()
    : "";
};

const ListOfAppointments: FC<Props> = ({ handleSelect, TypeOfAppointment }) => {
  const [expandedRows, setExpandedRows] = useState(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState(() => ({
    DateFrom: dayjs().format("YYYYMMDD"),
    DateTo: dayjs().format("YYYYMMDD"),
    PatientName: "",
  }));
  const [columnFilters, setColumnFilters] = useState<AppointmentTableFilters>({
    AppointmentNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DateAdded: { value: null, matchMode: FilterMatchMode.CONTAINS },
    QueueNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [form] = Form.useForm();
  const store = useAppStore();

  const appointments = useQuery({
    queryKey: [
      "appointments",
      "lookup",
      store.branchCode,
      TypeOfAppointment,
      search,
      first,
      rows,
      columnFilters,
    ],
    enabled: Boolean(store.branchCode),
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetAppointments",
        parameters: {
          BranchCode: store.branchCode,
          ...search,
          TypeOfAppointment,
          PageNumber: Math.floor(first / rows) + 1,
          PageSize: rows,
          IncludeDeleteStatus: 0,
          AppointmentNoFilter: getColumnFilterValue(columnFilters, "AppointmentNo"),
          NameFilter: getColumnFilterValue(columnFilters, "Name"),
          DateAddedFilter: getColumnFilterValue(columnFilters, "DateAdded"),
          QueueNoFilter: getColumnFilterValue(columnFilters, "QueueNo"),
        },
      });
      if (res?.status !== 1 || !Array.isArray(res.parameters?.lst)) {
        throw new Error(res?.message ?? "Unable to load appointments.");
      }
      const records = res.parameters.lst as TAppointments[];
      return {
        records,
        totalRecords: Number(records[0]?.TotalCount ?? 0),
      };
    },
  });
  useEffect(() => {
    if (first > 0 && appointments.isSuccess && appointments.data.records.length === 0) {
      setFirst(Math.max(0, first - rows));
    }
  }, [first, rows, appointments.isSuccess, appointments.data]);
  const actionBodyTemplate = (data: TAppointments) => {
    return (
      <Space>
        <Tooltip title="Select">
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={() => handleSelect(data.Id!)}
          />
        </Tooltip>
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TAppointments) => {
    return (
      <div className="p-3">
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
    );
  };
  const handleSearch = () => {
    const nextSearch = {
      DateFrom: dayjs(form.getFieldValue("DateFrom") ?? dayjs()).format("YYYYMMDD"),
      DateTo: dayjs(form.getFieldValue("DateTo") ?? dayjs()).format("YYYYMMDD"),
      PatientName: String(form.getFieldValue("PatientName") ?? "").trim(),
    };
    const isSameSearch =
      search.DateFrom === nextSearch.DateFrom &&
      search.DateTo === nextSearch.DateTo &&
      search.PatientName === nextSearch.PatientName;

    setFirst(0);
    setExpandedRows(null);
    if (first === 0 && isSameSearch) {
      void appointments.refetch();
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
        initialValues={{ DateFrom: dayjs(), DateTo: dayjs() }}
        onFinish={handleSearch}
      >
        <div className="grid md:grid-cols-6 gap-4">
          <Form.Item name="DateFrom" label="Date From">
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
          <Form.Item name="DateTo" label="Date To">
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
          <Form.Item
            name="PatientName"
            label="Patient Name"
            className="col-span-2"
          >
            <Input />
          </Form.Item>
          <div className="flex flex-col justify-center">
            <div className="flex flex-row">
              <Space>
                <Button type="primary" htmlType="submit">
                  Search
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </Form>
      <div className="mt-2">
        {appointments.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={appointments.data?.records ?? []}
            // tableStyle={{ minWidth: "50rem" }}
            paginator
            lazy
            loading={appointments.isFetching}
            first={first}
            rows={rows}
            totalRecords={appointments.data?.totalRecords ?? 0}
            onPage={(event) => {
              setExpandedRows(null);
              setFirst(event.first);
              setRows(event.rows);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage={
              appointments.isError
                ? "Unable to load appointments. Please retry."
                : "No Records!"
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
              expander={(appointments.data?.records.length ?? 0) > 0}
              style={{ width: "2rem" }}
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
              field="Name"
              header="Name"
              filter
              filterMatchMode={FilterMatchMode.CONTAINS}
              // style={{ minWidth: "12rem" }}
            ></Column>
            <Column
              field="DateAdded"
              header="Date Added"
              // style={{ minWidth: "12rem" }}
              filter
              filterMatchMode={FilterMatchMode.CONTAINS}
            ></Column>
            <Column
              field="QueueNo"
              header="Queue No."
              // style={{ minWidth: "12rem" }}
              filter
              filterMatchMode={FilterMatchMode.CONTAINS}
            ></Column>
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default ListOfAppointments;
