import { createLazyFileRoute } from "@tanstack/react-router";
import { Button, Card, DatePicker, Form } from "antd";
import dayjs from "dayjs";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useState } from "react";
import useAppStore from "../../store";
import axios from "axios";
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + "/api/";
const devApi = import.meta.env.VITE_DEV_API + "/api/";
const apiUrl = isDev ? devApi : prodApi;
export const Route = createLazyFileRoute("/_authenticated/reports")({
  component: () => <Reports />,
});

type TReport = {
  Id: number;
  Description: string;
  ReportName: string;
};

export default function Reports() {
  const store = useAppStore();
  const [selected, setSelected] = useState<TReport | undefined>();
  const [form] = Form.useForm();
  const [isProcessing, setIsProcessing] = useState(false);
  const dataReports: TReport[] = [
    {
      Id: 1,
      Description: "Appointment List",
      ReportName: "appointment_list.rdl",
    },
    {
      Id: 2,
      Description: "Cashier's Report",
      ReportName: "cashiers_report.rdl",
    },
  ];

  const handlePrint = async (v: any) => {
    console.log(v);
    setIsProcessing(true);
    const isDownload = false;
    const url =
      apiUrl +
      "reports/" +
      store.branchCode +
      "/" +
      selected?.ReportName +
      "/" +
      dayjs(v.DateFrom).format("YYYY-MM-DD") +
      "/" +
      dayjs(v.DateTo).format("YYYY-MM-DD");
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + store.tokenIdWebCims;
    try {
      await axios({
        url: url, //your url
        method: "GET",
        responseType: "blob",
      }).then((response: any) => {
        let newBlob;
        if (isDownload === false) {
          newBlob = new Blob([response.data], {
            type: "application/pdf",
          });

          const data = window.URL.createObjectURL(newBlob);

          const a = document.createElement("a");

          a.setAttribute("href", data);
          a.setAttribute("target", "_blank");

          a.click();
          setIsProcessing(false);
        } else {
          newBlob = new Blob([response.data], {
            type: "application/excel",
          });
          const a = document.createElement("a");
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(newBlob);
          a.href = url;
          a.download = "download.xls";
          a.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 0);
          setIsProcessing(false);
        }
      });
    } catch (error: any) {
      setIsProcessing(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      DateFrom: dayjs(),
      DateTo: dayjs(),
    });
  }, []);
  return (
    <Card title="Reports">
      <div className=" grid grid-cols-12 gap-4">
        <div className="col-span-2">
          <div className="mt-2">
            <DataTable
              dataKey="Id"
              value={dataReports}
              emptyMessage="No Records"
              selection={selected}
              onSelectionChange={(e) => {
                const value = e.value as TReport;
                setSelected(value);
              }}
              rows={20}
              // selectionMode="rowClick"
            >
              <Column selectionMode="single"></Column>

              <Column field="Description" header="Report Name"></Column>
            </DataTable>
          </div>
        </div>
        <div className="col-span-2">
          <Form form={form} layout="vertical" onFinish={handlePrint}>
            <Form.Item name="DateFrom" label="Date From">
              <DatePicker format="MM/DD/YYYY" />
            </Form.Item>
            <Form.Item name="DateTo" label="Date To">
              <DatePicker format="MM/DD/YYYY" />
            </Form.Item>
            <div className="flex justify-end">
              <Button
                loading={isProcessing}
                htmlType="submit"
                type="primary"
                disabled={!selected}
              >
                Show Report
              </Button>
            </div>
          </Form>
        </div>
        <div className="col-span-8"></div>
      </div>
    </Card>
  );
}
