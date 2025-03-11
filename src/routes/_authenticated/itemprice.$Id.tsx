import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Tooltip,
  notification,
} from "antd";
import useAppStore from "../../store";
import { PostData } from "../../helpers";
import { TItems, TPriceCategory, TPricePerItem } from "../../types";
import { useEffect, useState } from "react";
import Loading from "../../components/loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { BiEdit, BiTrash } from "react-icons/bi";

export const Route = createFileRoute("/_authenticated/itemprice/$Id")({
  component: () => <ItemPrice />,
});

const ItemPrice = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [rowId, setRowId] = useState(0);
  const [list, setList] = useState<TPricePerItem[] | undefined>([]);
  const [form] = Form.useForm();
  const store = useAppStore();
  const { Id } = Route.useParams();
  const [priceCategory, setPriceCategory] = useState<
    TPriceCategory[] | undefined
  >();

  const handleInitialize = async () => {
    let res = await PostData("GetRecords", {
      sp: "udp_GetItemDetailsById",
      parameters: {
        Id,
      },
    });
    if (res) {
      const x: TItems = res.parameters.lst[0];
      form.setFieldValue("Description", x.Description);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetPriceCategory",
      parameters: {},
    });
    if (res) {
      setPriceCategory(res.parameters.lst);
    }
    res = await PostData("GetRecords", {
      sp: "udp_GetPricePerItem",
      parameters: {
        ItemId: Id,
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      setList(res.parameters.lst);
    }
  };
  const handleSubmitForm = async (v: TPricePerItem) => {
    try {
      setIsProcessing(true);
      const res = await PostData("SavePrice", {
        fk_Items_Id: Id,
        Id: rowId,
        Price: v.Price,
        fk_Branches_Code: store.branchCode,
        fk_PriceCategory_Id: v.fk_PriceCategory_Id,
      });
      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });

          handleInitialize();
          setRowId(0);
          form.setFieldsValue({
            fk_PriceCategory_Id: undefined,
            Price: undefined,
          });
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error) {
      setIsProcessing(false);
    }
  };
  const handleDelete = async (data: TPricePerItem) => {
    try {
      const res = await PostData("DeletePrice", data);
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Successfully deleted!",
            placement: "topRight",
            duration: 3,
          });
          handleInitialize();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      console.log(error);
    }
  };
  const actionBodyTemplate = (data: TPricePerItem) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Space>
            <Button
              type="primary"
              icon={<BiEdit />}
              onClick={() => {
                setRowId(data.Id);
                form.setFieldsValue({
                  fk_PriceCategory_Id: data.fk_PriceCategory_Id,
                  Price: data.Price,
                });
              }}
            />

            <Popconfirm
              title="Delete this record?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                handleDelete(data);
              }}
            >
              <Button danger type="primary" icon={<BiTrash />} />
            </Popconfirm>
          </Space>
        </Tooltip>
      </Space>
    );
  };
  useEffect(() => {
    handleInitialize();
  }, []);
  return (
    <div className="cardBackGround ">
      <Divider>Item Prices</Divider>
      <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
        <div className="grid lg:grid-cols-5 gap-4">
          <Form.Item name="Description" label="Description">
            <Input readOnly />
          </Form.Item>
          <Form.Item
            name="fk_PriceCategory_Id"
            label="Price Category"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select>
              {priceCategory &&
                priceCategory.map((v: TPriceCategory) => (
                  <Select.Option value={v.Id} key={v.Id}>
                    {v.Description}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="Price"
            label="Price"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
          <div className="flex flex-col justify-center">
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              {rowId > 0 && (
                <Button
                  type="primary"
                  onClick={() => {
                    setRowId(0);
                    form.setFieldsValue({
                      fk_PriceCategory_Id: undefined,
                      Price: undefined,
                    });
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </Space>
          </div>
        </div>
      </Form>

      <div className="mt-2">
        {isProcessing ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={list}
            tableStyle={{ minWidth: "50rem" }}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filterDisplay="row"
          >
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
            <Column field="PriceCategory" header="Price Category"></Column>
            <Column field="Price" header="Price"></Column>
            <Column field="AddedBy" header="Added By"></Column>
            <Column field="DateAdded" header="Date Added"></Column>
            <Column field="UpdatedBy" header="Updated By"></Column>
            <Column field="DateUpdated" header="Date Updated"></Column>
          </DataTable>
        )}
      </div>
    </div>
  );
};
