import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostData } from "../helpers";
import {
  Button,
  Form,
  notification,
  Popconfirm,
  Select,
  Space,
  Tooltip,
} from "antd";
import { TItems, TPackageDetails } from "../types";
import Loading from "./loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { BsTrash } from "react-icons/bs";

export default function PackageDetails({ Id2 }: { Id2: string }) {
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
  const handleDelete = async (data: TItems) => {
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
  const actionBodyTemplate = (data: TItems) => {
    //  store.setItemDetails(data);
    return (
      <Space>
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
  return (
    <>
      <div className="text-center font-bold font-md">Package Details</div>
      <Form form={form} layout="vertical" onFinish={handleAdd}>
        <div className="grid grid-cols-2 gap-4">
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
            >
              {items.data &&
                items.data.map((d: TItems) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Description}>
                    {d.Description}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <div className="flex flex-col justify-center items-start">
            <Button type="primary" htmlType="submit">
              Add
            </Button>
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
          >
            <Column
              field="action"
              header="Action"
              body={(data: TItems) => actionBodyTemplate(data)}
            ></Column>
            <Column field="Description" header="Description"></Column>
            <Column field="AddedBy" header="Added By"></Column>
            <Column field="DateAdded" header="Date Added"></Column>
            <Column field="fk_Items_Id" header="Item Id"></Column>
          </DataTable>
        )}
      </div>
    </>
  );
}
