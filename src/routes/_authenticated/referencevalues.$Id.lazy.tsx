import {
  AutoComplete,
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Radio,
  Select,
  Space,
  Tooltip,
} from "antd";
import { useForm } from "antd/lib/form/Form";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useState } from "react";
import { BiEdit } from "react-icons/bi";
import { createLazyFileRoute } from "@tanstack/react-router";
import useAppStore from "../../store";
import { PostData } from "../../helpers";

export const Route = createLazyFileRoute("/_authenticated/referencevalues/$Id")(
  {
    component: () => <ReferenceValues />,
  }
);

const ReferenceValues = () => {
  const [TestId] = useState<string>(Route.useParams().Id);
  const [Id, setId] = useState<string>(Route.useParams().Id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode] = useState("AgeFrom");
  const [showModal, setShowModal] = useState(false);
  const [showModalAge, setShowModalAge] = useState(false);
  const [form] = useForm();
  const [form2] = useForm();
  const [referenceValues, setReferenceValues] = useState([]);
  const [IsUnits] = useState([]);
  const [conventionalUnits] = useState([]);

  const store = useAppStore();

  const handleSaveReferenceValue = async (values: any) => {
    setIsSubmitting(true);

    const res = await PostData("SaveReferenceValues", {
      ...values,
      fk_Analytes_Id: TestId,
      Id: Id,
      username: store.username,
    });
    if (res) {
      setIsSubmitting(false);
      if (res.status === 1) {
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        handleGetReferenceValues();
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };

  const handleGetReferenceValues = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetReferenceValues",
      parameters: {
        Id: TestId,
      },
    });

    if (res) {
      setReferenceValues(res.parameters.lst);
    }
  };
  const handleComputeDays = (data: any) => {
    setShowModalAge(false);

    let days = 0;

    if (data.mode === "M") {
      days = Math.round(30.436875 * data.noofmonths);

      if (mode === "AgeFrom") {
        form.setFieldsValue({
          AgeFrom: days,
        });
      } else if (mode === "AgeTo") {
        form.setFieldsValue({
          AgeTo: days,
        });
      }
    }

    if (data.mode === "Y") {
      days = Math.round(365 * data.noofmonths);

      if (mode === "AgeFrom") {
        form.setFieldsValue({
          AgeFrom: days,
        });
      } else if (mode === "AgeTo") {
        form.setFieldsValue({
          AgeTo: days,
        });
      }
    }
  };
  const handleEdit = (data: any) => {
    setId(data.Id);
    form.resetFields();
    form.setFieldsValue({
      AgeFrom: data.AgeFrom,
      AgeTo: data.AgeTo,
      Gender: data.Gender,
      IsUnit: data.IsUnit,
      IsFrom: data.IsFrom,
      IsTo: data.IsTo,
      IsReferenceValue: data.IsReferenceValue,
      ConventionalUnit: data.ConventionalUnit,
      ConventionalFrom: data.ConventionalFrom,
      ConventionalTo: data.ConventionalTo,
      ConventionalReferenceValue: data.ConventionalReferenceValue,
      Conversion: data.Conversion,
      Deleted: "N",
      AgeFromMode: data.AgeFromMode,
      AgeToMode: data.AgeToMode,
    });
    setShowModal(true);
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
      </Space>
    );
  };

  useEffect(() => {
    handleGetReferenceValues();
  }, []);
  return (
    <div className="cardBackground">
      {/* <div className="font-bold">Test/Analyte:{state.Description}</div> */}

      <div className="mt-2">
        <Button
          type="primary"
          onClick={() => {
            setId("0");
            setShowModal(true);
            form.resetFields();
          }}
        >
          New
        </Button>
      </div>

      <div className="mt-2">
        <DataTable value={referenceValues} tableStyle={{ minWidth: "50rem" }}>
          <Column
            field="action"
            header="Action"
            body={(data) => actionBodyTemplate(data)}
          ></Column>
          <Column field="AgeFrom" header="AgeFrom"></Column>
          <Column field="AgeTo" header="Age To"></Column>
          <Column field="Gender" header="Gender"></Column>
          <Column field="IsUnit" header="IsUnit"></Column>
          <Column field="IsFrom" header="IsFrom"></Column>
          <Column field="IsTo" header="IsTo"></Column>
          <Column field="IsReferenceValue" header="Is Reference Value"></Column>
          <Column field="Conversion" header="Conversion"></Column>
        </DataTable>
      </div>

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        width={1200}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveReferenceValue}
          scrollToFirstError
        >
          <div className="grid lg:grid-cols-6 gap-4">
            <Form.Item
              name="Gender"
              label="Gender"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select>
                <Select.Option key="A" value="A">
                  All Gender
                </Select.Option>
                <Select.Option key="F" value="F">
                  Female
                </Select.Option>
                <Select.Option key="M" value="M">
                  Male
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="AgeFrom"
              label="Age From"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <div className="flex flex-col justify-center items-start">
              {/* <Button
                type="primary"
                onClick={() => {
                  form2.resetFields();
                  setMode("AgeFrom");
                  setShowModalAge(true);
                }}
              >
                Age in days
              </Button> */}
              <Form.Item
                name="AgeFromMode"
                label="Day/Month/Year"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Select>
                  <Select.Option value="D" key="D">
                    Day(s)
                  </Select.Option>
                  <Select.Option value="M" key="M">
                    Month(s)
                  </Select.Option>
                  <Select.Option value="Y" key="Y">
                    Year(s)
                  </Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="AgeTo"
              label="Age To"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <div className="flex flex-col justify-center items-start">
              <Form.Item
                name="AgeToMode"
                label="Day/Month/Year"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Select>
                  <Select.Option value="D" key="D">
                    Day(s)
                  </Select.Option>
                  <Select.Option value="M" key="M">
                    Month(s)
                  </Select.Option>
                  <Select.Option value="Y" key="Y">
                    Year(s)
                  </Select.Option>
                </Select>
              </Form.Item>
              {/* <Button
                type="primary"
                onClick={() => {
                  form2.resetFields();
                  setMode("AgeTo");
                  setShowModalAge(true);
                }}
              >
                Age in days
              </Button> */}
            </div>
          </div>
          <Divider>International Standard</Divider>
          <div className="grid lg:grid-cols-6 gap-4">
            <Form.Item name="IsUnit" label="Unit">
              <AutoComplete
                options={IsUnits}
                placeholder="Please select"
                //   filterOption={(inputValue, option) =>
                //     option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
                //     -1
                //   }
              />
            </Form.Item>
            <Form.Item name="IsFrom" label="Value From">
              <InputNumber precision={2} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="IsTo" label="Value To">
              <InputNumber precision={2} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="IsReferenceValue"
              label="Reference Value"
              className="col-span-3"
            >
              <Input.TextArea rows={5} />
            </Form.Item>
          </div>
          <Divider>Conventional</Divider>
          <div className="grid lg:grid-cols-6 gap-4">
            <Form.Item name="ConventionalUnit" label="Unit">
              <AutoComplete
                options={conventionalUnits}
                placeholder="Please select"
                //   filterOption={(inputValue, option) =>
                //     option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
                //     -1
                //   }
              />
            </Form.Item>
            <Form.Item name="ConventionalFrom" label="Value From">
              <InputNumber precision={2} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="ConventionalTo" label="Value To">
              <InputNumber precision={2} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="ConventionalReferenceValue"
              label="Reference Value"
              className="col-span-3"
            >
              <Input.TextArea rows={5} />
            </Form.Item>
          </div>
          <div className="grid lg:grid-cols-6 gap-4">
            <Form.Item name="Conversion" label="Conversion">
              <InputNumber precision={4} style={{ width: "100%" }} />
            </Form.Item>
            {Id !== "0" && (
              <Form.Item
                name="Deleted"
                label="Do you want to delete this reference value?"
                className="col-span-2"
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Submit
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        visible={showModalAge}
        destroyOnClose
        onCancel={() => setShowModalAge(false)}
        footer={null}
      >
        <Form form={form2} layout="vertical" onFinish={handleComputeDays}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="noofmonths"
              label="No. of month(s)/year(s)"
              rules={[
                {
                  required: true,
                  message: "This field is required!",
                },
              ]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="mode"
              label="Month/Year"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select>
                <Select.Option value="M" key="M">
                  Month(s)
                </Select.Option>
                <Select.Option value="Y" key="Y">
                  Year(s)
                </Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit">
              Compute Age in days
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
