import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../../store";
import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Tooltip,
  notification,
} from "antd";
import { THmoCompany, TPriceCategory } from "../../../types";
import { FilterMatchMode } from "primereact/api";
import {
  PostData,
  WithAccess,
  isNullOrUndefinedOrBlank,
} from "../../../helpers";
import { BiEdit } from "react-icons/bi";
import Loading from "../../../components/loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
export const Route = createFileRoute("/_authenticated/utilities/hmocompany")({
  component: () => <HmoCompany />,
});

const HmoCompany = () => {
  const router = useRouter();
  const store = useAppStore();
  const [selectedRecord, setSelectedRecord] = useState<THmoCompany | undefined>(
    {
      Id: 0,
    }
  );
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [expandedRows, setExpandedRows] = useState(null);
  const [list, setList] = useState<TPriceCategory[] | undefined>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const handleGetList = async () => {
    setIsProcessing(true);
    const res = await PostData("GetRecords", {
      sp: "udp_GetHmoCompany",
      parameters: {},
    });
    if (res) {
      setIsProcessing(false);
      if (res.status === 1) {
        setList(res.parameters.lst);
      }
    }
  };

  const actionBodyTemplate = (data: THmoCompany) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Button
            type="primary"
            icon={<BiEdit />}
            onClick={() => {
              setSelectedRecord(data);
              form.setFieldsValue({
                Name: data.Name,
                Address: data.Address,
                ContactNos: data.ContactNos,
                ContactPerson: data.ContactPerson,
                Designation: data.Designation,
                EmailAddress: data.EmailAddress,
                Type: data.Type,
              });
              setShowModal(true);
            }}
          />
        </Tooltip>
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TPriceCategory) => {
    return (
      <div className="p-3">
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
  const handleWithAccess = async (ModuleId: number, Description: string) => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: ModuleId,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-" + Description,
          placement: "topRight",
          duration: 3,
        });
        router.navigate({
          to: "/",
        });
      }
    }
  };
  const handleSubmit = async (v: TPriceCategory) => {
    try {
      setIsProcessing(true);
      const res = await PostData("SaveHmoCompany", {
        ...v,
        Id: selectedRecord?.Id,
      });
      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          setShowModal(false);
          handleGetList();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 5,
          });
        }
      }
    } catch (error: any) {
      setIsProcessing(false);
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 5,
      });
    }
  };

  useEffect(() => {
    store.setHideSideBar("N");
    handleWithAccess(22, "Utilities-Hmo/Companies");
    handleGetList();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>HMO/Companies</Divider>

      <Button
        type="primary"
        onClick={() => {
          setSelectedRecord({ Id: 0 });
          form.resetFields();
          setShowModal(true);
        }}
      >
        New
      </Button>

      <div className="mt-2">
        {isProcessing ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={list}
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
            <Column expander={list!.length > 0} style={{ width: "5rem" }} />
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
            <Column field="Id" header="Id"></Column>
            <Column field="Name" header="Name" filter></Column>
            <Column field="Address" header="Address"></Column>
          </DataTable>
        )}
      </div>

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={false}
        destroyOnClose
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="Name"
            label="Name"
            normalize={(v) => v.toUpperCase()}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Address"
            label="Address"
            normalize={(v) => v.toUpperCase()}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="ContactNos" label="Contact Nos.">
            <Input />
          </Form.Item>
          <Form.Item name="ContactPerson" label="Contact Person">
            <Input />
          </Form.Item>
          <Form.Item name="Designation" label="Designation">
            <Input />
          </Form.Item>
          <Form.Item
            name="EmailAddress"
            label="Email Address"
            rules={[
              {
                type: "email",
              },
            ]}
          >
            <Input />
          </Form.Item>
          {!isNullOrUndefinedOrBlank(selectedRecord) && (
            <Form.Item
              name="Deleted"
              label="Check if you want to delete this record"
              valuePropName="checked"
            >
              <Checkbox />
            </Form.Item>
          )}
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={isProcessing}>
              Submit
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
