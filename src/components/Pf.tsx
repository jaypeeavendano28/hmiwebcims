import { Button, Card, Form, InputNumber, notification, Select } from "antd";
import {
  TDiscountTypes,
  TDoctors,
  THmoCompany,
  TProfessionalFee,
} from "../types";
import { useQuery } from "@tanstack/react-query";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import { useEffect } from "react";
import { round } from "lodash";

type Props = {
  AppointmentId: number;
  selectedRecord?: TProfessionalFee;
};
export default function Pf({ AppointmentId, selectedRecord }: Props) {
  const [form] = Form.useForm();
  const doctors = useQuery<TDoctors[]>({
    queryKey: ["doctors"],
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
  });

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
  });

  const hmo = useQuery<THmoCompany[]>({
    queryKey: ["hmo"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetHmo",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
  });

  const handleSubmit = async (values: TProfessionalFee) => {
    if (
      !isNullOrUndefinedOrBlank(values.fk_HmoCompany_Id) &&
      values.Amount! <= 0
    ) {
      notification.error({
        message: "HMO Amount is required!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }
    try {
      const res = await PostData("SavePf", {
        ...values,
        Id: isNullOrUndefinedOrBlank(selectedRecord) ? 0 : selectedRecord?.Id,
        fk_Appointments_Id: AppointmentId,
      });
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });
          location.reload();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleComputeDiscount = () => {
    const v = form.getFieldValue("fk_DiscountTypes_Id");
    const x: TDiscountTypes = discountTypes.data?.find(
      (f) => f.Id === v
    ) as TDiscountTypes;
    let Amount = isNullOrUndefinedOrBlank(form.getFieldValue("Amount"))
      ? 0
      : form.getFieldValue("Amount");
    let Vat = 0;
    if (x.LessVat === "Y") {
      Vat = round(Amount - Amount / 1.12, 2);
    }

    form.setFieldValue("Vat", Vat);
    let Discount = round((Amount - Vat) * x.PharmacyDiscount!, 2);
    form.setFieldValue("Discount", Discount);
    const Hmo = isNullOrUndefinedOrBlank(form.getFieldValue("Hmo"))
      ? 0
      : form.getFieldValue("Hmo");
    const Phic = isNullOrUndefinedOrBlank(form.getFieldValue("Phic"))
      ? 0
      : form.getFieldValue("Phic");
    const Net = round(Amount - Discount - Hmo - Phic, 2);
    form.setFieldValue("Net", Net);
  };
  useEffect(() => {
    if (!isNullOrUndefinedOrBlank(selectedRecord)) {
      console.log(selectedRecord);
      form.setFieldsValue(selectedRecord);
    }
  }, []);
  return (
    <Card>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item
            name="fk_Doctors_Id"
            label="Doctor"
            rules={[
              {
                required: true,
                message: "Please select a doctor!",
              },
            ]}
            className="col-span-3"
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (
                  option!.children
                    ?.toString()
                    .toLocaleLowerCase() as unknown as string
                ).includes(input.toLocaleLowerCase())
              }
            >
              {doctors.data?.map((d) => (
                <Select.Option key={d.Id} value={d.Id}>
                  {d.Name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="Amount"
            label="Amount"
            rules={[
              {
                required: true,
                message: "Please enter an amount!",
              },
            ]}
          >
            <InputNumber
              precision={2}
              style={{ width: "100%" }}
              onBlur={handleComputeDiscount}
            />
          </Form.Item>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item name="fk_DiscountTypes_Id" label="Discount Type">
            <Select
              onChange={handleComputeDiscount}
              showSearch
              filterOption={(input, option) =>
                (
                  option!.children
                    ?.toString()
                    .toLocaleLowerCase() as unknown as string
                ).includes(input.toLocaleLowerCase())
              }
            >
              {discountTypes.data?.map((d) => (
                <Select.Option key={d.Id} value={d.Id}>
                  {d.Description}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="Vat" label="Vat">
            <InputNumber precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="Discount" label="Discount">
            <InputNumber precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="Phic" label="PHIC Deduction">
            <InputNumber
              precision={2}
              style={{ width: "100%" }}
              onBlur={handleComputeDiscount}
            />
          </Form.Item>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item
            name="fk_HmoCompany_Id"
            label="HMO/Company"
            className="col-span-2"
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (
                  option!.children
                    ?.toString()
                    .toLocaleLowerCase() as unknown as string
                ).includes(input.toLocaleLowerCase())
              }
              allowClear
            >
              {hmo.data?.map((d) => (
                <Select.Option key={d.Id} value={d.Id}>
                  {d.Name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="Hmo" label="HMO Deduction">
            <InputNumber
              precision={2}
              style={{ width: "100%" }}
              onBlur={handleComputeDiscount}
            />
          </Form.Item>
          <Form.Item name="Net" label="Net">
            <InputNumber precision={2} style={{ width: "100%" }} readOnly />
          </Form.Item>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="grid content-center">
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </div>
        </div>
      </Form>
    </Card>
  );
}
