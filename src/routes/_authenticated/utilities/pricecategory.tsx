import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../../store";
import { useEffect, useState } from "react";
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Tooltip,
  notification,
} from "antd";
import { TPriceCategory } from "../../../types";
import { FilterMatchMode } from "primereact/api";
import { PostData, WithAccess } from "../../../helpers";
import { BiEdit } from "react-icons/bi";
import Loading from "../../../components/loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export const Route = createFileRoute("/_authenticated/utilities/pricecategory")(
  {
    component: () => <PriceCategory />,
  }
);
const PriceCategory = () => {
  const router = useRouter();
  const store = useAppStore();
  const [selectedRecord, setSelectedRecord] = useState<
    TPriceCategory | undefined
  >({
    Id: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [expandedRows, setExpandedRows] = useState(null);
  const [list, setList] = useState<TPriceCategory[] | undefined>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters] = useState({
    Code: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Description: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const handleGetList = async () => {
    setIsProcessing(true);
    const res = await PostData("GetRecords", {
      sp: "udp_GetPriceCategory",
      parameters: {},
    });
    if (res) {
      setIsProcessing(false);
      if (res.status === 1) {
        setList(res.parameters.lst);
      }
    }
  };

  const actionBodyTemplate = (data: TPriceCategory) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Button
            type="primary"
            icon={<BiEdit />}
            onClick={() => {
              setSelectedRecord(data);
              form.setFieldsValue({
                Code: data.Code,
                Description: data.Description,
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
      const res = await PostData("SavePriceCategory", {
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
    handleWithAccess(20, "Utilities-Price Category");
    handleGetList();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Price Category</Divider>

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
            <Column field="Code" header="Code" filter></Column>
            <Column field="Description" header="Description" filter></Column>
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
            name="Code"
            label="Code"
            normalize={(v) => v.toUpperCase()}
            rules={[
              {
                required: true,
              },
              {
                min: 3,
              },
              {
                max: 3,
              },
            ]}
          >
            <Input readOnly={selectedRecord!.Id > 0} />
          </Form.Item>
          <Form.Item
            name="Description"
            label="Description"
            normalize={(v) => v.toUpperCase()}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
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
