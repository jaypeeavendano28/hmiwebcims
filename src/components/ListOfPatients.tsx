import { Button, Divider, Form, Modal, Space, Tooltip } from "antd";
import { TPatientInformation } from "../types";
import { FaUserCheck } from "react-icons/fa";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostData } from "../helpers";
import Loading from "./loading";
import { DataTable } from "primereact/datatable";
import { FC, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import PatientProfile from "./PatientProfile";
import { BiCheckDouble } from "react-icons/bi";

type Props = {
  handleSelect: (patientId: number) => void;
};
const ListOfPatients: FC<Props> = ({ handleSelect }) => {
  const [form] = Form.useForm();
  const q = useQueryClient();
  const [Id, setId] = useState(0);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [expandedRows, setExpandedRows] = useState(null);
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    MemberNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Company: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const listOfPatients = useQuery({
    queryKey: ["listOfPatients"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPatients",
        parameters: {
          // Lastname: isNullOrUndefinedOrBlank(form.getFieldValue("Lastname"))
          //   ? ""
          //   : form.getFieldValue("Lastname"),
          // Firstname: isNullOrUndefinedOrBlank(form.getFieldValue("Firstname"))
          //   ? ""
          //   : form.getFieldValue("Firstname"),
          // Middlename: isNullOrUndefinedOrBlank(form.getFieldValue("Middlename"))
          //   ? ""
          //   : form.getFieldValue("Middlename"),
          // PatientNo: isNullOrUndefinedOrBlank(form.getFieldValue("PatientNo"))
          //   ? ""
          //   : form.getFieldValue("PatientNo"),
          // MemberNo: isNullOrUndefinedOrBlank(form.getFieldValue("MemberNo"))
          //   ? ""
          //   : form.getFieldValue("MemberNo"),
        },
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
            icon={<FaUserCheck />}
            onClick={() => {
              setId(data.Id);
              setShowPatientProfile(true);
            }}
          />
        </Tooltip>
        <Tooltip title="Select">
          <Button
            type="primary"
            icon={<BiCheckDouble />}
            onClick={() => {
              handleSelect(data.Id);
            }}
          />
        </Tooltip>
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TPatientInformation) => {
    return (
      <div className="p-3">
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
    );
  };
  const handleCloseModal = (PatientNo: string) => {
    form.setFieldValue("PatientNo", PatientNo);
    q.invalidateQueries({ queryKey: ["listOfPatients"] });
    setShowPatientProfile(false);
  };
  return (
    <div className="cardBackGround">
      <Divider>List of Patients</Divider>
      {/* <Form
        form={form}
        layout="vertical"
        onFinish={() =>
          q.invalidateQueries({
            queryKey: ["listOfPatients"],
          })
        }
      >
        <div className="grid md:grid-cols-6 gap-4">
          <Form.Item name="Lastname" label="Lastname">
            <Input />
          </Form.Item>
          <Form.Item name="Firstname" label="Firstname">
            <Input />
          </Form.Item>
          <Form.Item name="Middlename" label="Middlename">
            <Input />
          </Form.Item>
          <Form.Item name="MemberNo" label="Member No.">
            <Input />
          </Form.Item>
          <Form.Item name="PatientNo" label="Patient No.">
            <Input />
          </Form.Item>
          <div className="flex flex-col justify-center">
            <div className="flex flex-row gap-2">
              <Button type="primary" htmlType="submit">
                Search
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setId(0);
                  setShowPatientProfile(true);
                }}
              >
                New
              </Button>
            </div>
          </div>
        </div>
      </Form> */}
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
            <Column
              field="PatientNo"
              header="Patient No."
              // filter
              style={{ minWidth: "12rem" }}
            ></Column>
            <Column field="MemberNo" header="Member No." filter></Column>
            <Column field="Name" header="Name" filter></Column>
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
        <PatientProfile
          Id={Id}
          handleCloseModal={(PatientNo: string) => handleCloseModal(PatientNo)}
        />
      </Modal>
    </div>
  );
};

export default ListOfPatients;
