import { useEffect, useState } from "react";
import { PostData } from "../helpers";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button, DatePicker, Form, Modal, Space, Tooltip } from "antd";
import { BsCheck2 } from "react-icons/bs";
import PharmacyRequestDetails from "./PharmacyRequestDetails";
import useAppStore from "../store";
import dayjs from "dayjs";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";

export default function PharmacyRequests() {
  const [RenderedBy, setRenderedBy] = useState("");
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [Id, setId] = useState();
  const [AppointmentId, setAppointmentId] = useState(0);
  const store = useAppStore();
  const handleGetList = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPharmacyRequests",
      parameters: {
        BranchCode: store.branchCode,
        DateFrom: form.getFieldValue("DateFrom").format("MM/DD/YYYY"),
        DateTo: form.getFieldValue("DateTo").format("MM/DD/YYYY"),
      },
    });
    if (res) {
      setList(res.parameters.lst);
    }
  };
  // const rowExpansionTemplate = (data: any) => {
  //   return <PharmacyRequestDetails Id={data.Id} />;
  // };
  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-PH");
  };

  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Render Request">
          <BsCheck2
            size={24}
            color="green"
            className="cursor-pointer"
            onClick={() => {
              setRenderedBy(data.RenderedBy);
              setId(data.Id);
              setAppointmentId(data.fk_Appointments_Id);
              setShowModal(true);
            }}
          />
        </Tooltip>
      </Space>
    );
  };
  const handleClose = () => {
    setShowModal(false);
    handleGetList();
  };
  const net = () => {
    let total = 0;
    list.map((sale: any) => {
      total += sale.Net!;
    });

    return formatCurrency(total);
  };
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={3}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
          }}
        />
        <Column footer="" />
        <Column footer="" />
        <Column footer="" />
        <Column footer="" />
        <Column footer={net} />
      </Row>
    </ColumnGroup>
  );
  useEffect(() => {
    form.setFieldsValue({
      DateFrom: dayjs(),
      DateTo: dayjs(),
    });
    handleGetList();
  }, []);

  return (
    <div>
      <Form form={form} layout="inline" onFinish={handleGetList}>
        <Form.Item name="DateFrom" label="Date From">
          <DatePicker format={"MM/DD/YYYY"} />
        </Form.Item>
        <Form.Item name="DateTo" label="Date To">
          <DatePicker format={"MM/DD/YYYY"} />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary">
            Search
          </Button>
        </Form.Item>
      </Form>
      <DataTable
        value={list}
        // tableStyle={{ minWidth: "50rem" }}
        rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No Records!"
        stripedRows
        size="small"
        footerColumnGroup={footerGroup}
      >
        <Column
          field="action"
          header="Action"
          body={(data: any) => actionBodyTemplate(data)}
        ></Column>
        <Column field="Id" header="Transaction Id"></Column>
        <Column field="DateAddedStr" header="Date"></Column>
        <Column field="AppointmentNo" header="Appointment No."></Column>
        <Column field="PatientName" header="Patient Name"></Column>
        <Column field="GrossAmount" header="Gross"></Column>
        <Column field="Discount" header="Discount"></Column>
        <Column field="Net" header="Net"></Column>
        <Column field="RenderedBy" header="Rendered By"></Column>
        <Column field="DateRendered" header="Date Rendered"></Column>
        {/* <Column field="Amount" header="Amount"></Column> */}
      </DataTable>
      <Modal
        open={showModal}
        destroyOnClose
        onCancel={() => setShowModal(false)}
        footer={false}
        width={800}
      >
        <PharmacyRequestDetails
          Id={Id}
          handleClose={handleClose}
          AppointmentId={AppointmentId}
          RenderedBy={RenderedBy}
        />
      </Modal>
    </div>
  );
}
