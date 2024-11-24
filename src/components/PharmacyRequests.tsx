import { useEffect, useState } from "react";
import { PostData } from "../helpers";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Modal, Space, Tooltip } from "antd";
import { BsCheck2 } from "react-icons/bs";
import PharmacyRequestDetails from "./PharmacyRequestDetails";

export default function PharmacyRequests() {
  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [Id, setId] = useState();

  const handleGetList = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPharmacyRequests",
      parameters: {},
    });
    if (res) {
      setList(res.parameters.lst);
    }
  };
  // const rowExpansionTemplate = (data: any) => {
  //   return <PharmacyRequestDetails Id={data.Id} />;
  // };
  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Render Request">
          <BsCheck2
            size={24}
            color="green"
            className="cursor-pointer"
            onClick={() => {
              setId(data.Id);
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
  useEffect(() => {
    handleGetList();
  }, []);

  return (
    <div>
      <DataTable
        value={list}
        // tableStyle={{ minWidth: "50rem" }}
        rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No Records!"
        stripedRows
        size="small"
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
        <Column field="RenderedBy" header="Rendered By"></Column>
        <Column field="DateRendered" header="Date Rendered"></Column>
        {/* <Column field="Amount" header="Amount"></Column> */}
      </DataTable>
      <Modal
        open={showModal}
        destroyOnClose
        onCancel={() => setShowModal(false)}
        footer={false}
        width={500}
      >
        <PharmacyRequestDetails Id={Id} handleClose={handleClose} />
      </Modal>
    </div>
  );
}
