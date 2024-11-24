import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button, DatePicker, Divider, Form, Input, Modal, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { PostData } from "../../helpers";
import { TPatientInformation, TPrice } from "../../types";
import ListOfPatients from "../../components/ListOfPatients";
import useAppStore from "../../store";

export const Route = createFileRoute("/_authenticated/pharmacysales/$Id")({
  component: () => <PharmacySales />,
});

const PharmacySales = () => {
  const q = useQueryClient();
  const [Qty, setQty] = useState<number | undefined>(0);
  const [form2] = Form.useForm();
  const store = useAppStore();
  const [showPatients, setShowPatient] = useState(false);
  const [PatientId, setPatientId] = useState(0);
  const [form] = Form.useForm();
  const [Id] = useState(Route.useParams().Id);
  const [priceCategory, setPriceCategory] = useState("");
  const handleSubmitForm = async () => {};

  useQuery({
    queryKey: ["cashPatientId"],
    queryFn: async () => {
      let res = await PostData("GetRecords", {
        sp: "udp_GetSettings",
        parameters: {
          Code: "CASHPATIENTID",
        },
      });
      if (res) {
        if (res.parameters.lst.length > 0) {
          setPatientId(res.parameters.lst[0].Value);
        }
      }
    },
    refetchOnWindowFocus: false,
  });
  const handleGetPatientDetails = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPatientInformationById",
      parameters: {
        Id: PatientId,
      },
    });
    if (res) {
      if (res.parameters.lst.length > 0) {
        const x: TPatientInformation = res.parameters.lst[0];
        form.setFieldsValue({
          Name: x.Name,
        });
      }
    }
  };
  const handleSelect = async (patientId: number) => {
    setShowPatient(false);
    setPatientId(patientId);
  };
  const prices = useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPricesInventoryItems",
        parameters: {
          BranchCode: store.branchCode,
          PriceCategory: priceCategory,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const handleGetQty = async (Id: number) => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetQtyPerItem",
      parameters: {
        BranchCode: store.branchCode,
        ItemId: Id,
      },
    });
    if (res) {
      if (res.parameters.lst.length > 0) {
        setQty(res.parameters.lst[0].Qty);
      } else {
        setQty(undefined);
      }
    }
  };
  useEffect(() => {
    q.invalidateQueries({ queryKey: ["prices"] });
  }, [priceCategory]);
  const handleAdd = (v: any) => {
    console.log(v);
  };
  useEffect(() => {
    if (Id === "0") {
      form.setFieldsValue({
        Date: dayjs(new Date()),
      });
    } else {
    }
  }, []);
  useEffect(() => {
    handleGetPatientDetails();
  }, [PatientId]);
  return (
    <div className="cardBackGround">
      <Divider>Pharmacy Sales</Divider>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
            <div className="grid lg:grid-cols-3 gap-4">
              <Form.Item name="Date" label="Date">
                <DatePicker showTime format="MM/DD/YYYY hh:mm A" />
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <Form.Item name="Name" label="Name" className="col-span-2">
                <Input readOnly />
              </Form.Item>
              <div className="flex flex-col justify-center">
                <Button
                  type="primary"
                  onClick={() => {
                    setShowPatient(true);
                  }}
                >
                  Search Patient
                </Button>
              </div>
            </div>
          </Form>
        </div>
        <div>
          <Form form={form2} onFinish={handleAdd} layout="vertical">
            <div className="grid lg:grid-cols-3">
              <Form.Item
                label="Price Category"
                name="PriceCategory"
                rules={[
                  {
                    required: true,
                    message: "Price category is required!",
                  },
                ]}
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
                  onChange={(v: any) => {
                    form2.setFieldsValue({
                      fk_Items_Id: undefined,
                      Price: undefined,
                    });
                    setPriceCategory(v);
                  }}
                >
                  <Select.Option key="O" value="OPD" title="Opd">
                    Opd
                  </Select.Option>
                  <Select.Option key="H" value="HMO" title="Hmo/Company">
                    Hmo/Company
                  </Select.Option>
                  <Select.Option key="S" value="SENIOR" title="Senior">
                    Senior/Pwd
                  </Select.Option>
                </Select>
              </Form.Item>
            </div>
            <Form.Item
              label="Items"
              name="fk_Items_Id"
              rules={[
                {
                  required: true,
                  message: "Please select an item!",
                },
              ]}
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
                onChange={(e: any) => {
                  const x: TPrice = prices.data.filter(
                    (f: TPrice) => f.Id === e
                  )[0];

                  form2.setFieldsValue({
                    Price: x.Price,
                  });
                  if (x.Inventoriable === "Y") {
                    handleGetQty(x.Id!);
                  } else {
                    setQty(undefined);
                  }
                }}
              >
                {prices.data &&
                  prices.data.map((d: TPrice) => (
                    <Select.Option
                      key={d.Id}
                      value={d.Id}
                      title={d.Description}
                    >
                      {d.Description}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <div className="grid lg:grid-cols-3 gap-4">
              <Form.Item name="Price" label="Price">
                <Input readOnly className="font-bold" />
              </Form.Item>
              <Form.Item name="Qty" label="Qty">
                <p className="font-bold">{Qty}</p>
              </Form.Item>
            </div>
          </Form>
        </div>
      </div>
      <Modal
        open={showPatients}
        onCancel={() => setShowPatient(false)}
        width={1200}
        footer={false}
      >
        <ListOfPatients handleSelect={handleSelect} />
      </Modal>
    </div>
  );
};
