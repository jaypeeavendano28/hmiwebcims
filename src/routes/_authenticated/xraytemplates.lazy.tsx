import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { PostData, WithAccess } from "../../helpers";
import useAppStore from "../../store";
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Select,
  Space,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { BiEdit } from "react-icons/bi";

export const Route = createLazyFileRoute("/_authenticated/xraytemplates")({
  component: () => <XrayTemplates />,
});

const XrayTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [radiologist, setRadiologist] = useState([]);
  const [form] = Form.useForm();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const store = useAppStore();
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: 30,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-Utilities-Xray Result Templates!",
          placement: "topRight",
          duration: 3,
        });
        router.navigate({
          to: "/",
        });
      }
    }
  };
  const handleInitialized = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetListOfRadiologist",
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      setRadiologist(res.parameters.lst);
    }
  };
  const handleGetTemplates = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetXrayTemplates",
      parameters: {},
    });
    if (res) {
      setTemplates(res.parameters.lst);
    }
  };
  const handleSubmit = async (v: any) => {
    const res = await PostData("SaveXrayTemplate", v);
    try {
      if (res) {
        if (res.status === 1) {
          console.log(res);
          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });
          form.setFieldValue("Id", res.parameters.Id);
          handleGetTemplates();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };
  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Button
            type="primary"
            icon={<BiEdit />}
            onClick={() => {
              form.setFieldsValue({
                Id: data.Id,
                Examination: data.Examination,
                fk_Doctors_Id: data.fk_Doctors_Id,
                Findings: data.Findings,
                Impression: data.Impression,
                Note: data.Note,
                Department: data.Department,
                Pf: data.Pf,
                PfSenior: data.PfSenior,
                PfHmi: data.PfHmi,
              });
              setShowModal(true);
            }}
          />
        </Tooltip>
      </Space>
    );
  };

  useEffect(() => {
    handleWithAccess();
    handleInitialized();
    handleGetTemplates();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>X-ray Result Templates</Divider>
      <Button
        type="primary"
        onClick={() => {
          form.resetFields();
          form.setFieldsValue({
            Id: 0,
          });
          setShowModal(true);
        }}
      >
        New
      </Button>
      <div className="mt-2">
        <DataTable
          value={templates}
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          filterDisplay="row"
          emptyMessage="No Records!"
          stripedRows
          size="normal"
        >
          <Column
            field="action"
            header="Action"
            body={(data: any) => actionBodyTemplate(data)}
          ></Column>
          <Column field="Radiologist" header="Radiologist" filter></Column>
          <Column field="Examination" header="Examination" filter></Column>
          <Column field="Department" header="Department" filter></Column>
        </DataTable>
      </div>
      <Modal
        open={showModal}
        destroyOnClose
        onCancel={() => setShowModal(false)}
        footer={false}
        width={screen.width - 200}
      >
        <Form onFinish={handleSubmit} layout="vertical" form={form}>
          <Form.Item name="Id" label="Id" className="max-w-sm">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="Department" label="Department" className="max-w-sm">
            <Select>
              <Select.Option key="US" value="US">
                Ultrasound
              </Select.Option>
              <Select.Option key="XR" value="XR">
                X-Ray
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fk_Doctors_Id"
            label="Radiologist"
            className="max-w-sm"
            rules={[
              {
                required: true,
                message: "Radiologist is required!",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              filterOption={(inputValue, option: any) =>
                option.title.toUpperCase().indexOf(inputValue.toUpperCase()) !==
                -1
              }
            >
              {radiologist.map((d: any) => (
                <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                  {d.Name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="Examination"
            label="Examination"
            normalize={(v) => v.toUpperCase()}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Findings"
            label="Findings"
            rules={[
              {
                required: true,
                message: "Findings is required!",
              },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="Impression" label="Impression">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="Note" label="Note">
            <Input.TextArea rows={4} />
          </Form.Item>
          <div className="grid grid-cols-6">
            <Form.Item name="Pf" label="Pf (OPD Reg.)">
              <InputNumber precision={2} />
            </Form.Item>
            <Form.Item name="PfSenior" label="Pf (Senior)">
              <InputNumber precision={2} />
            </Form.Item>
            <Form.Item name="PfHmi" label="Pf (HMI Member)">
              <InputNumber precision={2} />
            </Form.Item>
          </div>

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
