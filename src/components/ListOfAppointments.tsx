import { FC, useEffect, useState } from "react";
import { Button, DatePicker, Divider, Form, Input, Space, Tooltip } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import useAppStore from "../store";
import { PostData, isNullOrUndefinedOrBlank } from "../helpers";
import { TAppointments } from "../types";
import Loading from "./loading";
import { FaCheck } from "react-icons/fa6";
type Props = {
  handleSelect: (patientId: number) => void;
};
const ListOfAppointments: FC<Props> = ({ handleSelect }) => {
  const [expandedRows, setExpandedRows] = useState(null);
  const q = useQueryClient();
  const [form] = Form.useForm();
  const store = useAppStore();

  const appointments = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetAppointments",
        parameters: {
          BranchCode: store.branchCode,
          DateFrom: isNullOrUndefinedOrBlank(form.getFieldValue("DateFrom"))
            ? dayjs().format("YYYYMMDD")
            : dayjs(form.getFieldValue("DateFrom")).format("YYYYMMDD"),
          DateTo: isNullOrUndefinedOrBlank(form.getFieldValue("DateTo"))
            ? dayjs().format("YYYYMMDD")
            : dayjs(form.getFieldValue("DateTo")).format("YYYYMMDD"),
          PatientName: isNullOrUndefinedOrBlank(
            form.getFieldValue("PatientName")
          )
            ? ""
            : form.getFieldValue("PatientName"),
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
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
  useEffect(() => {
    form.setFieldsValue({
      DateFrom: dayjs(),
      DateTo: dayjs(),
    });
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Appointments</Divider>

      <Form
        form={form}
        layout="vertical"
        onFinish={() =>
          q.invalidateQueries({
            queryKey: ["appointments"],
          })
        }
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
            value={appointments.data}
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
              expander={appointments.data!.length > 0}
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
        )}
      </div>
    </div>
  );
};

export default ListOfAppointments;
