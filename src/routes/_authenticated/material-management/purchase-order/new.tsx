import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  App,
  AutoComplete,
  Button,
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
  TSavePurchaseOrder,
  TVendors,
} from '../../../../types';
import Table, { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { BiMinus, BiPlus, BiSearch } from 'react-icons/bi';
import useAppStore from '../../../../store';

const decimalFormat = (num: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const Route = createFileRoute(
  '/_authenticated/material-management/purchase-order/new',
)({
  component: () => <NewPo />,
});

type FieldType = {
  transDate: string | dayjs.Dayjs;
  transNo: string;
  terms: string;
  department: number;
  vendor: number;
  remarks: string;
  checkedBy: string;
  approvedBy: string;
};

type PoItemType = TDepartmentItems & {
  reqQty: number;
  discount?: number;
};

const NewPo = () => {
  const [form] = Form.useForm<FieldType>();
  const [poItems, setPoItems] = useState<PoItemType[]>([]);
  const [selectedPoItems, setSelectedPoItems] = useState<PoItemType[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [poitemSearch, setPoItemSearch] = useState('');
  const { notification, modal } = App.useApp();
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

  const checkedBy = useQuery({
    queryKey: ['po_checked_by'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseOrderCombo',
        parameters: {
          Code: 'CHK',
        },
      });
      if (res) {
        return res.parameters.lst as [{ CheckedBy: string }];
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
      }));

      setPoItems(items);
      setSelectedPoItems([]);

      return;
    }
    setPoItems([]);
  }, [departmentItems.data]);

  const allSelecteItemIds = selectedPoItems.map((i) => i.ItemId);

  const itemsCol: ColumnsType<PoItemType> = [
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
              setPoItems((prev) =>
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
      width: 50,
      render: (_, record) => (
        <div className="grid place-content-center">
          <Button
            type="primary"
            size="small"
            disabled={allSelecteItemIds.includes(record.ItemId)}
            onClick={() => setSelectedPoItems((prev) => [...prev, record])}
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

  const selectedPoItemCol: ColumnsType<PoItemType> = [
    {
      title: 'Item Description',
      dataIndex: 'Description',
      key: 'Description',
      width: 'full',
      filterIcon: (
        <BiSearch
          style={{ color: poitemSearch.length > 0 ? '#1677ff' : undefined }}
        />
      ),
      filterDropdown: () => (
        <div className="p-1 grid gap-y-1">
          <Input
            size="small"
            value={poitemSearch}
            placeholder="Search Item Description"
            onChange={(e) => setPoItemSearch(e.target.value)}
          />
          <div className="grid justify-end">
            <Button
              type="primary"
              onClick={() => setPoItemSearch('')}
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
            setSelectedPoItems((prev) =>
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
      title: 'Cost',
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
            setSelectedPoItems((prev) =>
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
            setSelectedPoItems((prev) =>
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
      title: 'Amount',
      align: 'right',
      width: 120,
      render: (_, record) => {
        return decimalFormat(
          record.reqQty * (record.Cost ?? 0) - (record.discount ?? 0),
        );
      },
    },
    {
      key: 'delete',
      width: 50,
      render: (_, record) => (
        <div className="grid place-content-center">
          <Button
            type="primary"
            size="small"
            onClick={() => {
              const n = selectedPoItems.filter(
                (item) => item.ItemId !== record.ItemId,
              );
              setSelectedPoItems(n);
            }}
          >
            <BiMinus />
          </Button>
        </div>
      ),
    },
  ];

  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (values: FieldType) => {
    try {
      // Validate Requested Quantity
      const hasInvalidReqQty = selectedPoItems.some(
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
      const hasInvalidCost = selectedPoItems.some(
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
      setIsSaving(true);
      const payload: TSavePurchaseOrder = {
        TransNo: values.transNo,
        TransDate: dayjs(values.transDate).format('YYYY-MM-DDTHH:mm:ss'),
        RequestingDepartmentId: values.department,
        VendorId: values.vendor,
        CheckedBy: values.checkedBy,
        ApprovedBy: values.approvedBy,
        Remarks: values.remarks,
        Terms: values.terms,
        BranchCode: store.branchCode,
        Details: selectedPoItems.map((i) => ({
          Id: 0,
          ItemId: i.ItemId,
          RequestedQty: i.reqQty,
          UnitCost: i.Cost,
          Discount: i.discount ?? 0,
          Amount: i.reqQty * (i.Cost ?? 0) - (i.discount ?? 0),
          PurchaseRequestNo: '',
          IssuingDepartment: values.department.toString(),
          RequestingDepartment: values.department.toString(),
          RequestedBy: '',
          PurchaseRequestDetailsId: 0,
        })),
      };
      const res = await PostData('SavePurchaseOrder', payload);
      if (res.status === 1) {
        notification.success({
          message: 'New Purchase Order(s) Successfully Save!',
          placement: 'topRight',
          duration: 3,
        });
        queryClient.invalidateQueries({
          queryKey: ['purchase-order'],
        });
        router.navigate({
          to: '/material-management/purchase-order/$transNo',
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
      <Divider>New Purchase Orders</Divider>
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
          label="Checked By"
          name="checkedBy"
          rules={[{ required: true, message: 'Please Select Checked By' }]}
          className="!m-0"
        >
          <AutoComplete
            className="!min-w-[300px]"
            options={checkedBy.data?.map((v) => ({
              value: v.CheckedBy,
              label: v.CheckedBy,
            }))}
          />
        </Form.Item>
        <Form.Item<FieldType>
          label="Approved By"
          name="approvedBy"
          rules={[{ required: true, message: 'Please Select Approved By' }]}
          className="!m-0"
        >
          <AutoComplete
            className="!min-w-[300px]"
            options={approvedBy.data?.map((v) => ({
              value: v.ApprovedBy,
              label: v.ApprovedBy,
            }))}
          />
        </Form.Item>

        <div className="flex gap-x-2 items-end justify-end">
          <Button
            type="primary"
            disabled={selectedPoItems.length < 1}
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
            dataSource={poItems.filter((item) =>
              item.Description?.toLocaleLowerCase()?.includes(
                itemSearch.toLocaleLowerCase(),
              ),
            )}
            pagination={false}
          />
        </div>
        <div className="lg:col-span-3">
          <div className="p-0.5 bg-blue-800 font-medium text-xs text-center text-white">
            Purchase Order Items
          </div>
          <Table
            size="small"
            rowKey="ItemId"
            columns={selectedPoItemCol}
            dataSource={selectedPoItems.filter((item) =>
              item.Description?.toLocaleLowerCase().includes(
                poitemSearch.toLocaleLowerCase(),
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
                        return (
                          sum +
                          (item.reqQty * (item.Cost ?? 0) -
                            (item.discount ?? 0))
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
