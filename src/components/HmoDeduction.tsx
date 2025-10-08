import { Button, Card, Form, Input, Popconfirm, Select, Space } from "antd";
import { THmoCompany, THmoDeduction } from "../types";
import { useQuery } from "@tanstack/react-query";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import { useEffect } from "react";

type DiscountProps = {
  Balance: number;
  handleSaveHmoDeduction: (data: THmoDeduction) => void;
  HmoCompany: number;
  HmoAmount: number;
};

export default function HmoDeduction({
  Balance,
  handleSaveHmoDeduction,
  HmoCompany,
  HmoAmount,
}: DiscountProps) {
  const [form] = Form.useForm();
  const hmos = useQuery<THmoCompany[]>({
    queryKey: ["hmos"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetHmoCompany",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    form.setFieldValue("Amount", Number(Balance));
    if (!isNullOrUndefinedOrBlank(HmoCompany) && HmoCompany !== 0) {
      form.setFieldValue("fk_HmoCompany_Id", HmoCompany);
    }
  }, []);
  return (
    <Card title="HMO/Company Deduction">
      <Form form={form} onFinish={handleSaveHmoDeduction} layout="vertical">
        <Form.Item
          name="fk_HmoCompany_Id"
          label="HMO/Company"
          rules={[
            {
              required: true,
              message: "Please select an HMO/Company!",
            },
          ]}
        >
          <Select
            disabled
            allowClear
            placeholder="Select an HMO!"
            showSearch
            filterOption={(input, option) =>
              (
                option!.children
                  ?.toString()
                  .toLocaleLowerCase() as unknown as string
              ).includes(input.toLocaleLowerCase())
            }
          >
            {hmos.data?.map((item: THmoCompany) => (
              <Select.Option key={item.Id} value={item.Id}>
                {item.Name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="Amount" label="Amount" className="font-bold text-lg">
          <Input />
        </Form.Item>

        <div className="flex justify-end">
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              disabled={Balance <= 0 || HmoAmount > 0}
            >
              Submit
            </Button>
            <Popconfirm
              title="Reset HMO/Company Deduction"
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                const x: THmoDeduction = { Id: 0, IsReset: true };
                handleSaveHmoDeduction(x);
              }}
            >
              <Button type="primary" danger disabled={HmoAmount <= 0}>
                Reset HMO/Company Deductions
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </Form>
    </Card>
  );
}
