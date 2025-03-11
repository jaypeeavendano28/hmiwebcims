import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  AutoComplete,
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  notification,
} from "antd";
import { PostData, isNullOrUndefinedOrBlank } from "../../../helpers";
import {
  TDepartments,
  TItems,
  TLabCategory,
  TLabTypes,
  TQCounters,
  TSettings,
  TSoaDescriptions,
} from "../../../types";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { round } from "lodash";
import PackageDetails from "../../../components/PackageDetails";

export const Route = createFileRoute("/_authenticated/itemprofile/$Id")({
  component: () => <ItemProfile />,
});

const ItemProfile = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const { Id } = Route.useParams();
  const [showPackage, setShowPackage] = useState(false);
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetDepartments",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const soaDescription = useQuery<TSoaDescriptions[]>({
    queryKey: ["soaDescription"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetSoaDescriptions",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const labTypes = useQuery({
    queryKey: ["labTypes"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetLabTypes",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const labCategory = useQuery({
    queryKey: ["labCategory"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetLabCategory",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const unitOfMeasure = useQuery({
    queryKey: ["unitOfMeasure"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetSettings",
        parameters: {
          Code: "UOM",
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const qCounters = useQuery({
    queryKey: ["qCounters"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetQCounters",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const dosage = useQuery({
    queryKey: ["dosage"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetSettings",
        parameters: {
          Code: "DOSAGE",
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const handleGetItemDetails = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetItemDetailsById",
      parameters: {
        Id: Id,
      },
    });

    if (res) {
      const x: TItems = res.parameters.lst[0];

      //let QCounters: string[] = split(x.QCounter, ",");

      form.setFieldsValue({
        Id: x.Id,
        BarCodeNo: x.BarCodeNo,
        Description: x.Description,
        GenericName: x.GenericName,
        fk_Departments_Id: x.fk_Departments_Id,
        fk_LabTypes_Id: x.fk_LabTypes_Id,
        fk_LabCategory_Id: x.fk_LabCategory_Id,
        fk_SoaDescriptions_Id: x.fk_SoaDescriptions_Id,
        TestCode: x.TestCode,
        Conversion: x.Conversion,
        UnitCostPerPc: x.UnitCostPerPc,
        UnitCostPerBox: x.UnitCostPerBox,
        UnitOfMeasureSmall: x.UnitOfMeasureSmall,
        UnitOfMeasureBig: x.UnitOfMeasureBig,
        Dosage: x.Dosage,
        Discountable: x.Discountable,
        Inventoriable: x.Inventoriable,
        ForSale: x.ForSale,
        QCounter: x.QCounter,
        NeedAPhysician: x.NeedAPhysician,
        IsPackage: x.IsPackage,
        BeginningBalance: x.BeginningBalance,
        ForGender: x.ForGender,
        Strength: x.Strength,
      });
    }
  };
  const handleSubmit = async (v: TItems) => {
    if (v.fk_Departments_Id === 1040 || v.fk_Departments_Id === 1041) {
      if (isNullOrUndefinedOrBlank(v.fk_SoaDescriptions_Id)) {
        notification.error({
          message: "SOA Description is required!",
          placement: "topRight",
          duration: 3,
        });
        return;
      }
    }

    const res = await PostData("SaveItemProfile", { ...v, Id: Id });
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: "Item successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        //    console.log(res);
        // router.navigate({
        //   to: "/items",
        // });
        //   <Link
        //   to="/itemprofile/$Id"
        //   params={{
        //     Id: data !== undefined ? data.Id : "",
        //   }}
        // >
        if (Id === "0") {
          router.navigate({
            to: "/itemprofile/$Id",
            params: {
              Id: res.parameters.Id,
            },
          });
        }
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  const handleComputeCostPerPc = () => {
    const UnitCostPerBox: number = isNullOrUndefinedOrBlank(
      form.getFieldValue("UnitCostPerBox")
    )
      ? 0
      : form.getFieldValue("UnitCostPerBox");

    const Conversion: number = isNullOrUndefinedOrBlank(
      form.getFieldValue("Conversion")
    )
      ? 0
      : form.getFieldValue("Conversion");
    let UnitCostPerPc: number = 0;

    if (UnitCostPerBox + Conversion > 0) {
      UnitCostPerPc = round(UnitCostPerBox / Conversion, 2);
    }
    form.setFieldsValue({
      UnitCostPerPc: UnitCostPerPc,
    });
  };
  const handleSetPackageDetails = () => {
    if (form.getFieldValue("IsPackage") !== "Y") {
      notification.error({
        message: "Procedure/Item is not a package!",
        duration: 3,
        placement: "topRight",
      });
      return;
    }
    setShowPackage(true);
  };
  useEffect(() => {
    if (Id !== "0") {
      handleGetItemDetails();
    }
  }, []);
  return (
    <div className="cardBackGround  mx-auto">
      <Divider>Item Profile</Divider>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Form.Item name="Id" label="Id">
              <Input readOnly />
            </Form.Item>
            <Form.Item name="BarCodeNo" label="Barcode No.">
              <Input autoFocus />
            </Form.Item>
            <Form.Item
              name="Description"
              label="Description/Brand Name"
              rules={[
                {
                  required: true,
                  message: "Description/Brand name is required!",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="Generic Name" label="Generic Name">
              <Input />
            </Form.Item>
            <Form.Item
              label="Department"
              name="fk_Departments_Id"
              rules={[
                {
                  required: true,
                  message: "Please select a department!",
                },
              ]}
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
                {departments.data &&
                  departments.data.map((d: TDepartments) => (
                    <Select.Option key={d.Id} value={d.Id}>
                      {d.Description}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item label="SOA Description" name="fk_SoaDescriptions_Id">
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
                {soaDescription.data &&
                  soaDescription.data.map((d: TSoaDescriptions) => (
                    <Select.Option key={d.Id} value={d.Id}>
                      {d.Description}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="QCounter"
              label="Queue Counter"
              rules={[
                {
                  required: true,
                },
              ]}
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
                {qCounters.data &&
                  qCounters.data.map((d: TQCounters) => (
                    <Select.Option key={d.Code} value={d.Code}>
                      {d.Description}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Laboratory Type"
              name="fk_LabTypes_Id"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value && getFieldValue("fk_Departments_Id") === 1000) {
                      return Promise.reject("Laboratory Type is required!");
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
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
                {labTypes.data &&
                  labTypes.data.map((d: TLabTypes) => (
                    <Select.Option key={d.Id} value={d.Id}>
                      {d.Description}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Laboratory Category"
              name="fk_LabCategory_Id"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value && getFieldValue("fk_Departments_Id") === 1000) {
                      return Promise.reject("Laboratory category is required!");
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
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
                {labCategory.data &&
                  labCategory.data.map((d: TLabCategory) => (
                    <Select.Option key={d.Id} value={d.Id}>
                      {d.Description}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            {/* <Form.Item
              label="Soa Description"
              name="fk_SoaDescriptions_Id"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value && getFieldValue("ForSale") === "Y") {
                      return Promise.reject("Soa Description is required!");
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
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
                {soaDescriptions.data &&
                  soaDescriptions.data.map((d: TSoaDescriptions) => (
                    <Select.Option key={d.Id} value={d.Id}>
                      {d.Description}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item> */}
            <Form.Item name="TestCode" label="Test Code">
              <Input />
            </Form.Item>
          </div>
          <div>
            <div className="grid md:grid-cols-3">
              <Form.Item
                label="For Sale?"
                name="ForSale"
                rules={[
                  {
                    required: true,
                    message: "This field is required!",
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="Discountable?"
                name="Discountable"
                rules={[
                  {
                    required: true,
                    message: "This field is required!",
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="Inventoriable?"
                name="Inventoriable"
                rules={[
                  {
                    required: true,
                    message: "This field is required!",
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
            <div className="grid md:grid-cols-3">
              <Form.Item
                label="Need a Physician?"
                name="NeedAPhysician"
                rules={[
                  {
                    required: true,
                    message: "This field is required!",
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="Is Package?"
                name="IsPackage"
                rules={[
                  {
                    required: true,
                    message: "This field is required!",
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <div className="flex flex-col justify-center">
                <Button
                  disabled={Id === "0"}
                  type="primary"
                  onClick={handleSetPackageDetails}
                >
                  Package Details
                </Button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Form.Item
                name="ForGender"
                label="For Gender"
                rules={[
                  {
                    required: true,
                    message: "This field is required!",
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
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Form.Item
                name="UnitCostPerBox"
                label="UnitCost Per Box"
                // rules={[
                //   ({ getFieldValue }) => ({
                //     validator(_, value) {
                //       if (!value && getFieldValue("Inventoriable") === "Y") {
                //         return Promise.reject("Unit cost per box is required!");
                //       }
                //       return Promise.resolve();
                //     },
                //   }),
                // ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  onBlur={handleComputeCostPerPc}
                />
              </Form.Item>
              <Form.Item
                name="Conversion"
                label="Conversion"
                // rules={[
                //   ({ getFieldValue }) => ({
                //     validator(_, value) {
                //       if (!value && getFieldValue("Inventoriable") === "Y") {
                //         return Promise.reject("Conversion is required!");
                //       }
                //       return Promise.resolve();
                //     },
                //   }),
                // ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  onBlur={handleComputeCostPerPc}
                />
              </Form.Item>
              <Form.Item
                name="UnitCostPerPc"
                label="Unit Cost Per Pc."
                // rules={[
                //   ({ getFieldValue }) => ({
                //     validator(_, value) {
                //       if (!value && getFieldValue("Inventoriable") === "Y") {
                //         return Promise.reject("Unit cost per pc. is required!");
                //       }
                //       return Promise.resolve();
                //     },
                //   }),
                // ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <Form.Item
              name="UnitOfMeasureSmall"
              label="Unit Of Measure Small"
              normalize={(v) => v.toUpperCase()}
              // rules={[
              //   ({ getFieldValue }) => ({
              //     validator(_, value) {
              //       if (!value && getFieldValue("Inventoriable") === "Y") {
              //         return Promise.reject(
              //           "Unit of Measure Small is required!"
              //         );
              //       }
              //       return Promise.resolve();
              //     },
              //   }),
              // ]}
            >
              <AutoComplete
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {unitOfMeasure.data &&
                  unitOfMeasure.data!.map((v: TSettings) => (
                    <AutoComplete.Option
                      key={v.Id}
                      value={v.Value}
                      title={v.Value}
                    >
                      {v.Value}
                    </AutoComplete.Option>
                  ))}
              </AutoComplete>
            </Form.Item>
            <Form.Item
              name="UnitOfMeasureBig"
              label="Unit Of Measure Big"
              normalize={(v) => v.toUpperCase()}
              // rules={[
              //   ({ getFieldValue }) => ({
              //     validator(_, value) {
              //       if (!value && getFieldValue("Inventoriable") === "Y") {
              //         return Promise.reject("Unit of Measure Big is required!");
              //       }
              //       return Promise.resolve();
              //     },
              //   }),
              // ]}
            >
              <AutoComplete
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {unitOfMeasure.data &&
                  unitOfMeasure.data!.map((v: TSettings) => (
                    <AutoComplete.Option
                      key={v.Id}
                      value={v.Value}
                      title={v.Value}
                    >
                      {v.Value}
                    </AutoComplete.Option>
                  ))}
              </AutoComplete>
            </Form.Item>
            <Form.Item
              name="Dosage"
              label="Dosage"
              normalize={(v) => v.toUpperCase()}
            >
              <AutoComplete
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {dosage.data &&
                  dosage.data!.map((v: TSettings) => (
                    <AutoComplete.Option
                      key={v.Id}
                      value={v.Value}
                      title={v.Value}
                    >
                      {v.Value}
                    </AutoComplete.Option>
                  ))}
              </AutoComplete>
            </Form.Item>
            <Form.Item name="Strength" label="Strength">
              <Input />
            </Form.Item>
            <Form.Item name="BeginningBalance" label="Beginning Balance">
              <InputNumber />
            </Form.Item>
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </div>
          </div>
        </div>
      </Form>
      <Modal
        open={showPackage}
        footer={false}
        onCancel={() => setShowPackage(false)}
        width={1000}
      >
        <PackageDetails Id2={Id} />
      </Modal>
    </div>
  );
};
