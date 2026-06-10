import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PostData } from '../../../../../helpers';
import {
  TPurchaseOrderDetails,
  TVendors,
  TDepartments,
  TSavePurchaseReceiving,
} from '../../../../../types';
import {
  App,
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  AutoComplete,
  Select,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import Loading from '../../../../../components/loading';
import Table, { ColumnsType } from 'antd/es/table';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import useAppStore from '../../../../../store';
import { BiMinus } from 'react-icons/bi';
import { z } from 'zod';

const searchSchema = z.object({
  dept: z.number().int(),
  vendor: z.number().int(),
});

const decimalFormat = (num: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const Route = createFileRoute(
  '/_authenticated/material-management/purchase-order/receive/$transNo',
)({
  component: () => <ReceivePO />,
  validateSearch: (search) => searchSchema.parse(search),
});

type TRPO = TPurchaseOrderDetails & {
  inputTax: boolean;
  lotNo: string | null;
  expiryDate?: dayjs.Dayjs;
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

const ReceivePO = () => {
  const { transNo } = Route.useParams();
  const { notification, modal } = App.useApp();
  const router = useRouter();
  const store = useAppStore();

  const { dept, vendor } = Route.useSearch();

  const [rpo, setRpo] = useState<TRPO[]>([]);

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

  const computeInputTax = (record: TRPO) => {
    return (
      ((record.ReceivedQty * record.UnitCost - record.Discount) / 1.12) *
      0.12
    ).toFixed(2);
  };

  const computeTotal = (record: TRPO) => {
    const inputTax = record.inputTax ? Number(computeInputTax(record)) : 0;
    return (
      record.ReceivedQty * record.UnitCost -
      record.Discount +
      inputTax
    ).toFixed(2);
  };

  const poDetails = useQuery({
    queryKey: ['purchase-order-details', transNo],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseOrderDetails',
        parameters: {
          TransNo: transNo,
        },
      });
      if (res) {
        return res.parameters.lst as TPurchaseOrderDetails[];
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
        router.navigate({
          to: '/material-management/purchase-order',
        });
      }
    },
    enabled: !!transNo,
  });

  const [form] = Form.useForm<FieldType>();

  const col: ColumnsType<TRPO> = [
    {
      key: 'delete',
      width: 50,
      render: (_, record) => (
        <div className="grid place-content-center">
          <Button
            type="primary"
            size="small"
            onClick={() => {
              const n = rpo.filter((item) => item.ItemId !== record.ItemId);
              setRpo(n);
            }}
          >
            <BiMinus />
          </Button>
        </div>
      ),
    },
    {
      title: 'Item Description',
      dataIndex: 'ItemDescription',
      key: 'ItemDescription',
      width: 300,
    },
    {
      title: 'Ordered',
      dataIndex: 'RequestedQty',
      width: 80,
      key: 'RequestedQty',
      align: 'right',
    },

    {
      title: 'Received',
      dataIndex: 'ReceivedQty',
      width: 80,
      key: 'ReceivedQty',
      render: (_, record) => (
        <InputNumber
          value={record.ReceivedQty}
          inputClassName="text-sm"
          max={record.RemainingQty}
          className="h-7 "
          inputStyle={{ textAlign: 'right', width: '80px' }}
          onChange={(e) => {
            const value = e.value ?? 1;
            const clampedValue = Math.min(value, record.RemainingQty);

            setRpo((prev) =>
              prev.map((item) =>
                item.ItemId === record.ItemId
                  ? { ...item, ReceivedQty: clampedValue }
                  : item,
              ),
            );
          }}
        />
      ),
    },
    {
      title: 'Remaining',
      dataIndex: 'RemainingQty',
      width: 90,
      key: 'RemainingQty',
      align: 'right',
    },
    {
      title: 'Unit Cost',
      dataIndex: 'UnitCost',
      width: 80,
      key: 'UnitCost',
      render: (_, record) => (
        <InputNumber
          inputClassName="text-sm"
          value={record.UnitCost}
          mode="decimal"
          maxFractionDigits={2}
          minFractionDigits={2}
          className="h-7 "
          inputStyle={{ textAlign: 'right', width: '80px' }}
          onChange={(e) => {
            setRpo((prev) =>
              prev.map((item) =>
                item.ItemId === record.ItemId
                  ? { ...item, UnitCost: e.value || 1 }
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
          value={record.Discount}
          mode="decimal"
          maxFractionDigits={2}
          minFractionDigits={2}
          className="h-7 "
          inputStyle={{ textAlign: 'right', width: '80px' }}
          onChange={(e) => {
            setRpo((prev) =>
              prev.map((item) =>
                item.ItemId === record.ItemId
                  ? { ...item, Discount: e.value || 1 }
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
              setRpo((prev) =>
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
      render: (_, record) => computeTotal(record),
      width: 120,
      dataIndex: 'Amount',
      key: 'Amount',
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
            setRpo((prev) =>
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
          value={value}
          format={'MM/DD/YYYY'}
          onChange={(date) => {
            setRpo((prev) =>
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
  ];

  useEffect(() => {
    if (poDetails && poDetails.data !== undefined) {
      setRpo(
        poDetails.data.map((item) => ({
          ...item,
          inputTax: false,
          lotNo: '',
          expiryDate: undefined,
          ReceivedQty: 1,
          RemainingQty:
            item.RemainingQty === 0 ? item.RequestedQty : item.RemainingQty,
        })),
      );
    }
  }, [poDetails.data]);

  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (values: FieldType) => {
    try {
      setIsSaving(true);
      const hasMissingLotNo = rpo.some(
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

      // Validate Unit Cost
      const hasInvalidCost = rpo.some(
        (d) =>
          d.UnitCost === null ||
          d.UnitCost === undefined ||
          Number(d.UnitCost) <= 0,
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
        PurchaseOrderNo: transNo,
        BranchCode: store.branchCode,
        Details: rpo.map((i) => ({
          Id: 0,
          ItemId: i.ItemId,
          RequestedQty: i.ReceivedQty,
          UnitCost: i.UnitCost,
          Discount: i.Discount,
          InputTax: i.inputTax ? Number(computeInputTax(i)) : 0,
          Amount: Number(computeTotal(i)),
          LotNo: i.lotNo!,
          ExpiryDate: i.expiryDate
            ? dayjs(i.expiryDate).format('YYYY-MM-DDTHH:mm:ss')
            : undefined,
          Consignment: false,
          PurchaseOrderDetailsId: i.Id,
          DepartmentId: values.department,
          PONo: transNo,
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
          to: '/material-management/purchase-order',
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

  return poDetails.isLoading ? (
    <Loading size={64} />
  ) : (
    <div className="cardBackGround">
      <Divider>Receive Purchase Orders</Divider>
      <Form
        form={form}
        layout="vertical"
        className="flex flex-wrap gap-4"
        onFinish={handleSubmit}
        initialValues={{
          department: dept,
          vendor: vendor,
        }}
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
            // disabled={selectedPoItems.length < 1}
            htmlType="submit"
            loading={isSaving}
          >
            Save
          </Button>
          <Button type="primary">Print</Button>
        </div>
      </Form>

      <div className="mt-5 p-0.5 bg-blue-800 font-medium text-xs text-center text-white">
        Purchase Order Items
      </div>

      <Table
        dataSource={rpo}
        columns={col}
        size="small"
        scroll={{ y: 200, x: 'max-content' }}
        rowKey="Id"
        pagination={false}
      />
    </div>
  );
};
