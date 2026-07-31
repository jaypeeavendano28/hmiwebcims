import {
  App,
  AutoComplete,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Select,
  Space,
  Switch,
  Tabs,
  Tooltip,
} from 'antd';
import { useEffect, useState } from 'react';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';
import { TDiscountTypes, TPrice } from '../types';
import dayjs from 'dayjs';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import useAppStore from '../store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BsCashCoin, BsTrash } from 'react-icons/bs';
import PharmacyRequestDetails from './PharmacyRequestDetails';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import FinalizeForm from './FinalizeForm';

const roundCurrency = (value: number) => Math.round(value * 100) / 100;
const getSaleNetAmount = (sale: any) =>
  roundCurrency(
    Number(
      sale?.Net ??
        Number(sale?.GrossAmount ?? 0) - Number(sale?.Discount ?? 0),
    ),
  );
const customerOptions = ['CASH', 'BANK TRANSFER', 'MAYA'].map((value) => ({
  value,
}));
const isFalseFlag = (value: unknown) =>
  value === false ||
  value === 0 ||
  ['0', 'N', 'NO', 'FALSE'].includes(
    String(value ?? '')
      .trim()
      .toUpperCase(),
  );
const isTrueFlag = (value: unknown) =>
  value === true ||
  value === 1 ||
  ['1', 'Y', 'YES', 'TRUE'].includes(
    String(value ?? '')
      .trim()
      .toUpperCase(),
  );

const computePharmacySalesTotals = (
  saleItems: any[],
  discountTypeId: unknown,
  discountTypes?: TDiscountTypes[],
) => {
  const grossAmount = roundCurrency(
    saleItems.reduce(
      (total: number, item: any) => total + Number(item.Amount ?? 0),
      0,
    ),
  );
  const selectedDiscountType = isNullOrUndefinedOrBlank(discountTypeId)
    ? undefined
    : discountTypes?.find(
        (discountType) => String(discountType.Id) === String(discountTypeId),
      );
  const discountRate = Number(selectedDiscountType?.PharmacyDiscount ?? 0);
  const totalDiscount = roundCurrency(
    saleItems.reduce((total: number, item: any) => {
      const itemAmount = Number(item.Amount ?? 0);

      if (discountRate !== 0.2 || !isFalseFlag(item.VatExcept)) {
        return total + itemAmount * discountRate;
      }

      const removedVat = roundCurrency(itemAmount - itemAmount / 1.12);
      const vatExclusiveAmount = itemAmount - removedVat;
      const seniorOrPwdDiscount = roundCurrency(
        vatExclusiveAmount * discountRate,
      );

      return total + removedVat + seniorOrPwdDiscount;
    }, 0),
  );
  const netAmount = roundCurrency(grossAmount - totalDiscount);

  return {
    grossAmount,
    totalDiscount,
    netAmount,
  };
};

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
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [modalOpen, setModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>();
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    sale: any;
    reason: string;
  }>();
  // const [items, setItems] = useState([]);
  const [addedItems, setAddedItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<TPrice | undefined>();
  const selectedDiscountType = Form.useWatch('DiscountType', form);
  const amountPaid = Form.useWatch('AmountPaid', form);
  const pendingAmountPaid = Form.useWatch('AmountPaid', paymentForm);
  const isForPayment = Form.useWatch('IsForPayment', form) === true;
  const handleClose = () => {
    setShowModal(false);
  };
  const { modal } = App.useApp();

  const sales = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPharmacySalesMain',
        parameters: {
          DateFrom: formSearch.getFieldValue('DateFrom').format('YYYYMMDD'),
          DateTo: formSearch.getFieldValue('DateTo').format('YYYYMMDD'),
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const discountTypes = useQuery<TDiscountTypes[]>({
    queryKey: ['discountTypes'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDiscountTypes',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  // const handleGetItems = async () => {
  //   let res = await PostData('GetRecords', {
  //     sp: 'udp_GetInventoryItems',
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
        const list = res.parameters.lst as TPrice[];
        const opdList = list.filter((d) => d.PriceCategory2 === 'OPD');
        return opdList;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: modalOpen,
  });

  const handleSelectItem = (e: TPrice) => {
    const item: any = items?.data?.filter((f: any) => f.Id === e)[0];

    setSelectedItem(item);

    form2.setFieldsValue({
      Price: item.Price,
      QtyOnHand: item.Qty ?? 0,
    });
  };
  const handleNew = () => {
    setModal(true);
    setId(0);
    form.resetFields();
    form2.resetFields();
    form.setFieldValue('Date', dayjs());
    form.setFieldValue('Customer', 'CASH');
    form.setFieldValue('IsForPayment', false);
    setAddedItems([]);
    setSelectedItem(undefined);
    setAmount(0);
    setDiscount(0);
    setNet(0);
    setChange(0);
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
        VatExcept: selectedItem?.VatExcept,
      },
    ]);
    form2.resetFields();
    setSelectedItem(undefined);
  };

  console.log(items.data);
  const handleSubmitSales = async (v: any) => {
    if (addedItems.length <= 0) {
      notification.error({
        message: 'Please add an item to saved!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    const totals = computePharmacySalesTotals(
      addedItems,
      v.DiscountType,
      discountTypes.data,
    );
    const isForPayment = v.IsForPayment === true;
    const amountPaid = Number(v.AmountPaid ?? 0);

    if (!isForPayment && amountPaid - totals.netAmount < 0) {
      notification.error({
        message: 'Amount paid is not enough!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    try {
      setIsProcessing(true);

      const res = await PostData('SavePharmacySales', {
        main: {
          ...v,
          Id: 0,
          Date: dayjs(v.Date).format('YYYY-MM-DD'),
          BranchCode: store.branchCode,
          Amount: totals.grossAmount,
          AmountPaid: isForPayment ? v.AmountPaid ?? null : v.AmountPaid,
          IsForPayment: isForPayment,
          OrNo: isForPayment ? null : v.OrNo,
          GrossAmount: totals.grossAmount,
          Discount: totals.totalDiscount,
        },
        details: addedItems,
      });

      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: 'Sucessfully saved!',
            placement: 'topRight',
            duration: 3,
          });
          setId(res.parameters.Id);
          setModal(false);
          await q.invalidateQueries({ queryKey: ['sales'] });
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const handleRemove = (data: any) => {
    setAddedItems((prev) => prev.filter((item: any) => item.Id !== data.Id));
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
  const handleDeleteSale = (data: any) => {
    let deleteReason = '';

    modal.confirm({
      title: `Delete pharmacy sale ${data.Id}?`,
      content: (
        <Input.TextArea
          placeholder="Enter delete reason"
          autoSize={{ minRows: 2, maxRows: 4 }}
          onChange={(e) => {
            deleteReason = e.target.value;
          }}
        />
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => {
        if (isNullOrUndefinedOrBlank(deleteReason.trim())) {
          notification.error({
            message: 'Please enter a delete reason!',
            placement: 'topRight',
            duration: 3,
          });
          return Promise.reject();
        }

        setPendingDelete({
          sale: data,
          reason: deleteReason.trim(),
        });
      },
    });
  };

  const handleConfirmDeleteSale = async (credentials: any) => {
    if (!pendingDelete) return;

    try {
      const res = await PostData('DeletePharmacySales', {
        PharmacySalesId: pendingDelete.sale.Id,
        DeleteReason: pendingDelete.reason,
        Username: credentials.Username,
        Password: credentials.Password,
      });

      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? 'Unable to delete pharmacy sale.',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      notification.success({
        message: 'Pharmacy sale successfully deleted!',
        placement: 'topRight',
        duration: 3,
      });
      setPendingDelete(undefined);
      await q.invalidateQueries({ queryKey: ['sales'] });
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const handleOpenPayment = (sale: any) => {
    const amountDue = getSaleNetAmount(sale);

    setPendingPayment(sale);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      OrNo: '',
      AmountPaid: amountDue,
    });
  };

  const handlePayPharmacySale = async (values: any) => {
    if (!pendingPayment) return;

    const amountDue = getSaleNetAmount(pendingPayment);
    const paidAmount = Number(values.AmountPaid ?? 0);

    if (paidAmount < amountDue) {
      notification.error({
        message: 'Amount paid is not enough!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    try {
      setIsPaymentProcessing(true);

      const res = await PostData('PayPharmacySale', {
        PharmacySalesId: pendingPayment.Id,
        OrNo: String(values.OrNo ?? '').trim(),
        AmountPaid: paidAmount,
      });

      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? 'Unable to post pharmacy payment.',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      notification.success({
        message: 'Pharmacy payment successfully posted!',
        placement: 'topRight',
        duration: 3,
      });
      setPendingPayment(undefined);
      paymentForm.resetFields();
      await q.invalidateQueries({ queryKey: ['sales'] });
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const actionBodyTemplate2 = (data: any, canPay = false) => {
    return (
      <Space>
        {canPay && (
          <Tooltip title="Pay">
            <Button
              type="text"
              className="!px-2"
              onClick={() => handleOpenPayment(data)}
            >
              <BsCashCoin size={20} className="text-green-600" />
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Open">
          {/* <Button
            type="text"
            className="!px-2"
            disabled={data.DateRendered !== null}
            onClick={() => {
              setId(data.Id);
              setShowModal(true);
            }}
          >
            <BsCheck2 size={24} color="green" className="cursor-pointer" />
          </Button> */}
        </Tooltip>
        <Tooltip title="Delete">
          <Button
            type="text"
            danger
            className="!px-2"
            onClick={() => handleDeleteSale(data)}
          >
            <BsTrash size={20} />
          </Button>
        </Tooltip>
      </Space>
    );
  };
  const handleChangeAmountPaid = (e: any) => {
    if (isForPayment || isNullOrUndefinedOrBlank(e)) {
      setChange(0);
      return;
    }

    setChange(roundCurrency(Number(e) - net));
  };
  const footerGroup = (netAmount: number) => (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={6}
          footerStyle={{
            textAlign: 'right',
            fontWeight: 'bold',
          }}
        />

        <Column footer="" />
        <Column footer="" />
        <Column footer={netAmount} />
      </Row>
    </ColumnGroup>
  );
  const renderSalesTable = (rows: any[], canPay = false) => (
    <DataTable
      value={rows}
      paginator
      rows={10}
      rowsPerPageOptions={[10, 25, 50]}
      emptyMessage="No Records!"
      stripedRows
      size="small"
      footerColumnGroup={footerGroup(
        rows.reduce(
          (total: number, sale: any) => total + Number(sale.Net ?? 0),
          0,
        ),
      )}
    >
      <Column
        field="action"
        header="Action"
        body={(data: any) => actionBodyTemplate2(data, canPay)}
      ></Column>
      <Column field="Id" header="Transaction ID"></Column>
      <Column field="DateStr" header="Date"></Column>
      <Column field="Customer" header="Customer"></Column>
      <Column field="ItemNames" header="Items"></Column>
      <Column field="Cashier" header="Cashier"></Column>
      <Column field="GrossAmount" header="Gross"></Column>
      <Column field="Discount" header="Discount"></Column>
      <Column field="Net" header="Net"></Column>
    </DataTable>
  );
  useEffect(() => {
    formSearch.setFieldsValue({
      DateFrom: dayjs(),
      DateTo: dayjs(),
    });
    // handleGetItems();
  }, []);
  useEffect(() => {
    const totals = computePharmacySalesTotals(
      addedItems,
      selectedDiscountType,
      discountTypes.data,
    );
    const nextChange =
      isForPayment || isNullOrUndefinedOrBlank(amountPaid)
        ? 0
        : roundCurrency(Number(amountPaid) - totals.netAmount);

    setAmount(totals.grossAmount);
    setDiscount(totals.totalDiscount);
    setNet(totals.netAmount);
    setChange(nextChange);
  }, [
    addedItems,
    amountPaid,
    discountTypes.data,
    isForPayment,
    selectedDiscountType,
  ]);
  const saleRows = Array.isArray(sales.data) ? sales.data : [];
  const regularSaleRows = saleRows.filter(
    (sale: any) => !isTrueFlag(sale.IsForPayment),
  );
  const forPaymentSaleRows = saleRows.filter((sale: any) =>
    isTrueFlag(sale.IsForPayment),
  );

  return (
    <>
      <Button type="primary" onClick={() => handleNew()}>
        New
      </Button>

      <Form
        form={formSearch}
        layout="inline"
        onFinish={() => {
          q.invalidateQueries({ queryKey: ['sales'] });
        }}
      >
        <Form.Item name="DateFrom" label="Date From">
          <DatePicker format={'MM/DD/YYYY'} />
        </Form.Item>
        <Form.Item name="DateTo" label="Date To">
          <DatePicker format={'MM/DD/YYYY'} />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary">
            Search
          </Button>
        </Form.Item>
      </Form>
      <Tabs
        defaultActiveKey="sales"
        items={[
          {
            key: 'sales',
            label: 'Sales',
            children: renderSalesTable(regularSaleRows),
          },
          {
            key: 'for-payment',
            label: 'For Payment',
            children: renderSalesTable(forPaymentSaleRows, true),
          },
        ]}
      />
      <Modal
        title="Pay Pharmacy Sale"
        open={Boolean(pendingPayment)}
        destroyOnClose
        onCancel={() => {
          setPendingPayment(undefined);
          paymentForm.resetFields();
        }}
        footer={false}
        width={460}
      >
        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 border-b border-slate-200 pb-4 text-sm">
          <span className="text-slate-500">Transaction ID</span>
          <strong>{pendingPayment?.Id}</strong>
          <span className="text-slate-500">Customer</span>
          <strong>{pendingPayment?.Customer}</strong>
          <span className="text-slate-500">Amount Due</span>
          <strong>{getSaleNetAmount(pendingPayment).toFixed(2)}</strong>
        </div>
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handlePayPharmacySale}
        >
          <Form.Item
            name="OrNo"
            label="O.R. No."
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'O.R. No. is required!',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="AmountPaid"
            label="Amount Paid"
            rules={[
              {
                required: true,
                message: 'Amount paid is required!',
              },
            ]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <div className="mb-5 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-slate-500">Change</span>
            <strong>
              {Math.max(
                0,
                roundCurrency(
                  Number(pendingAmountPaid ?? 0) -
                    getSaleNetAmount(pendingPayment),
                ),
              ).toFixed(2)}
            </strong>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setPendingPayment(undefined);
                paymentForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPaymentProcessing}
              icon={<BsCashCoin />}
            >
              Pay
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={modalOpen}
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
                    message: 'Transaction Date and Time is required!',
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
                    message: 'Customer is required!',
                  },
                ]}
                normalize={(v) => v.toUpperCase()}
              >
                <AutoComplete
                  options={customerOptions}
                  filterOption={(inputValue, option) =>
                    String(option?.value ?? '')
                      .toUpperCase()
                      .includes(inputValue.toUpperCase())
                  }
                />
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

              <Form.Item
                name="IsForPayment"
                label="For Payment"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="OrNo"
                label="Or No."
                dependencies={['IsForPayment']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, value) => {
                      if (
                        getFieldValue('IsForPayment') === true ||
                        !isNullOrUndefinedOrBlank(value)
                      ) {
                        return Promise.resolve();
                      }

                      return Promise.reject(new Error('Or No. is required!'));
                    },
                  }),
                ]}
              >
                <Input />
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
                dependencies={['IsForPayment']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, value) => {
                      if (
                        getFieldValue('IsForPayment') === true ||
                        !isNullOrUndefinedOrBlank(value)
                      ) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error('Amount Paid is required!'),
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
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
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isProcessing}
                  >
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
                  onSelect={(e: TPrice) => handleSelectItem(e)}
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
                  {/* {items.data.map((d: TItems) => (
                    <Select.Option
                      key={d.Id}
                      value={d.Id}
                      title={d.Description}
                    >
                      {d.Description}
                    </Select.Option>
                  ))} */}
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
                    message: 'Price is required!',
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
                    message: 'Quantity is required!',
                  },
                ]}
              >
                <InputNumber max={selectedItem?.Qty ? selectedItem?.Qty : 0} />
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
                <Button type="primary" htmlType="submit">
                  Add
                </Button>
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
          // RenderedBy="comlogik"
        />
      </Modal>
      <Modal
        open={Boolean(pendingDelete)}
        destroyOnClose
        onCancel={() => setPendingDelete(undefined)}
        footer={false}
      >
        <FinalizeForm
          handleFinalizeResult={handleConfirmDeleteSale}
          title="Confirm Pharmacy Sale Deletion"
          submitText="Delete"
        />
      </Modal>
    </>
  );
}
