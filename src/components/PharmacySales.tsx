import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Select,
  Space,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import { TItems } from "../types";
import dayjs from "dayjs";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import useAppStore from "../store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BsCheck2, BsTrash } from "react-icons/bs";
import PharmacyRequestDetails from "./PharmacyRequestDetails";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";

export default function PharmacySales() {
  const [showModal, setShowModal] = useState(false);
  const [formSearch] = Form.useForm();
  const q = useQueryClient();
  const store = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [Id, setId] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [amount, setAmount] = useState(0);
  const [change, setChange] = useState(0);
  const [net, setNet] = useState(0);
  const [NetAmount, setNetAmount] = useState(0);
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState([]);
  const [addedItems, setAddedItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | undefined>();
  const handleClose = () => {
    setShowModal(false);
  };
  const sales = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPharmacySalesMain",
        parameters: {
          DateFrom: formSearch.getFieldValue("DateFrom").format("YYYYMMDD"),
          DateTo: formSearch.getFieldValue("DateTo").format("YYYYMMDD"),
        },
      });
      if (res) {
        setNetAmount(
          res.parameters.lst.reduce((a: any, v: any) => (a = a + v.Net), 0)
        );
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const discountTypes = useQuery({
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
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
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
    form.setFieldValue("Customer", "CASH");
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
    let d = 0;
    if (!isNullOrUndefinedOrBlank(form.getFieldValue("DiscountType"))) {
      const discountRate = discountTypes.data?.filter(
        (f: any) => f.Id === form.getFieldValue("DiscountType")
      )[0].PharmacyDiscount;
      console.log(discountRate);
      d = amount * discountRate;
      setDiscount(d);
    }

    setAmount(amount);
    setNet(amount - d);
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

    if (change < 0) {
      notification.error({
        message: "Amount paid is not enough!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    try {
      setIsProcessing(true);
      const res = await PostData("SavePharmacySales", {
        main: {
          ...v,
          Id: 0,
          Date: dayjs(v.Date).format("YYYY-MM-DD"),
          BranchCode: store.branchCode,
          Amount: amount,
          AmountPaid: v.AmountPaid,
          GrossAmount: amount,
          Discount: discount,
        },
        details: addedItems,
      });

      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: "Sucessfully saved!",
            placement: "topRight",
            duration: 3,
          });
          setId(res.parameters.Id);
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
  const handleRemove = (data: any) => {
    const x = addedItems.filter((f: any) => f.fk_Items_Id !== data.fk_Items_Id);
    setAddedItems(x);
  };
  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Remove">
          <BsTrash
            size={20}
            className="text-red-500"
            onClick={() => handleRemove(data)}
          />
        </Tooltip>
      </Space>
    );
  };
  const actionBodyTemplate2 = (data: any) => {
    return (
      <Space>
        <Tooltip title="Open">
          <BsCheck2
            size={24}
            color="green"
            className="cursor-pointer"
            onClick={() => {
              setId(data.Id);
              setShowModal(true);
            }}
          />
        </Tooltip>
      </Space>
    );
  };
  const handleChangeAmountPaid = (e: any) => {
    const amountPaid = e;
    const change = amountPaid - net;
    setChange(change);
  };
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={4}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
          }}
        />

        <Column footer="" />
        <Column footer="" />
        <Column footer={NetAmount} />
      </Row>
    </ColumnGroup>
  );
  useEffect(() => {
    formSearch.setFieldsValue({
      DateFrom: dayjs(),
      DateTo: dayjs(),
    });
    handleGetItems();
  }, []);
  useEffect(() => {
    handleComputeTotal();
    console.log(isProcessing);
  }, [addedItems]);
  return (
    <>
      <Button type="primary" onClick={() => handleNew()}>
        New
      </Button>

      <Form
        form={formSearch}
        layout="inline"
        onFinish={() => {
          q.invalidateQueries({ queryKey: ["sales"] });
        }}
      >
        <Form.Item name="DateFrom" label="Date From">
          <DatePicker format={"MM/DD/YYYY"} />
        </Form.Item>
        <Form.Item name="DateTo" label="Date To">
          <DatePicker format={"MM/DD/YYYY"} />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary">
            Search
          </Button>
        </Form.Item>
      </Form>
      <DataTable
        value={sales.data}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No Records!"
        stripedRows
        size="small"
        footerColumnGroup={footerGroup}
      >
        <Column
          field="action"
          header="Action"
          body={(data: any) => actionBodyTemplate2(data)}
        ></Column>
        <Column field="Id" header="Transaction ID"></Column>
        <Column field="DateStr" header="Date"></Column>
        <Column field="Customer" header="Customer"></Column>
        <Column field="GrossAmount" header="Gross"></Column>
        <Column field="Discount" header="Discount"></Column>
        <Column field="Net" header="Net"></Column>
      </DataTable>
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
              <Form.Item name="Id" label="Id">
                <p className="text-lg font-bold">{Id}</p>
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

              <Form.Item name="DiscountType" label="Discount Type">
                <Select allowClear>
                  {discountTypes.data?.map((d: any) => (
                    <Select.Option key={d.Id} value={d.Id}>
                      {d.Description}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="OrNo" label="Or No.">
                <Input readOnly />
              </Form.Item>
              <Form.Item name="Amount" label="Gross Amount">
                <p className="text-lg font-bold"> {amount}</p>
              </Form.Item>
              <Form.Item name="Discount" label="Discount">
                <p className="text-lg font-bold">{discount}</p>
              </Form.Item>
              <Form.Item name="Amount" label="Net Amount">
                <p className="text-lg font-bold"> {net}</p>
              </Form.Item>
              <Form.Item
                name="AmountPaid"
                label="Amount Paid"
                rules={[
                  {
                    required: true,
                    message: "Amount Paid is required!",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  onChange={handleChangeAmountPaid}
                />
              </Form.Item>
              <Form.Item
                name="Change"
                label="Change"
                className="text-lg font-bold"
              >
                {change}
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Submit
                  </Button>
                </Space>
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
              <Column
                field="action"
                header="Action"
                body={(data: any) => actionBodyTemplate(data)}
              ></Column>
              <Column field="Description" header="Description"></Column>
              <Column field="Price" header="Price"></Column>
              <Column field="Quantity" header="Qty"></Column>
              <Column field="Amount" header="Amount"></Column>
            </DataTable>
          </div>
        </div>
      </Modal>
      <Modal
        open={showModal}
        destroyOnClose
        onCancel={() => setShowModal(false)}
        footer={false}
        width={500}
      >
        <PharmacyRequestDetails
          Id={Id}
          handleClose={handleClose}
          AppointmentId={0}
          RenderedBy="comlogik"
        />
      </Modal>
    </>
  );
}
