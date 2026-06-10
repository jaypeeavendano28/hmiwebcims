import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PostData } from '../../../../helpers';
import {
  TPurchaseOrder,
  TPurchaseOrderDetails,
  TVendors,
} from '../../../../types';
import { App, Button, Divider, Form, Input } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import Loading from '../../../../components/loading';
import Table, { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import useAppStore from '../../../../store';

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

export const Route = createFileRoute(
  '/_authenticated/material-management/purchase-order/$transNo',
)({
  component: () => <PreviewPo />,
});

type FieldType = {
  transDate: string | dayjs.Dayjs;
  transNo: string;
  terms: string;
  department: string;
  vendor: string;
  remarks: string;
  checkedBy: string;
  approvedBy: string;
};

const decimalFormat = (num: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const PreviewPo = () => {
  const { transNo } = Route.useParams();
  const { notification } = App.useApp();
  const router = useRouter();
  const store = useAppStore();
  const [isProccessing, setIsProccessing] = useState(false);

  const po = useQuery({
    queryKey: ['purchase-order', transNo],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseOrderMain',
        parameters: {
          TransNo: transNo,
        },
      });
      if (res) {
        return res.parameters.lst[0] as TPurchaseOrder;
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

  const [form] = Form.useForm<FieldType>();

  // const [selectedPoItems, setSelectedPoItems] = useState<PoItemType[]>([]);
  const col: ColumnsType<TPurchaseOrderDetails> = [
    {
      title: 'Item Description',
      dataIndex: 'ItemDescription',
      key: 'ItemDescription',
      width: 'full',
    },
    {
      title: 'Qty',
      dataIndex: 'RequestedQty',
      width: 80,
      key: 'RequestedQty',
      align: 'right',
    },
    {
      title: 'Cost',
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
      title: 'Amount',
      align: 'right',
      render: (value) => decimalFormat(value),
      width: 120,
      dataIndex: 'Amount',
      key: 'Amount',
    },
  ];

  useEffect(() => {
    if (po && vendors.data) {
      const data = po.data;
      form.setFieldsValue({
        transDate: dayjs(data?.TransDate).format('MM/DD/YYYY h:mm A'),
        transNo: data?.TransNo,
        terms: data?.Terms,
        vendor: vendors?.data.filter((i) => i.Id === data?.VendorId)[0]?.Name,
        remarks: data?.Remarks,
        checkedBy: data?.CheckedBy,
        approvedBy: data?.ApprovedBy,
        department: data?.Description,
      });
    }
  }, [po, vendors.data]);

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
          ReportName: 'PurchaseOrder.rdl',
          AppointmentId: transNo,
          BranchCode: store.branchCode,
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

  return po.isLoading ? (
    <Loading size={64} />
  ) : (
    <div className="cardBackGround">
      <Divider>Preview Purchase Orders</Divider>
      <Form
        form={form}
        layout="vertical"
        className="flex flex-wrap gap-4"
        // onFinish={handleSubmit}
      >
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
          <Input readOnly />
        </Form.Item>

        <Form.Item<FieldType>
          label="Department"
          name="department"
          className="!m-0"
        >
          <Input readOnly />
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
          label="Checked By"
          name="checkedBy"
          className="!m-0"
        >
          <Input readOnly />
        </Form.Item>
        <Form.Item<FieldType>
          label="Approved By"
          name="approvedBy"
          className="!m-0"
        >
          <Input readOnly />
        </Form.Item>

        <div className="flex gap-x-2 items-end justify-end">
          {/* <Button
            type="primary"
            disabled={selectedPoItems.length < 1}
            htmlType="submit"
            loading={isSaving}
          >
            Save
          </Button> */}
          <Button type="primary" loading={isProccessing} onClick={handlePrint}>
            Print
          </Button>
        </div>
      </Form>

      <div className="mt-5 p-0.5 bg-blue-800 font-medium text-xs text-center text-white">
        Purchase Order Items
      </div>

      <Table
        dataSource={poDetails.data}
        columns={col}
        size="small"
        scroll={{ y: 200, x: 'max-content' }}
        rowKey="Id"
        pagination={false}
      />
    </div>
  );
};
