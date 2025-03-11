import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, DatePicker, Divider, Form } from "antd";
import { PostData } from "../../helpers";
import useAppStore from "../../store";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import Loading from "../../components/loading";
import PatientsPerCounter from "../../components/PatientsPerCounter";
export const Route = createLazyFileRoute(
  "/_authenticated/registeredpatients/$station"
)({
  component: () => <RegisteredPatients />,
});

const RegisteredPatients = () => {
  // const [IsSubmitting, setIsSubmitting] = useState(false);

  const [station] = Route.useParams().station;
  const [header, setHeader] = useState("");
  const [expandedRows, setExpandedRows] = useState(null);
  const store = useAppStore();
  const [form] = Form.useForm();
  const q = useQueryClient();
  const patientPerCounter = useQuery({
    queryKey: ["patientPerCounter"],
    queryFn: async () => {
      let res = await PostData("GetRecords", {
        sp: "udp_GetPatientPerCounter",
        parameters: {
          BranchCode: store.branchCode,
          DateFrom: dayjs(form.getFieldValue("DateFrom")).format("YYYYMMDD"),
          DateTo: dayjs(form.getFieldValue("DateTo")).format("YYYYMMDD"),
          Station: station,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 5,
  });
  const rowExpansionTemplate = (data: any) => {
    return (
      <PatientsPerCounter
        CounterCode={data.CounterCode}
        DateFrom={dayjs(form.getFieldValue("DateFrom")).format("YYYYMMDD")}
        DateTo={dayjs(form.getFieldValue("DateTo")).format("YYYYMMDD")}
        Station={station}
      />
    );
  };

  useEffect(() => {
    form.setFieldsValue({
      DateFrom: dayjs(new Date()),
      DateTo: dayjs(new Date()),
    });
  }, []);
  useEffect(() => {
    if (station === "1") {
      setHeader("Registered Patients");
    } else if (station === "2") {
      setHeader("Consultations");
    } else if (station === "0") {
      setHeader("Hemodialysis/Ambulatory Patients");
    }
  }, [station]);
  return (
    <div className="cardBackGround">
      <Divider>{header}</Divider>
      <Form
        form={form}
        layout="vertical"
        onFinish={() =>
          q.invalidateQueries({ queryKey: ["patientPerCounter"] })
        }
      >
        <div className="grid lg:grid-cols-6">
          <Form.Item name="DateFrom" label="Date From">
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
          <Form.Item name="DateTo" label="Date To">
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
          <div className="flex flex-col justify-center">
            <Button
              type="primary"
              htmlType="submit"
              loading={patientPerCounter.isLoading}
            >
              Refresh List
            </Button>
          </div>
        </div>
      </Form>
      <div className="mt-2">
        {patientPerCounter.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={patientPerCounter.data}
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
              expander={patientPerCounter.data.length > 0}
              style={{ width: "5rem" }}
            />
            <Column field="CounterName" header="Counter Name" filter></Column>
          </DataTable>
        )}
      </div>
    </div>
  );
};
