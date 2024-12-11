import { Button, Form, Input, List, notification, Select } from "antd";
import { FC, useEffect, useState } from "react";
import {
  TCharges,
  TDoctors,
  THmoCompany,
  TPaymentType,
  TPrice,
} from "../types";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import useAppStore from "../store";
import { useQuery } from "@tanstack/react-query";
import VirtualList from "rc-virtual-list";
const ContainerHeight = 400;
type Props = {
  Id: string;
  ChargeDetails: TCharges | undefined;
  Gender: string;
};

const AddCharge: FC<Props> = ({ Id, ChargeDetails, Gender }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [doctors, setDoctors] = useState<TDoctors[] | undefined>([]);
  const store = useAppStore();
  const [form] = Form.useForm();
  const [items, setItems] = useState<TPrice[] | undefined>([]);
  const [selectedItem, setSelectedItem] = useState<TPrice | undefined>(
    undefined
  );
  const [paymentType, setPaymentType] = useState<string>("");

  const hmoCompany = useQuery({
    queryKey: ["hmoCompany"],
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

  const paymentTypes = useQuery({
    queryKey: ["paymentTypes"],
    queryFn: async () => {
      let res = await PostData("GetRecords", {
        sp: "udp_GetPaymentType",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
  });

  const handleGetDoctors = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetDoctors",
      parameters: {},
    });
    if (res) {
      setDoctors(res.parameters.lst);
    }
  };

  const handleGetItems = async () => {
    try {
      const res = await PostData("GetRecords", {
        sp: "udp_GetItemPrices2",
        parameters: {
          BranchCode: store.branchCode,
          SearchStr: isNullOrUndefinedOrBlank(form.getFieldValue("SearchStr"))
            ? ""
            : form.getFieldValue("SearchStr"),
          Gender: Gender,
        },
      });
      if (res) {
        setItems(res.parameters.lst);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSelect = (x: TPrice) => {
    setSelectedItem(x);
    form.setFieldValue("Price", x.Price);
  };
  const handleAdd = async (v: TCharges) => {
    if (
      (v.PaymentType === "HMO" || v.PaymentType === "CTC") &&
      isNullOrUndefinedOrBlank(v.HmoCompany)
    ) {
      notification.error({
        message: "Please select an Hmo/Company!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    if (selectedItem && selectedItem!.NeedAPhysician === "Y") {
      if (isNullOrUndefinedOrBlank(v.fk_Doctors_Id)) {
        notification.error({
          message: "Please select a doctor/physician!",
          placement: "topRight",
          duration: 3,
        });
        return;
      }
    }

    v.Qty = 1;
    v.HmoAmount = 0;

    if (v.PaymentType === "CTC" || v.PaymentType === "HMO") {
      v.HmoAmount = v.Price!;
    }
    setIsProcessing(true);
    const res = await PostData("SaveCharges", {
      ...v,
      fk_Appointments_Id: Id,
      Id: ChargeDetails !== undefined ? ChargeDetails.Id : 0,
      Description: selectedItem!.Description,
      fk_HmoCompany_Id: isNullOrUndefinedOrBlank(v.HmoCompany)
        ? 0
        : v.HmoCompany,
      fk_Items_Id: selectedItem!.ItemId,
      fk_Charges_Id: selectedItem!.Id,
      PriceCategory: selectedItem!.PriceCategory2,
    });

    if (res) {
      setIsProcessing(false);
      if (res.status === 1) {
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });

        form.setFieldValue("Price", undefined);
        setSelectedItem(undefined);
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  useEffect(() => {
    handleGetDoctors();
    handleGetItems();
    if (ChargeDetails !== undefined) {
      setSelectedItem(ChargeDetails);
      console.log(ChargeDetails);
      form.setFieldsValue({
        Price: ChargeDetails.Price,
        PaymentType: ChargeDetails.PaymentType,
        fk_Doctors_Id: ChargeDetails.fk_Doctors_Id,
        Diagnosis : ChargeDetails.Diagnosis
      });
    }
  }, []);
  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
        onFinish={handleAdd}
      >
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <Form.Item name="SearchStr" label="Item Description">
              <Input onChange={handleGetItems} />
            </Form.Item>

            <List>
              <VirtualList
                data={items!}
                height={ContainerHeight}
                itemHeight={47}
                itemKey="Id"
              >
                {(item: TPrice) => (
                  <List.Item
                    key={item.Id}
                    actions={[
                      <Button
                        type="primary"
                        onClick={() => handleSelect(item)}
                        disabled={!isNullOrUndefinedOrBlank(ChargeDetails)}
                      >
                        Select
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={`${item.Description}-${item.Price}`}
                      description={`${item.PriceCategory}-${item.Department}`}
                    />
                  </List.Item>
                )}
              </VirtualList>
            </List>
          </div>

          <div>
            {selectedItem && (
              <div className="font-bold">
                {selectedItem.Description2 !== undefined
                  ? selectedItem.Description2
                  : selectedItem.Description}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <Form.Item name="Price" label="Price" className="col-span-1">
                <Input readOnly className="font-bold" />
              </Form.Item>
              <Form.Item
                label="Payment Type"
                name="PaymentType"
                rules={[
                  {
                    required: true,
                    message: "Payment type is required!",
                  },
                ]}
                className="col-span-2"
              >
                <Select
                  style={{ width: "100%" }}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    (
                      option!.children
                        ?.toString()
                        .toLocaleLowerCase() as unknown as string
                    ).includes(input.toLocaleLowerCase())
                  }
                  onChange={(v) => setPaymentType(v)}
                  disabled={
                    !isNullOrUndefinedOrBlank(ChargeDetails) &&
                    ChargeDetails!.PaymentType === "CSH" &&
                    ChargeDetails!.Net === 0
                  }
                >
                  {paymentTypes.data &&
                    paymentTypes.data.map((d: TPaymentType) => (
                      <Select.Option
                        key={d.Code}
                        value={d.Code}
                        title={d.Description}
                      >
                        {d.Description}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </div>
            <div>
            <Form.Item name="Diagnosis" label="Diagnosis">
                    <Input.TextArea rows={2}/>
              </Form.Item>
            </div>

            <div>
              {(paymentType === "HMO" || paymentType === "CTC") && (
                <div>
                  <Form.Item name="HmoCompany" label="Hmo/Company">
                    <Select
                      style={{ width: "100%" }}
                      showSearch
                      allowClear
                      filterOption={(input, option) =>
                        (
                          option!.children
                            ?.toString()
                            .toLocaleLowerCase() as unknown as string
                        ).includes(input.toLocaleLowerCase())
                      }
                    >
                      {hmoCompany.data &&
                        hmoCompany.data.map((e: THmoCompany) => (
                          <Select.Option key={e.Id} value={e.Id} title={e.Name}>
                            {e.Name}
                          </Select.Option>
                        ))}
                    </Select>
                  </Form.Item>
                </div>
              )}
            </div>
            <div>
              {selectedItem && selectedItem!.NeedAPhysician === "Y" && (
                <Form.Item label="Physician" name="fk_Doctors_Id">
                  <Select
                    style={{ width: "100%" }}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (
                        option!.children
                          ?.toString()
                          .toLocaleLowerCase() as unknown as string
                      ).includes(input.toLocaleLowerCase())
                    }
                  >
                    {doctors &&
                      doctors.map((d: TDoctors) => (
                        <Select.Option
                          key={d.Id}
                          value={d.Id}
                          title={d.NameAndSpecialty}
                        >
                          {d.NameAndSpecialty}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              )}
            </div>
            <div className="flex justify-end items-center">
              <Button
                type="primary"
                htmlType="submit"
                disabled={!selectedItem}
                loading={isProcessing}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default AddCharge;
