import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button, Divider, Modal, Space, Tooltip, notification } from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/userAuth";
import PatientProfile from "../../components/PatientProfile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostData } from "../../helpers";
import Loading from "../../components/loading";
import { DataTable } from "primereact/datatable";
import { FilterMatchMode } from "primereact/api";
import { TPatientInformation } from "../../types";
import { LiaUserEditSolid } from "react-icons/lia";
import { Column } from "primereact/column";
import AppointmentPerPatient from "../../components/AppointmentPerPatient";
import { FaUpload } from "react-icons/fa6";

export const Route = createFileRoute("/_authenticated/listofpatients")({
  component: () => <ListOfPatients />,
});

const ListOfPatients = () => {
  const q = useQueryClient();
  const [expandedRows, setExpandedRows] = useState(null);
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PatientNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
    MemberNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Company: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [Id, setId] = useState(0);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const handleWithAccess = async () => {
    const res = await auth.isWithAccess(17);
    if (res === false) {
      notification.error({
        message: "Access denied-List of Patients",
        placement: "topRight",
        duration: 3,
      });
      router.navigate({
        to: "/",
      });
    }
  };
  const handleCloseModal = () => {
    q.invalidateQueries({ queryKey: ["listOfPatients"] });
    setShowPatientProfile(false);
  };
  const listOfPatients = useQuery({
    queryKey: ["listOfPatients"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPatients",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const actionBodyTemplate = (data: TPatientInformation) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Button
            type="primary"
            icon={<LiaUserEditSolid />}
            onClick={() => {
              sessionStorage.setItem("PatientId", data.Id.toString());
              setId(data.Id);
              setShowPatientProfile(true);
            }}
          />
        </Tooltip>
        <Tooltip title="Upload Files/Documents">
          <Button
            type="primary"
            icon={<FaUpload />}
            onClick={() => {
              router.navigate({
                to: "/uploaddocuments/$Id",
                params: {
                  Id: data.Id.toString(),
                },
              });
            }}
          />
        </Tooltip>
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TPatientInformation) => {
    return (
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="cardBackGround p-3 col-span-2">
          <div>Patient Id</div>
          <div>
            <strong>{data.Id}</strong>
          </div>
          <div>Added By</div>
          <div>
            <strong>{data.AddedBy}</strong>
          </div>
          <div>Date Added</div>
          <div>
            <strong>{data.DateAdded}</strong>
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
        <div className="col-span-10">
          <AppointmentPerPatient PatientId={data.Id} />
        </div>
      </div>
    );
  };
  useEffect(() => {
    handleWithAccess();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>List of Patients</Divider>
      <Button
        type="primary"
        onClick={() => {
          setId(0);
          setShowPatientProfile(true);
        }}
      >
        New
      </Button>

      <div className="mt-2">
        {listOfPatients.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={listOfPatients.data}
            tableStyle={{ minWidth: "50rem" }}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filters={filters}
            filterDisplay="row"
            rowExpansionTemplate={rowExpansionTemplate}
            expandedRows={expandedRows as any}
            onRowToggle={(e) => setExpandedRows(e.data as any)}
          >
            <Column
              expander={listOfPatients.data && listOfPatients.data.length > 0}
              style={{ width: "5rem" }}
            />
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
            <Column field="PatientNo" header="Patient No." filter></Column>
            <Column field="MemberNo" header="Member No." filter></Column>
            <Column field="Name" header="Name" filter></Column>
            <Column field="DateOfBirthStr" header="Date of birth"></Column>
            <Column field="Company" header="Company" filter></Column>
          </DataTable>
        )}
      </div>

      <Modal
        open={showPatientProfile}
        footer={false}
        onCancel={() => setShowPatientProfile(false)}
        destroyOnClose
        width={1200}
      >
        <PatientProfile Id={Id} handleCloseModal={handleCloseModal} />
      </Modal>
    </div>
  );
};
