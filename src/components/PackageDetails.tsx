import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import {
  Button,
  Form,
  InputNumber,
  notification,
  Popconfirm,
  Select,
  Space,
  Tooltip,
} from "antd";
import { TItems, TPackageDetails, TPrice } from "../types";
import Loading from "./loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { BsTrash } from "react-icons/bs";
import useAppStore from "../store";
import { BiEditAlt } from "react-icons/bi";
import { useState } from "react";

export default function PackageDetails({ Id2 }: { Id2: string }) {
  const [expandedRows, setExpandedRows] = useState<
    TPackageDetails | undefined
  >();
  const [selectedItem, setSelectedItem] = useState<
    TPackageDetails | undefined
  >();

  const store = useAppStore();
  const q = useQueryClient();
  const [form] = Form.useForm();
  const items = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetItems",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const details = useQuery({
    queryKey: ["details"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPackageDetails",
        parameters: { Id: Id2 },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleAdd = async (data: TPackageDetails) => {
    try {
      const res = await PostData("AddToPackageDetails", {
        ...data,
        PackageMainId: Id2,
        Id: selectedItem ? selectedItem.Id : 0,
      });
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Successfully added!",
            placement: "topRight",
            duration: 3,
          });
          form.resetFields();
          q.invalidateQueries({ queryKey: ["details"] });
          setSelectedItem(undefined);
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
        duration: 3,
        placement: "topRight",
      });
    }
  };
  const handleDelete = async (data: TPackageDetails) => {
    try {
      const res = await PostData("DeletePackageDetails", data);
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Successfully deleted!",
            placement: "topRight",
            duration: 3,
          });
          q.invalidateQueries({ queryKey: ["details"] });
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
        duration: 3,
        placement: "topRight",
      });
    }
  };
  const handleEdit = (data: TPackageDetails) => {
    setSelectedItem(data);
    form.setFieldsValue(data);
  };
  const actionBodyTemplate = (data: TPackageDetails) => {
    return (
      isNullOrUndefinedOrBlank(selectedItem) === true && (
        <>
          <Space>
            <Tooltip title="Edit">
              <BiEditAlt
                size="16"
                className="cursor-pointer"
                onClick={() => handleEdit(data)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete record!"
                okText="Yes"
                cancelText="No"
                onConfirm={() => handleDelete(data)}
              >
                <BsTrash color="red" size="16" className="cursor-pointer" />
              </Popconfirm>
            </Tooltip>
          </Space>
        </>
      )

      // <Space>
      //   <Tooltip title="Edit">
      //     <Link
      //       to="/itemprofile/$Id"
      //       params={{
      //         Id: data !== undefined ? data.Id : "",
      //       }}
      //     >
      //       <Button type="primary" icon={<BiEdit />} />
      //     </Link>
      //   </Tooltip>
      //   <Tooltip title="Prices">
      //     <Link
      //       to="/itemprice/$Id"
      //       params={{
      //         Id: data.Id,
      //       }}
      //       onClick={() => store.setItemDetails(data)}
      //     >
      //       <Button
      //         icon={<TbCurrencyPeso />}
      //         disabled={data.ForSale === "N"}
      //         type="primary"
      //       />
      //     </Link>
      //   </Tooltip>
      //   <Tooltip title="Delete">
      //     <Button
      //       type="primary"
      //       icon={<BiTrash />}
      //       onClick={() => {
      //         setSelectedItem(data);
      //         setShowDelete(true);
      //       }}
      //     />
      //   </Tooltip>
      // </Space>
    );
  };
  const handleChangeItem = async (value: string) => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPricePerItem",
      parameters: {
        BranchCode: store.branchCode,
        ItemId: value,
      },
    });
    if (res) {
      const x: TPrice[] = res.parameters.lst;
      const price: TPrice = x.filter(
        (d: TPrice) => d.PriceCategoryCode === "OPD"
      )[0];
      console.log(price);
      form.setFieldValue("Price", price.Price);
    }

    form.setFieldsValue({
      Qty: 1,
    });
  };
  const rowExpansionTemplate = (data: TPackageDetails) => {
    return (
      <div className="p-3">
        <div>Added By</div>
        <div>
          <strong>{data.AddedBy}</strong>
        </div>
        <div>Date Added</div>
        <div>
          <strong>{data.DateAdded}</strong>
        </div>
        <div>Updated By</div>
        <div>
          <strong>{data.UpdatedBy}</strong>
        </div>
        <div>Date Updated</div>
        <div>
          <strong>{data.DateUpdated}</strong>
        </div>
      </div>
    );
  };
  return (
    <>
      <div className="text-center font-bold font-md">Package Details</div>
      <Form form={form} layout="vertical" onFinish={handleAdd}>
        <div className="grid grid-cols-1">
          <Form.Item name="fk_Items_Id" label="Item/Procedure">
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
              onChange={handleChangeItem}
            >
              {items.data &&
                items.data.map((d: TItems) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Description}>
                    {d.ItemDescription}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="Price"
              label="Price"
              rules={[{ required: true, message: "Price is required!" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} precision={2} />
            </Form.Item>
            <Form.Item
              name="Qty"
              label="Quantity"
              rules={[{ required: true, message: "Quantity is required!" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} precision={2} />
            </Form.Item>
          </div>
          <div className="flex flex-col justify-center items-start">
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedItem ? "Update" : "Add"}
              </Button>
              {selectedItem && (
                <>
                  <Button
                    type="primary"
                    onClick={() => {
                      form.resetFields();
                      setSelectedItem(undefined);
                    }}
                  >
                    Cancel Edit
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>
      </Form>
      <div className="mt-2">
        {details.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={details.data}
            tableStyle={{ minWidth: "50rem" }}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            rowExpansionTemplate={rowExpansionTemplate}
            expandedRows={expandedRows as any}
            onRowToggle={(e) => setExpandedRows(e.data as any)}
          >
            <Column expander={details.data} style={{ width: "5rem" }} />
            <Column field="Description" header="Description"></Column>
            <Column field="Qty" header="Qty"></Column>
            <Column field="Price" header="Price"></Column>

            {isNullOrUndefinedOrBlank(selectedItem) && (
              <Column
                field="action"
                header="Action"
                body={(data: TPackageDetails) => actionBodyTemplate(data)}
              ></Column>
            )}
          </DataTable>
        )}
      </div>
    </>
  );
}
