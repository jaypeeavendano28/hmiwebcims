import { Link, createFileRoute } from "@tanstack/react-router";
import { FilterMatchMode } from "primereact/api";
import { useEffect, useState } from "react";
import useAppStore from "../../store";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Tooltip,
  notification,
} from "antd";
import { BiEdit } from "react-icons/bi";
import { FaMicroscope, FaRegFileAlt, FaRegTrashAlt } from "react-icons/fa";
import Loading from "../../components/loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { PostData } from "../../helpers";

export const Route = createFileRoute("/_authenticated/analytes")({
  component: () => <Analytes />,
});

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

const Analytes = () => {
  const [filters] = useState({
    Description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    TestCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const store = useAppStore();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setModal2] = useState(false);
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [Id, setId] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [possibleValues, setPossibleValues] = useState([]);

  const handleGetPossibleValues = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPossibleValues",
      parameters: { TestId: Id },
    });
    if (res) {
      setPossibleValues(res.parameters.lst);
    }
  };

  const handleNew = async () => {
    setId(0);
    form.resetFields();
    setShowModal(true);
  };

  const handleEdit = async (rec: any) => {
    form.resetFields();
    setId(rec.Id);
    form.setFieldsValue({
      Description: rec.Description,
      TestCode: rec.TestCode,
      ShowHighLow: rec.ShowHighLow,
    });
    setShowModal(true);
  };

  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    const valuesToSave = {
      ...values,
      Id: Id,
      username: store.username,
      BranchCode: store.branchCode,
    };
    const res = await PostData("SaveTestAnalyte", valuesToSave);

    if (res) {
      setIsSubmitting(false);
      console.log(res);
      if (res.status === 1) {
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });

        setShowModal(false);
        handleInitialize();
      } else {
        setIsSubmitting(false);
        notification.error({
          message: res.data.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  const handleInitialize = async () => {
    setIsLoading(true);

    const res = await PostData("GetRecords", {
      sp: "udp_GetTestAnalytes",
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
        <Tooltip title="Reference Values">
          <Link
            to="/referencevalues/$Id"
            params={{
              Id: data.Id!.toString(),
            }}
          >
            <FaMicroscope
              size={16}
              className="cursor-pointer text-gray-500 hover:text-gray-600"
            />
          </Link>
        </Tooltip>
        <Tooltip title="Possible Values">
          <Link>
            <FaRegFileAlt
              size={16}
              className="cursor-pointer text-gray-500 hover:text-gray-600"
              onClick={() => {
                setId(data.Id);
                form2.resetFields();
                form2.setFieldValue("TestId", data.Id);
                setModal2(true);
              }}
            />
          </Link>
        </Tooltip>
      </Space>
    );
  };
  const actionBodyTemplate2 = (data: any) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Popconfirm
            title="Delete"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDeletePossibleValues(data)}
          >
            <FaRegTrashAlt
              size={16}
              className="cursor-pointer text-gray-500 hover:text-gray-600"
              // onClick={() => handleEdit(data)}
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    );
  };

  const handleAddPossibleValues = async (v: any) => {
    try {
      const res = await PostData("AddPossibleValues", { ...v, Id: 0 });
      if (res) {
        notification.success({
          message: "Successfully added!",
          placement: "topRight",
          duration: 3,
        });
        handleGetPossibleValues();
        form2.setFieldValue("Value", "");
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };
  const handleDeletePossibleValues = async (v: any) => {
    try {
      const res = await PostData("DeletePossibleValues", v);
      if (res) {
        notification.success({
          message: "Successfully deleted!",
          placement: "topRight",
          duration: 3,
        });
        handleGetPossibleValues();
        form2.setFieldValue("Value", "");
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };
  
  useEffect(() => {
    handleGetPossibleValues();
  }, [Id]);
  useEffect(() => {
    handleInitialize();
  }, []);
  return (
    <div className="ml-2 mt-2 mr-2 cardBackground">
      <h1 className="text-center font-bold">Test/Analytes</h1>

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
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              filters={filters}
              filterDisplay="row"
            >
              <Column
                field="action"
                header="Action"
                body={(data: any) => actionBodyTemplate(data)}
              ></Column>
              <Column field="Description" header="Description" filter></Column>
              <Column field="TestCode" header="Test Code" filter></Column>
              <Column
                field="ShowHighLow"
                header="Show High Lo?"
                filter
              ></Column>
              <Column field="Id" header="Id" filter></Column>
            </DataTable>
          </div>
        </div>
      )}

      <Modal
        title="Test/Analyte"
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
          onFinish={handleSubmitForm}
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
          >
            <Input style={{ width: "100%" }} autoFocus />
          </Form.Item>
          <Form.Item label="Test Code" name="TestCode">
            <Input />
          </Form.Item>
          <Form.Item
            name="ShowHighLow"
            label="Show High/Low?"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          {Id > 0 && (
            <Form.Item
              name="Deleted"
              label="Check to delete?"
              valuePropName="checked"
            >
              <Checkbox />
            </Form.Item>
          )}

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={showModal2}
        destroyOnClose
        onCancel={() => setModal2(false)}
        footer={false}
        width={500}
      >
        <>
          <Form
            form={form2}
            onFinish={handleAddPossibleValues}
            layout="vertical"
          >
            <Form.Item name="TestId" label="TestId">
              <Input readOnly />
            </Form.Item>
            <Form.Item
              name="Value"
              label="Description"
              rules={[
                {
                  required: true,
                  message: "Description is required!",
                },
              ]}
            >
              <Input autoFocus />
            </Form.Item>
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </div>
          </Form>
          <div className="mt-2">
            <DataTable
              value={possibleValues}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              filters={filters}
              filterDisplay="row"
            >
              <Column
                field="action"
                header="Action"
                body={(data: any) => actionBodyTemplate2(data)}
              ></Column>
              <Column field="Value" header="Value"></Column>
            </DataTable>
          </div>
        </>
      </Modal>
    </div>
  );
};
