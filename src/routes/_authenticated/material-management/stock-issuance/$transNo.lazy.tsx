import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { App, Button, Divider, Form, Input } from 'antd';
import dayjs from 'dayjs';
import { PostData } from '../../../../helpers';
import { TStockIssuance, TStockIssuanceDetails } from '../../../../types';
import Table, { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import axios from 'axios';
import useAppStore from '../../../../store';

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

export const Route = createFileRoute(
  '/_authenticated/material-management/stock-issuance/$transNo',
)({
  component: () => <PreviewSI />,
});

type FieldType = {
  transDate: string | dayjs.Dayjs;
  transNo: string;
  requestingDepartment: string;
  issuingDepartment: string;
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

const PreviewSI = () => {
  const [form] = Form.useForm<FieldType>();
  const { transNo } = Route.useParams();
  const { notification } = App.useApp();
  const router = useRouter();
  const store = useAppStore();
  const [isProccessing, setIsProccessing] = useState(false);

  const si = useQuery({
    queryKey: ['stock_issuance', transNo],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetStockIssuanceMain',
        parameters: {
          TransNo: transNo,
        },
      });
      if (res) {
        return res.parameters.lst[0] as TStockIssuance;
      }
    },
  });

  const siDetails = useQuery({
    queryKey: ['stock_issuance_details', transNo],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetStockIssuanceDetails',
        parameters: {
          TransNo: transNo,
        },
      });
      if (res) {
        return res.parameters.lst as TStockIssuanceDetails[];
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

  const col: ColumnsType<TStockIssuanceDetails> = [
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
      title: 'Amount',
      align: 'right',
      width: 120,
      render: (_, record) => decimalFormat(record.Qty * record.UnitCost),
    },
  ];

  useEffect(() => {
    if (si.data) {
      const data = si.data;
      form.setFieldsValue({
        transDate: dayjs(data.TransDate).format('MM/DD/YYYY'),
        transNo: data.TransNo,
        requestingDepartment: data.RequestingDepartmentName,
        issuingDepartment: data.IssuingDepartmentName,
        remarks: data.Remarks,
        checkedBy: data.CheckedBy,
        approvedBy: data.ApprovedBy,
      });
    }
  }, [si.data]);

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
          ReportName: 'StockIssuance.rdl',
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
      <Divider>Preview Stock Issuance</Divider>
      <Form form={form} layout="vertical" className="flex flex-wrap gap-4">
        <Form.Item<FieldType>
          label="Trans. Date"
          name="transDate"
          className="!m-0 grow"
        >
          <Input className="!min-w-[200px] " readOnly />
        </Form.Item>
        <Form.Item<FieldType> label="Trans. No" name="transNo" className="!m-0">
          <Input className="!min-w-[300px]" readOnly />
        </Form.Item>

        <Form.Item<FieldType>
          label="Requesting Department"
          name="requestingDepartment"
          className="!m-0"
        >
          <Input className="!min-w-[300px]" readOnly />
        </Form.Item>
        <Form.Item<FieldType>
          label="Issuing Department"
          name="issuingDepartment"
          className="!m-0"
        >
          <Input className="!min-w-[300px]" readOnly />
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
          className="!m-0"
        >
          <Input className="!min-w-[200px]" readOnly />
        </Form.Item>
        <Form.Item<FieldType>
          label="Approved By"
          name="approvedBy"
          className="!m-0"
        >
          <Input className="!min-w-[200px]" readOnly />
        </Form.Item>

        <div className="flex gap-x-2 items-end justify-end">
          <Button type="primary" loading={isProccessing} onClick={handlePrint}>
            Print
          </Button>
        </div>
      </Form>
      <div className="mt-5 p-0.5 bg-blue-800 font-medium text-xs text-center text-white">
        Stock Issuance Items
      </div>
      <Table
        dataSource={siDetails.data}
        columns={col}
        size="small"
        scroll={{ y: 200, x: 'max-content' }}
        rowKey="Id"
        pagination={false}
      />
    </div>
  );
};
