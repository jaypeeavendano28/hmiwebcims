import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  notification,
  Select,
  Space,
  Tooltip,
} from 'antd';
import { useEffect, useState } from 'react';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';
import { TPrice } from '../types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import useAppStore from '../store';
import { BsTrash } from 'react-icons/bs';
type Props = {
  Name?: string;
  AppointmentId?: number;
};
export default function RequestForMedicines({ Name, AppointmentId }: Props) {
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  // const [items, setItems] = useState([]);
  const [addedItems, setAddedItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | undefined>();
  const store = useAppStore();
  const { modal } = App.useApp();
  // const handleGetItems = async () => {
  //   let res = await PostData("GetRecords", {
  //     sp: "udp_GetInventoryItemsForRequest",
  //     parameters: {},
  //   });

  //   if (res) {
  //     setItems(res.parameters.lst);
  //   }
  // };

  const items = useQuery({
    queryKey: ['items_prices2'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetItemPrices2',
        parameters: {
          BranchCode: store.branchCode,
          SearchStr: '',
          Gender: '',
          DepartmentId: 1016,
        },
      });
      if (res) {
        return res.parameters.lst as TPrice[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleSelectItem = (e: any) => {
    const item: any = items.data?.filter((f: any) => f.Id === e)[0];
    setSelectedItem(item);
    form2.setFieldsValue({
      Price: item.Price,
      QtyOnHand: item.Qty ?? 0,
      Qty: undefined,
    });
  };

  const allSelectedAddItemIds = addedItems.map((item) => item.Id);
  const handleAddItem = () => {
    if (isNullOrUndefinedOrBlank(selectedItem)) {
      notification.error({
        message: 'Please select an item!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    const price: number = form2.getFieldValue('Price');
    const qty: number = form2.getFieldValue('Qty');

    if (allSelectedAddItemIds.includes(selectedItem?.Id)) {
      modal.error({
        title: 'Pharmacy',
        centered: true,
        content: `${selectedItem?.Description} is already added!`,
      });
      return;
    }

    if (qty < 1) {
      modal.error({
        title: 'Pharmacy',
        centered: true,
        content: `Quantity cannot be zero or negative.`,
      });
      return;
    }

    setAddedItems([
      ...addedItems,
      {
        Id: selectedItem?.Id,
        Description: selectedItem?.Description,
        Price: price,
        Quantity: qty,
        Amount: price * qty,
        fk_Items_Id: selectedItem?.ItemId,
      },
    ]);
    form2.setFieldsValue({
      Items: undefined,
      QtyOnHand: undefined,
      Qty: undefined,
    });
  };

  const handleComputeTotal = () => {
    let amount: number = 0;
    addedItems.map((v: any) => {
      amount = amount + v.Amount;
    });
    form.setFieldValue('Amount', amount);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    if (!values) {
      return;
    }
    if (addedItems.length === 0) {
      notification.error({
        message: 'Please add item(s)!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    // console.log({
    //   AppointmentId: AppointmentId,
    //   Date: values.Date,
    //   Items: addedItems.map((item) => ({
    //     Id: item.Id,
    //     Qty: item.Quantity,
    //     Price: item.Price,
    //     fk_Appointments_Id: AppointmentId,
    //     fk_Items_Id: item.fk_Items_Id,
    //     Description: item.Description,
    //   })),
    // });
    const res = await PostData('SaveRequestedItems', {
      AppointmentId: AppointmentId,
      Date: values.Date,
      Items: addedItems.map((item) => ({
        Id: item.Id,
        Qty: item.Quantity,
        Price: item.Price,
        fk_Appointments_Id: AppointmentId,
        fk_Items_Id: item.fk_Items_Id,
        Description: item.Description,
      })),
    });

    if (res) {
      if (res.status === 1) {
        notification.success({
          message: 'Successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
        setAddedItems([]);
      }
    }
  };
  useEffect(() => {
    // handleGetItems();
    form.setFieldsValue({
      Customer: Name,
      AppointmentId: AppointmentId,
      Date: dayjs(),
    });
  }, []);
  useEffect(() => {
    handleComputeTotal();
  }, [addedItems]);

  const actionBodyTemplate = (data: any) => {
    const handleRemove = (data: any) => {
      const x = addedItems.filter(
        (f: any) => f.fk_Items_Id !== data.fk_Items_Id,
      );
      setAddedItems(x);
    };
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
  return (
    <>
      <div className="grid lg:grid-cols-6 gap-4">
        <div className="col-span-2">
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            form={form}
            // onFinish={handleSubmit}
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
                  message: 'Transaction Date and Time is required!',
                },
              ]}
            >
              <DatePicker showTime readOnly format="MM/DD/YYYY hh:mm A" />
            </Form.Item>
            <Form.Item name="AppointmentId" label="Appointment Id">
              <Input readOnly />
            </Form.Item>
            <Form.Item
              name="Customer"
              label="Customer"
              rules={[
                {
                  required: true,
                  message: 'Customer is required!',
                },
              ]}
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>

            {/* <Form.Item name="Amount" label="Total Amount">
              <Input readOnly />
            </Form.Item> */}
            {/* <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item> */}
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
                options={items.data?.map((d) => ({
                  value: d.Id,
                  // label: d.Description,
                  label: `${d.Description} - ${d.Price}`,
                }))}
                optionFilterProp="label"
                // filterOption={(input, option) =>
                //   (
                //     option!.children
                //       ?.toString()
                //       .toLocaleLowerCase() as unknown as string
                //   ).includes(input.toLocaleLowerCase())
                // }
              >
                {/* {items.map((d: TItems) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Description}>
                    {d.Description}
                  </Select.Option>
                ))} */}
              </Select>
            </Form.Item>
            <Form.Item name="QtyOnHand" label="Quantity On Hand">
              <Input readOnly />
            </Form.Item>

            <Form.Item
              name="Qty"
              label="Quantity"
              rules={[
                {
                  required: true,
                  message: 'Quantity is required!',
                },
              ]}
            >
              <InputNumber max={selectedItem?.Qty ? selectedItem?.Qty : 0} />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
              <Space>
                <Button type="primary" htmlType="submit">
                  Add
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleSubmit()}
                  disabled={addedItems.length === 0}
                >
                  Submit Request
                </Button>
              </Space>
            </Form.Item>
          </Form>
          <DataTable
            value={addedItems}
            tableStyle={{ minWidth: '50rem' }}
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
            {/* <Column field="Price" header="Price"></Column> */}
            <Column field="Quantity" header="Qty"></Column>
            {/* <Column field="Amount" header="Amount"></Column> */}
          </DataTable>
        </div>
      </div>
    </>
  );
}
