import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { PostData, WithAccess } from "../../helpers";
import { DataTable } from "primereact/datatable";
import Loading from "../../components/loading";
import { Column } from "primereact/column";
import { useEffect, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { TDoctors } from "../../types";
import {
  AutoComplete,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Tooltip,
  notification,
} from "antd";
import { BiEdit } from "react-icons/bi";
import useAppStore from "../../store";
export const Route = createLazyFileRoute("/_authenticated/doctors")({
  component: () => <Doctors />,
});

const Doctors = () => {
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const store = useAppStore();
  const [expandedRows, setExpandedRows] = useState(null);
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const data = useQuery({
    queryKey: ["data"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetDoctors",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const specialty = useQuery({
    queryKey: ["specialty"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetSpecialty",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const actionBodyTemplate = (data: TDoctors) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Link
            to="/doctorsprofile/$Id"
            params={{
              Id: data.Id.toString(),
            }}
          >
            <Button type="primary" icon={<BiEdit />} />
          </Link>
        </Tooltip>
      </Space>
    );
  };
  const rowExpansionTemplate = (data: TDoctors) => {
    return (
      <div className="p-3">
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
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: 27,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-Doctors",
          placement: "topRight",
          duration: 3,
        });
        router.navigate({
          to: "/",
        });
      }
    }
  };
  useEffect(() => {
    store.setHideSideBar("N");
    handleWithAccess();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Doctors</Divider>
      <Button
        type="primary"
        onClick={() => {
          router.navigate({
            to: "/doctorsprofile/$Id",
            params: {
              Id: "0",
            },
          });
        }}
      >
        New
      </Button>
      <div className="mt-2">
        {data.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={data.data}
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
              expander={data.data!.length > 0}
              style={{ width: "5rem" }}
            />
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
            <Column field="Id" header="Id" filter></Column>
            <Column field="Name" header="Name" filter></Column>
            <Column field="Specialty" header="Specialty"></Column>
          </DataTable>
        )}
      </div>
      <Modal
        open={showModal}
        destroyOnClose
        footer={false}
        onCancel={() => setShowModal(false)}
        width={screen.width - 100}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Form
              form={form}
              // layout="vertical"

              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
            >
              <Form.Item name="Id" label="Id">
                <Input readOnly />
              </Form.Item>
              <Form.Item
                name="Name"
                label="Name"
                normalize={(v) => v.toUpperCase()}
                rules={[
                  {
                    required: true,
                    message: "Name is required!",
                  },
                ]}
              >
                <Input autoFocus />
              </Form.Item>
              <Form.Item
                name="Lastname"
                label="Lastname"
                normalize={(v) => v.toUpperCase()}
                rules={[
                  {
                    required: true,
                    message: "Lastname is required!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="Firstname"
                label="Firstname"
                normalize={(v) => v.toUpperCase()}
                rules={[
                  {
                    required: true,
                    message: "Firstname is required!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="Middlename"
                label="Middlename"
                normalize={(v) => v.toUpperCase()}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="Suffix"
                label="Suffix"
                normalize={(v) => v.toUpperCase()}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="Specialty"
                label="Specialty"
                normalize={(v) => v.toUpperCase()}
              >
                <AutoComplete
                  filterOption={(inputValue, option) =>
                    option!
                      .value!.toString()
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                >
                  {specialty.data &&
                    specialty.data!.map((v: any) => (
                      <AutoComplete.Option
                        key={v.Id}
                        value={v.specialty}
                        title={v.specialty}
                      >
                        {v.specialty}
                      </AutoComplete.Option>
                    ))}
                </AutoComplete>
              </Form.Item>
              <Form.Item name="LicNo" label="License No.">
                <Input />
              </Form.Item>
              <Form.Item name="PhicNo" label="Phic No.">
                <Input />
              </Form.Item>
            </Form>
          </div>
          <div>sdfsdf</div>
        </div>
      </Modal>
    </div>
  );
};
