import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  App,
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  Select,
} from 'antd';
import dayjs from 'dayjs';
import { PostData } from '../../../../helpers';
import {
  TDepartmentItems,
  TDepartments,
  TSavePurchaseReceiving,
  TVendors,
} from '../../../../types';
import { useEffect, useState } from 'react';
import Table, { ColumnsType } from 'antd/es/table';
import { BiMinus, BiPlus, BiSearch } from 'react-icons/bi';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import useAppStore from '../../../../store';

export const Route = createFileRoute(
  '/_authenticated/material-management/receiving/new',
)({
  component: () => <NewReceiving />,
});

const decimalFormat = (num: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

type FieldType = {
  transDate: string | dayjs.Dayjs;
  transNo: string;
  terms: string;
  department: number;
  vendor: number;
  remarks: string;
  invoiceNo: string;
  deliveryNo: string;
  approvedBy: string;
};

type PrItemType = TDepartmentItems & {
  reqQty: number;
  discount?: number;
  inputTax: boolean;
  lotNo: string | undefined;
  expiryDate?: dayjs.Dayjs;
};

const NewReceiving = () => {
  const [form] = Form.useForm<FieldType>();
  const [items, setItems] = useState<PrItemType[]>([]);
  const [selectePrItems, setSelectedPrItems] = useState<PrItemType[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [pritemSearch, setPrItemSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { modal, notification } = App.useApp();
  const store = useAppStore();
  const router = useRouter();

  const vendors = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetVendors',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst as TVendors[];
      }
    },
  });

  const approvedBy = useQuery({
    queryKey: ['po_approved_by'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseOrderCombo',
        parameters: {
          Code: 'APP',
        },
      });
      if (res) {
        return res.parameters.lst as [{ ApprovedBy: string }];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const terms = useQuery({
    queryKey: ['po_terms'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseOrderCombo',
        parameters: {
          Code: 'TERMS',
        },
      });
      if (res) {
        return res.parameters.lst as [{ Terms: string }];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDepartments',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst as TDepartments[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const selectedDepartment = Form.useWatch('department', form) ?? undefined;

  const computeInputTax = (record: PrItemType) => {
    return (
      ((record.reqQty * record.Cost - (record.discount ?? 0)) / 1.12) *
      0.12
    ).toFixed(2);
  };

  const computeTotal = (record: PrItemType) => {
    const inputTax = record.inputTax ? Number(computeInputTax(record)) : 0;
    return (
      record.reqQty * record.Cost -
      (record.discount ?? 0) +
      inputTax
    ).toFixed(2);
  };

  const departmentItems = useQuery({
    queryKey: ['departments_items', selectedDepartment],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDepartmentItems',
        parameters: {
          DepartmentId: selectedDepartment,
        },
      });
      if (res) {
        return res.parameters.lst as TDepartmentItems[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: !!selectedDepartment,
  });

  useEffect(() => {
    if (departmentItems.data) {
      const items = departmentItems.data.map((i) => ({
        ...i,
        reqQty: 1,
        inputTax: false,
        lotNo: undefined,
      }));

      setItems(items);
      setSelectedPrItems([]);

      return;
    }
    setSelectedPrItems([]);
  }, [departmentItems.data]);

  const allSelecteItemIds = selectePrItems.map((i) => i.ItemId);
  const filteredSearchItems = items.filter((item) =>
    item.Description?.toLocaleLowerCase()?.includes(
      itemSearch.toLocaleLowerCase(),
    ),
  );
  // const unselectedSearchItems = filteredSearchItems.filter(
  //   (item) => !allSelecteItemIds.includes(item.ItemId),
  // );

  // const handleSelectAllSearchItems = () => {
  //   setSelectedPrItems((prev) => {
  //     const selectedItemIds = prev.map((item) => item.ItemId);
  //     const itemsToAdd = filteredSearchItems.filter(
  //       (item) => !selectedItemIds.includes(item.ItemId),
  //     );

  //     if (itemsToAdd.length < 1) {
  //       return prev;
  //     }

  //     return [...prev, ...itemsToAdd];
  //   });
  // };

  const itemsCol: ColumnsType<PrItemType> = [
    {
      title: 'Item Description',
      dataIndex: 'Description',
      key: 'Description',
      width: 'full',
      filterIcon: (
        <BiSearch
          style={{ color: itemSearch.length > 0 ? '#1677ff' : undefined }}
        />
      ),
      filterDropdown: () => (
        <div className="p-1 grid gap-y-1">
          <Input
            size="small"
            value={itemSearch}
            placeholder="Search Item Description"
            onChange={(e) => setItemSearch(e.target.value)}
          />
          <div className="grid justify-end">
            <Button
              type="primary"
              onClick={() => setItemSearch('')}
              size="small"
              style={{ width: 50 }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Req. Qty',
      dataIndex: 'reqQty',
      width: 80,
      fixed: 'right',
      key: 'reqQty',
      align: 'right',
      render: (value, record) =>
        allSelecteItemIds.includes(record.ItemId) ? (
          value
        ) : (
          <InputNumber
            inputClassName="text-sm"
            value={record.reqQty}
            className="h-7 "
            inputStyle={{ textAlign: 'right', width: '80px' }}
            disabled={allSelecteItemIds.includes(record.ItemId)}
            onChange={(e) => {
              setItems((prev) =>
                prev.map((item) =>
                  item.ItemId === record.ItemId
                    ? { ...item, reqQty: e.value || 1 }
                    : item,
                ),
              );
            }}
          />
        ),
    },
    {
      key: 'add',
      fixed: 'right',
      width: 50,
      render: (_, record) => (
        <div className="grid place-content-center">
          <Button
            type="primary"
            size="small"
            disabled={allSelecteItemIds.includes(record.ItemId)}
            onClick={() => setSelectedPrItems((prev) => [...prev, record])}
          >
            <BiPlus />
          </Button>
        </div>
      ),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'Cost',
      key: 'Cost',
      width: 100,
      align: 'right',
      render: (val) => decimalFormat(val),

      sorter: (a, b) => a.Cost! - b.Cost!,
    },
  ];

  const selectedPrItemCol: ColumnsType<PrItemType> = [
    {
      title: 'Item Description',
      dataIndex: 'Description',
      key: 'Description',
      width: 300,
      filterIcon: (
        <BiSearch
          style={{ color: pritemSearch.length > 0 ? '#1677ff' : undefined }}
        />
      ),
      filterDropdown: () => (
        <div className="p-1 grid gap-y-1">
          <Input
            size="small"
            value={pritemSearch}
            placeholder="Search Item Description"
            onChange={(e) => setPrItemSearch(e.target.value)}
          />
          <div className="grid justify-end">
            <Button
              type="primary"
              onClick={() => setPrItemSearch('')}
              size="small"
              style={{ width: 50 }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
    },

    {
      title: 'Qty',
      dataIndex: 'reqQty',
      width: 80,
      key: 'reqQty',
      align: 'right',
      render: (_, record) => (
        <InputNumber
          inputClassName="text-sm"
          value={record.reqQty}
          className="h-7 "
          inputStyle={{ textAlign: 'right', width: '80px' }}
          onChange={(e) => {
            setSelectedPrItems((prev) =>
              prev.map((item) =>
                item.ItemId === record.ItemId
                  ? { ...item, reqQty: e.value || 1 }
                  : item,
              ),
            );
          }}
        />
      ),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'Cost',
      width: 80,
      key: 'Cost',
      align: 'right',
      render: (_, record) => (
        <InputNumber
          inputClassName="text-sm"
          value={record.Cost}
          className="h-7"
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          inputStyle={{ textAlign: 'right', width: '80px' }}
          onChange={(e) => {
            setSelectedPrItems((prev) =>
              prev.map((item) =>
                item.ItemId === record.ItemId
                  ? { ...item, Cost: e.value || 0 }
                  : item,
              ),
            );
          }}
        />
      ),
    },
    {
      title: 'Discount',
      dataIndex: 'Discount',
      width: 80,
      key: 'Discount',
      align: 'right',
      render: (_, record) => (
        <InputNumber
          inputClassName="text-sm"
          value={record.discount ?? 0}
          className="h-7 "
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          inputStyle={{ textAlign: 'right', width: '80px' }}
          onChange={(e) => {
            setSelectedPrItems((prev) =>
              prev.map((item) =>
                item.ItemId === record.ItemId
                  ? { ...item, discount: e.value || 0 }
                  : item,
              ),
            );
          }}
        />
      ),
    },
    {
      title: 'Input Tax',
      align: 'right',
      render: (value, record) => (
        <div className="flex justify-end gap-x-2">
          <div>{value ? computeInputTax(record) : decimalFormat(0)}</div>
          <Checkbox
            value={value}
            onChange={(e) => {
              setSelectedPrItems((prev) =>
                prev.map((item) =>
                  item.ItemId === record.ItemId
                    ? { ...item, inputTax: e.target.checked }
                    : item,
                ),
              );
            }}
          />
        </div>
      ),
      width: 120,
      dataIndex: 'inputTax',
      key: 'inputTax',
    },
    {
      title: 'Amount',
      align: 'right',
      width: 120,
      render: (_, record) => {
        return computeTotal(record);
      },
    },
    {
      title: 'Lot No.',
      dataIndex: 'lotNo',
      key: 'lotNo',
      width: 100,
      render: (value, record) => (
        <InputText
          value={value}
          className="!w-[100px] h-7"
          onChange={(e) => {
            setSelectedPrItems((prev) =>
              prev.map((item) =>
                item.ItemId === record.ItemId
                  ? { ...item, lotNo: e.target.value }
                  : item,
              ),
            );
          }}
        />
      ),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 150,
      render: (value, record) => (
        <DatePicker
          disabledDate={(current) =>
            current && current < dayjs().startOf('day')
          }
          value={value}
          format={'MM/DD/YYYY'}
          onChange={(date) => {
            setSelectedPrItems((prev) =>
              prev.map((item) =>
                item.ItemId === record.ItemId
                  ? { ...item, expiryDate: date }
                  : item,
              ),
            );
          }}
        />
      ),
    },
    {
      key: 'delete',
      width: 50,
      fixed: 'right',
      render: (_, record) => (
        <div className="grid place-content-center">
          <Button
            type="primary"
            size="small"
            onClick={() => {
              const n = selectePrItems.filter(
                (item) => item.ItemId !== record.ItemId,
              );
              setSelectedPrItems(n);
            }}
          >
            <BiMinus />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (values: FieldType) => {
    try {
      setIsSaving(true);
      const hasMissingLotNo = selectePrItems.some(
        (d) =>
          d.lotNo === null || d.lotNo === undefined || d.lotNo.trim() === '',
      );
      if (hasMissingLotNo) {
        modal.error({
          title: 'Receiving Purchase Order',
          content: 'Please specify Lot No. for each item to receive!',
          centered: true,
        });

        return;
      }

      // Validate Requested Quantity
      const hasInvalidReqQty = selectePrItems.some(
        (d) =>
          d.reqQty === null || d.reqQty === undefined || Number(d.reqQty) <= 0,
      );

      if (hasInvalidReqQty) {
        modal.error({
          title: 'Receiving Purchase Order',
          content:
            'Requested Quantity must be greater than zero for all items!',
          centered: true,
        });

        return;
      }

      // Validate Unit Cost
      const hasInvalidCost = selectePrItems.some(
        (d) => d.Cost === null || d.Cost === undefined || Number(d.Cost) <= 0,
      );

      if (hasInvalidCost) {
        modal.error({
          title: 'Receiving Purchase Order',
          content: 'Unit Cost must be greater than zero for all items!',
          centered: true,
        });

        return;
      }

      const payload: TSavePurchaseReceiving = {
        TransNo: '',
        TransDate: dayjs(values.transDate).format('YYYY-MM-DDTHH:mm:ss'),
        IssuingDepartmentId: 0,
        RequestingDepartmentId: values.department,
        VendorId: values.vendor,
        CheckedBy: '',
        ApprovedBy: values.approvedBy,
        Remarks: values.remarks,
        Terms: values.terms,
        InvoiceNo: values.invoiceNo,
        DeliveryNo: values.deliveryNo,
        PurchaseOrderNo: '',
        BranchCode: store.branchCode,
        Details: selectePrItems.map((i) => ({
          Id: 0,
          ItemId: i.ItemId,
          RequestedQty: i.reqQty,
          UnitCost: i.Cost,
          Discount: i.discount ?? 0,
          InputTax: i.inputTax ? Number(computeInputTax(i)) : 0,
          Amount: Number(computeTotal(i)),
          LotNo: i.lotNo!,
          ExpiryDate: i.expiryDate
            ? dayjs(i.expiryDate).format('YYYY-MM-DDTHH:mm:ss')
            : undefined,
          Consignment: false,
          PurchaseOrderDetailsId: 0,
          DepartmentId: values.department,
          PONo: '',
        })),
      };

      const res = await PostData('SavePurchaseReceiving', payload);
      if (res.status === 1) {
        notification.success({
          message: 'Purchase Order Successfully Received!',
          placement: 'topRight',
          duration: 3,
        });
        queryClient.invalidateQueries({
          queryKey: ['purchase-order'],
        });
        router.navigate({
          to: '/material-management/receiving/$transNo',
          params: {
            transNo: res.parameters,
          },
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (err) {
      console.log(err);
      notification.error({
        message: 'Something went wrong please try again later',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cardBackGround">
      <Divider>Purchase Receiving</Divider>
      <Form
        form={form}
        layout="vertical"
        className="flex flex-wrap gap-4"
        onFinish={handleSubmit}
      >
        <Form.Item<FieldType>
          label="Trans. Date"
          name="transDate"
          initialValue={dayjs()}
          rules={[{ required: true, message: 'Please Select Trans. Date' }]}
          className="!m-0 grow"
        >
          <DatePicker
            showTime
            format={'MM/DD/YYYY h:mm A'}
            className="!min-w-[200px] "
          />
        </Form.Item>
        <Form.Item<FieldType> label="Trans. No" name="transNo" className="!m-0">
          <Input className="!min-w-[200px]" readOnly />
        </Form.Item>
        <Form.Item<FieldType> label="Terms" name="terms" className="!m-0">
          <AutoComplete
            className="!min-w-[200px]"
            options={terms.data?.map((v) => ({
              value: v.Terms,
              label: v.Terms,
            }))}
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Department"
          name="department"
          rules={[{ required: true, message: 'Please Select Department' }]}
          className="!m-0"
        >
          <Select
            showSearch
            className="!min-w-[300px]"
            optionFilterProp="label"
            options={departments.data?.map((d) => ({
              value: d.Id,
              label: d.Description,
            }))}
          />
        </Form.Item>
        <Form.Item<FieldType>
          label="Vendor"
          name="vendor"
          rules={[{ required: true, message: 'Please Select Vendor' }]}
          className="!m-0"
        >
          {/* <Select className="!min-w-[300px]" /> */}
          <Select
            showSearch
            className="!min-w-[300px]"
            optionFilterProp="label"
            options={vendors.data?.map((d) => ({
              value: d.Id,
              label: d.Name,
            }))}
          />
        </Form.Item>
        <Form.Item<FieldType>
          label="Remarks"
          name="remarks"
          className="!m-0 grow"
        >
          <Input className="!min-w-[350px]" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Invoice No."
          name="invoiceNo"
          className="!m-0"
        >
          <Input className="!min-w-[150px]" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Delivery No."
          name="deliveryNo"
          className="!m-0"
        >
          <Input className="!min-w-[150px]" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Approved By"
          name="approvedBy"
          rules={[{ required: true, message: 'Please Select Approved By' }]}
          className="!m-0"
        >
          <AutoComplete
            className="!min-w-[200px]"
            options={approvedBy.data?.map((v) => ({
              value: v.ApprovedBy,
              label: v.ApprovedBy,
            }))}
          />
        </Form.Item>

        <div className="flex gap-x-2 items-end justify-end">
          <Button
            type="primary"
            disabled={selectePrItems.length < 1}
            htmlType="submit"
            loading={isSaving}
          >
            Save
          </Button>
          <Button type="primary">Print</Button>
        </div>
      </Form>
      <div className="my-5 space-y-5 lg:space-y-0 lg:grid items-start gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="p-0.5 bg-blue-800 font-medium text-xs text-center text-white">
            Search Items
          </div>
          <Table
            size="small"
            scroll={{ y: 200, x: 'max-content' }}
            rowKey="ItemId"
            columns={itemsCol}
            dataSource={filteredSearchItems}
            pagination={false}
          />
        </div>
        <div className="lg:col-span-3">
          <div className="p-0.5 bg-blue-800 font-medium text-xs text-center text-white">
            Purchase Receiving Items
          </div>
          <Table
            size="small"
            rowKey="ItemId"
            columns={selectedPrItemCol}
            dataSource={selectePrItems.filter((item) =>
              item.Description?.toLocaleLowerCase().includes(
                pritemSearch.toLocaleLowerCase(),
              ),
            )}
            pagination={false}
            scroll={{ y: 200, x: 'max-content' }}
            footer={(po) => (
              <div className="font-bold uppercase flex justify-end gap-x-5">
                <div>
                  <span className="text-slate-400">Total Discount </span>
                  <span>
                    {' '}
                    {decimalFormat(
                      po.reduce((sum, item) => {
                        return sum + (item.discount ?? 0);
                      }, 0),
                    )}
                  </span>
                </div>
                <div className="h-[20px] w-[1px] bg-slate-200" />
                <div>
                  <span className="text-slate-400">Total Amount </span>{' '}
                  <span>
                    {decimalFormat(
                      po.reduce((sum, item) => {
                        const inputTax = item.inputTax
                          ? Number(computeInputTax(item))
                          : 0;
                        return (
                          sum +
                          (item.reqQty * (item.Cost ?? 0) -
                            (item.discount ?? 0)) +
                          inputTax
                        );
                      }, 0),
                    )}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};
