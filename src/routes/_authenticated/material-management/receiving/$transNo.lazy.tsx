import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { PostData } from '../../../../helpers';
import {
  TPurchaseReceiving,
  TPurchaseReceivingDetails,
  TVendors,
} from '../../../../types';
import { App, Button, Divider, Form, Input } from 'antd';
import { useEffect, useState } from 'react';
import Table, { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import useAppStore from '../../../../store';
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

export const Route = createFileRoute(
  '/_authenticated/material-management/receiving/$transNo',
)({
  component: () => <PreviewPR />,
});

type FieldType = {
  transDate: string | dayjs.Dayjs;
  transNo: string;
  terms: string;
  department: string;
  vendor: string;
  remarks: string;
  invoiceNo: string;
  deliveryNo: string;
  approvedBy: string;
};

const decimalFormat = (num: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const PreviewPR = () => {
  const { transNo } = Route.useParams();
  const { notification } = App.useApp();
  const router = useRouter();

  const [form] = Form.useForm<FieldType>();

  const store = useAppStore();
  const [isProccessing, setIsProccessing] = useState(false);

  const rr = useQuery({
    queryKey: ['receiving', transNo],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseReceivingMain',
        parameters: {
          TransNo: transNo,
        },
      });
      if (res) {
        return res.parameters.lst[0] as TPurchaseReceiving;
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

  const rrDetails = useQuery({
    queryKey: ['purchase-order-details', transNo],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseReceivingDetails',
        parameters: {
          TransNo: transNo,
        },
      });
      if (res) {
        return res.parameters.lst as TPurchaseReceivingDetails[];
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

  useEffect(() => {
    if (rr && rr.data && vendors.data) {
      const data = rr.data;
      form.setFieldsValue({
        transDate: dayjs(data.TransDate).format('MM/DD/YYYY'),
        transNo: data.TransNo,
        terms: data.Terms,
        department: data.Description,
        vendor: vendors?.data.filter((i) => i.Id === data?.VendorId)[0]?.Name,
        remarks: data.Remarks,
        invoiceNo: data.Invoice,
        deliveryNo: data.DeliveryNo,
        approvedBy: data.ApprovedBy,
      });
    }
  }, [rr, vendors]);

  const detailsCol: ColumnsType<TPurchaseReceivingDetails> = [
    {
      title: 'Item Description',
      dataIndex: 'ItemDescription',
      key: 'ItemDescription',
      width: 300,
    },

    {
      title: 'Qty',
      dataIndex: 'Qty',
      width: 80,
      key: 'Qty',
      align: 'right',
    },
    {
      title: 'Unit Cost',
      dataIndex: 'UnitCost',
      width: 80,
      key: 'UnitCost',
      align: 'right',
      render: (value) => decimalFormat(value),
    },
    {
      title: 'Discount',
      dataIndex: 'Discount',
      width: 80,
      key: 'Discount',
      align: 'right',
      render: (value) => decimalFormat(value),
    },
    {
      title: 'Input Tax',
      align: 'right',
      render: (value) => decimalFormat(value),
      width: 120,
      dataIndex: 'InputTax',
      key: 'InputTax',
    },
    {
      title: 'Amount',
      align: 'right',
      dataIndex: 'Amount',
      key: 'Amount',
      width: 120,
      render: (value) => decimalFormat(value),
    },
    {
      title: 'Lot No.',
      dataIndex: 'LotNo',
      key: 'LotNo',
      width: 100,
    },
    {
      title: 'Expiry Date',
      dataIndex: 'ExpDate',
      key: 'ExpDate',
      width: 150,
      render: (value) => (value ? dayjs(value).format('MM/DD/YYYY') : '-'),
    },
  ];

  const handlePrint = async () => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport';
    try {
      setIsProccessing(true);
      await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'PurchaseReceiving.rdl',
          AppointmentId: transNo,
        },
      }).then((response) => {
        let newBlob;
        newBlob = new Blob([response.data], {
          type: 'application/pdf',
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement('a');

        a.setAttribute('href', data);
        a.setAttribute('target', '_blank');

        a.click();
        // setIsSubmitting(false);
      });
    } catch (error: any) {
      // setIsSubmitting(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    } finally {
      setIsProccessing(false);
    }
  };

  return (
    <div className="cardBackGround">
      <Divider>Purchase Receiving</Divider>
      <Form form={form} layout="vertical" className="flex flex-wrap gap-4">
        <Form.Item<FieldType>
          label="Trans. Date"
          name="transDate"
          className="!m-0 grow"
        >
          <Input readOnly />
        </Form.Item>
        <Form.Item<FieldType> label="Trans. No" name="transNo" className="!m-0">
          <Input readOnly className="!min-w-[200px]" />
        </Form.Item>
        <Form.Item<FieldType> label="Terms" name="terms" className="!m-0">
          <Input readOnly className="!min-w-[200px]" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Department"
          name="department"
          className="!m-0"
        >
          <Input readOnly className="!min-w-[300px]" />
        </Form.Item>
        <Form.Item<FieldType> label="Vendor" name="vendor" className="!m-0">
          {/* <Select className="!min-w-[300px]" /> */}
          <Input readOnly className="!min-w-[300px]" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Remarks"
          name="remarks"
          className="!m-0 grow"
        >
          <Input readOnly className="!min-w-[350px]" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Invoice No."
          name="invoiceNo"
          className="!m-0"
        >
          <Input readOnly className="!min-w-[150px]" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Delivery No."
          name="deliveryNo"
          className="!m-0"
        >
          <Input readOnly className="!min-w-[150px]" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Approved By"
          name="approvedBy"
          className="!m-0"
        >
          <Input readOnly className="!min-w-[200px]" />
        </Form.Item>
        <div className="flex gap-x-2 items-end justify-end">
          <Button type="primary" loading={isProccessing} onClick={handlePrint}>
            Print
          </Button>
        </div>
      </Form>
      <div className="mt-5 p-0.5 bg-blue-800 font-medium text-xs text-center text-white">
        Purchase Receiving Items
      </div>
      <Table
        dataSource={rrDetails.data}
        columns={detailsCol}
        size="small"
        scroll={{ y: 200, x: 'max-content' }}
        rowKey="Id"
        pagination={false}
      />
    </div>
  );
};
