import { Button, Card, Form, Select } from "antd";
import { TDiscountTypes } from "../types";
import { useQuery } from "@tanstack/react-query";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import { useEffect } from "react";

type DiscountProps = {
  handleSaveDiscount: (data: TDiscountTypes) => void;
  DiscountType: number;
};

export default function Discount({
  handleSaveDiscount,
  DiscountType,
}: DiscountProps) {
  const [form] = Form.useForm();

  const discountTypes = useQuery<TDiscountTypes[]>({
    queryKey: ["discountTypes"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetDiscountTypes",
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
    console.log(DiscountType);
    if (!isNullOrUndefinedOrBlank(DiscountType) && DiscountType !== 0) {
      form.setFieldValue("fk_DiscountTypes_Id", DiscountType);
    }
  }, []);

  return (
    <Card title="Discount">
      <Form form={form} onFinish={handleSaveDiscount} layout="vertical">
        <Form.Item name="fk_DiscountTypes_Id" label="Discount Type">
          <Select allowClear>
            {discountTypes.data?.map((item: TDiscountTypes) => (
              <Select.Option key={item.Id} value={item.Id}>
                {item.Description}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div className="flex justify-end">
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </div>
      </Form>
    </Card>
  );
}
