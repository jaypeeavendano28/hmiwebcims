import { useState, useEffect } from "react";
import { Button, Space, Modal, Form, Input, Tooltip, notification } from "antd";
import { BiEdit, BiTrash } from "react-icons/bi";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { DataTable } from "primereact/datatable";
import { FilterMatchMode } from "primereact/api";
const { confirm } = Modal;
import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../store";
import { PostData } from "../../helpers";
import { Column } from "primereact/column";
import Loading from "../../components/loading";
export const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};
export const Route = createFileRoute("/_authenticated/laboratorytemplates")({
  component: () => <LaboratoryTemplates />,
});

const LaboratoryTemplates = () => {
  const store = useAppStore();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [Id, setId] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters] = useState({
    Description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ReportDisplay: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ReportName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const handleNew = async () => {
    setId(0);
    form.resetFields();
    setShowModal(true);
  };
  const handleEdit = async (rec: any) => {
    setId(rec.Id);
    form.setFieldsValue({
      Description: rec.Description,
      ReportDisplay: rec.ReportDisplay,
      ReportName: rec.ReportName,
    });
    setShowModal(true);
  };
  const handleDelete = async (rec: any) => {
    confirm({
      title: "Do you want to delete this template?",
      okText: "Yes",
      cancelText: "No",
      icon: <ExclamationCircleOutlined />,

      onOk() {
        handleConfirmDelete(rec);
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  };

  const handleConfirmDelete = async (rec: any) => {
    const valuesToSave = {
      Id: rec.Id,
      username: store.username,
      Deleted: true,
    };

    const res = await PostData("SaveLaboratoryTemplate", valuesToSave);
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        setShowModal(false);
        handleInitialize();
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };

  const handleTemplateDetails = async (rec: any) => {
    // navigate("/laboratorytemplatedetails/" + rec.Id, {
    //   state: { details: rec },
    // });
    router.navigate({
      to: "/laboratorytemplatedetails/$Id",
      params: {
        Id: rec.Id,
      },
    });
  };

  const handleSaveTemplate = async (values: any) => {
    setIsSubmitting(true);
    const valuesToSave = {
      ...values,
      Id: Id,
      username: store.username,
      BranchCode: store.branchCode,
    };

    const res = await PostData("SaveLaboratoryTemplate", valuesToSave);
    if (res) {
      setIsSubmitting(false);
      if (res.status === 1) {
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        setShowModal(false);
        handleInitialize();
      } else {
        notification.success({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  const handleInitialize = async () => {
    setIsLoading(true);

    const res = await PostData("GetRecords", {
      sp: "udp_GetLaboratoryResultTemplates",
      parameters: {
        BranchCode: store.branchCode,
      },
    });

    if (res) {
      setIsLoading(false);
      setData(res.parameters.lst);
    }
  };

  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <BiEdit
            size={16}
            className="cursor-pointer text-gray-500 hover:text-gray-600"
            onClick={() => handleEdit(data)}
          />
        </Tooltip>
        <Tooltip title="Template Details">
          <BiEdit
            size={16}
            className="cursor-pointer text-gray-500 hover:text-gray-600"
            onClick={() => handleTemplateDetails(data)}
          />
        </Tooltip>
        <Tooltip title="Delete">
          <BiTrash
            size={16}
            className="cursor-pointer text-gray-500 hover:text-gray-600"
            onClick={() => handleDelete(data)}
          />
        </Tooltip>
      </Space>
    );
  };
  useEffect(() => {
    handleInitialize();
  }, []);

  return (
    <div className="ml-2 mt-2 mr-2 cardBackground">
      <h1 className="text-center font-bold">Laboratory Templates</h1>

      <Button type="primary" onClick={() => handleNew()}>
        New
      </Button>

      {isLoading ? (
        <Loading size={64} />
      ) : (
        <div className="mt-2">
          <div className="mt-2">
            <DataTable
              value={data}
              tableStyle={{ minWidth: "50rem" }}
              filters={filters}
              filterDisplay="row"
            >
              <Column
                field="action"
                header="Action"
                body={(data) => actionBodyTemplate(data)}
              ></Column>
              <Column field="Description" header="Description" filter></Column>
              <Column
                field="ReportDisplay"
                header="Report Display"
                filter
              ></Column>
              <Column field="ReportName" header="Report Name" filter></Column>
            </DataTable>
          </div>
        </div>
      )}

      <Modal
        title="Laboratory Template"
        open={showModal}
        onCancel={() => setShowModal(false)}
        okText="Save"
        cancelText="Cancel"
        footer={false}
        width="1000px"
        destroyOnClose
      >
        <Form
          //  layout="vertical"
          {...formItemLayout}
          form={form}
          onFinish={handleSaveTemplate}
          scrollToFirstError
        >
          <Form.Item
            label="Description"
            name="Description"
            rules={[
              {
                required: true,
                message: "Examination Name is required!",
              },
              { max: 100 },
            ]}
            normalize={(v) => v.toUpperCase()}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Report Display"
            name="ReportDisplay"
            rules={[
              {
                required: true,
                message: "Report Display is required!",
              },
              { max: 100 },
            ]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Report Name"
            name="ReportName"
            rules={[
              {
                required: true,
                message: "Report name is required!",
              },
              { max: 100 },
            ]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
