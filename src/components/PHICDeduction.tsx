import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { TICd10, TPhicDeductions } from "../types";
import { PostData } from "../helpers";
import { useEffect, useState } from "react";
import SearchICD from "./SearchICD";

type PHICDeductionProps = {
  AppointmentId: number;
  handleSavePhicDeductions: (v: TPhicDeductions) => void;
};

export default function PHICDeduction({
  AppointmentId,
  handleSavePhicDeductions,
}: PHICDeductionProps) {
  const [mode, setMode] = useState("I");
  const [Id, setId] = useState(0);
  const handleClose = (data: TICd10) => {
    setId(data.Id);
    setShowModalPhicDed(false);
    if (mode === "I") {
      form.setFieldsValue({
        CaseRate1: data.ITEM_CODE,
        CaseRate1Desc: data.ITEM_DESC,
        CaseRate1Amount: data.LEVE1HOSP_CR1_AMT,
      });
    } else {
    }
  };
  const [showModalPhicDed, setShowModalPhicDed] = useState(false);
  const [form] = useForm();
  const handleSubmit = async (values: TPhicDeductions) => {
    handleSavePhicDeductions({ ...values, Id });
  };

  const handleGetDeductions = async () => {
    try {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPhicDeductions",
        parameters: {
          Id: AppointmentId,
        },
      });
      if (res) {
        if (res.parameters.lst.length > 0) {
          const x: TPhicDeductions = res.parameters.lst[0];
          form.setFieldsValue(x);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleGetDeductions();
  }, []);
  return (
    <div>
      <Card title="PHIC Deduction">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="CaseRate1"
              label="Case Rate"
              className="max-w-sm"
              rules={[
                {
                  required: true,
                  message: "Case rate is required!",
                },
              ]}
            >
              <Input readOnly />
            </Form.Item>
            <div className="flex items-center">
              <Button
                type="primary"
                onClick={() => {
                  setMode("I");
                  setShowModalPhicDed(true);
                }}
              >
                Search
              </Button>
            </div>
          </div>
          <Form.Item name="CaseRate1Desc" label="Case Rate 1 Description">
            <Input />
          </Form.Item>
          <Form.Item name="CaseRate1Amount" label="Case Rate 1 Amount">
            <InputNumber style={{ width: "200px" }} />
          </Form.Item>
          {/* <Form.Item name="CaseRate2" label="Case Rate 2" className="max-w-sm">
            <Input />
          </Form.Item>
          <Form.Item name="CaseRate2Desc" label="Case Rate 2 Description">
            <Input />
          </Form.Item>
          <Form.Item name="CaseRate2Amount" label="Case Rate 2 Amount">
            <InputNumber />
          </Form.Item> */}
          <div className="flex justify-end">
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Popconfirm
                title="Reset PHIC Deduction?"
                okText="Yes"
                cancelText="No"
                onConfirm={() => {
                  const v: TPhicDeductions = { Id: 0 };
                  handleSavePhicDeductions(v);
                }}
              >
                <Button type="primary" danger>
                  Reset PHIC Deductions
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </Form>
      </Card>
      <Modal
        width={1000}
        open={showModalPhicDed}
        onCancel={() => setShowModalPhicDed(false)}
        footer={null}
      >
        <SearchICD handleClose={handleClose} />
      </Modal>
    </div>
  );
}
