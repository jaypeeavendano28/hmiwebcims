import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import { TItems } from "../types";
import dayjs from "dayjs";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import useAppStore from "../store";

export default function PharmacySales() {
  const store = useAppStore();
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState([]);
  const [addedItems, setAddedItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | undefined>();
  const handleGetItems = async () => {
    let res = await PostData("GetRecords", {
      sp: "udp_GetInventoryItems",
      parameters: {},
    });

    if (res) {
      setItems(res.parameters.lst);
    }
  };
  const handleSelectItem = (e: any) => {
    const item: any = items.filter((f: any) => f.Id === e)[0];
    setSelectedItem(item);
    form2.setFieldsValue({
      Price: item.Price,
      QtyOnHand: item.Qty01,
    });
  };
  const handleNew = () => {
    setModal(true);
    form.resetFields();
    form2.resetFields();
    form.setFieldValue("Date", dayjs());
    setAddedItems([]);
  };

  const handleAddItem = () => {
    if (isNullOrUndefinedOrBlank(selectedItem)) {
      notification.error({
        message: "Please select an item!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }
    const price: number = form2.getFieldValue("Price");
    const qty: number = form2.getFieldValue("Qty");

    setAddedItems([
      ...addedItems,
      {
        Description: selectedItem.Description,
        Price: price,
        Quantity: qty,
        Amount: price * qty,
        fk_Items_Id: selectedItem.fk_Items_Id,
      },
    ]);
    form2.resetFields();
  };

  const handleComputeTotal = () => {
    let amount: number = 0;
    addedItems.map((v: any) => {
      amount = amount + v.Amount;
    });
    form.setFieldValue("Amount", amount);
  };
  const handleSubmitSales = async (v: any) => {
    if (addedItems.length <= 0) {
      notification.error({
        message: "Please add an item to saved!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }
    try {
      const res = await PostData("SavePharmacySales", {
        main: {
          ...v,
          Id: 0,
          Date: dayjs(v.Date).format("YYYY-MM-DD"),
          BranchCode: store.branchCode,
        },
        details: addedItems,
      });

      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Sucessfully saved!",
            placement: "topRight",
            duration: 3,
          });
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
        placement: "topRight",
        duration: 3,
      });
    }
  };
  useEffect(() => {
    handleGetItems();
  }, []);
  useEffect(() => {
    handleComputeTotal();
  }, [addedItems]);
  return (
    <>
      <Button type="primary" onClick={() => handleNew()}>
        New
      </Button>
      <Modal
        open={modal}
        onCancel={() => setModal(false)}
        destroyOnClose
        width={window.innerWidth - 100}
        footer={false}
      >
        <div className="grid lg:grid-cols-6 gap-4">
          <div className="col-span-2">
            <Form
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              form={form}
              onFinish={handleSubmitSales}
            >
              <Form.Item name="TransactionNo" label="Transaction No.">
                <Input readOnly />
              </Form.Item>
              <Form.Item
                name="Date"
                label="Date"
                rules={[
                  {
                    required: true,
                    message: "Transaction Date and Time is required!",
                  },
                ]}
              >
                <DatePicker showTime readOnly format="MM/DD/YYYY hh:mm A" />
              </Form.Item>
              <Form.Item
                name="Customer"
                label="Customer"
                rules={[
                  {
                    required: true,
                    message: "Customer is required!",
                  },
                ]}
                normalize={(v) => v.toUpperCase()}
              >
                <Input />
              </Form.Item>
              <Form.Item name="OrNo" label="Or No.">
                <Input readOnly />
              </Form.Item>
              <Form.Item name="Amount" label="Total Amount">
                <Input readOnly />
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </div>
          <div className="col-span-4">
            <Form
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
              form={form2}
              onFinish={() => handleAddItem()}
            >
              <Form.Item name="Items" label="Items">
                <Select
                  onSelect={(e) => handleSelectItem(e)}
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
                  {items.map((d: TItems) => (
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
              <Form.Item name="QtyOnHand" label="Quantity On Hand">
                <Input readOnly />
              </Form.Item>
              <Form.Item
                name="Price"
                label="Price"
                rules={[
                  {
                    required: true,
                    message: "Price is required!",
                  },
                ]}
              >
                <InputNumber readOnly precision={2} />
              </Form.Item>
              <Form.Item
                name="Qty"
                label="Quantity"
                rules={[
                  {
                    required: true,
                    message: "Quantity is required!",
                  },
                ]}
              >
                <InputNumber />
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
                <Button type="primary" htmlType="submit">
                  Add
                </Button>
              </Form.Item>
            </Form>
            <DataTable
              value={addedItems}
              tableStyle={{ minWidth: "50rem" }}
              rowsPerPageOptions={[10, 25, 50]}
              emptyMessage="No Records!"
              stripedRows
              size="small"
            >
              <Column field="Description" header="Description"></Column>
              <Column field="Price" header="Price"></Column>
              <Column field="Qty" header="Qty"></Column>
              <Column field="Amount" header="Amount"></Column>
            </DataTable>
          </div>
        </div>
      </Modal>
    </>
  );
}
