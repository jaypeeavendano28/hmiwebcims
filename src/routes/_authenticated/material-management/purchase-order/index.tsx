import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, DatePicker, Divider, Form, Space, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PostData } from '../../../../helpers';
import { TPurchaseOrder } from '../../../../types';
import { DataTable } from 'primereact/datatable';
import Loading from '../../../../components/loading';
import { Column } from 'primereact/column';
import { RiFolderReceivedLine } from 'react-icons/ri';
import { FaRegEye } from 'react-icons/fa';
import DisapprovePo from '../../../../components/disapprove-po';
import CancelPo from '../../../../components/cancel-po';

export const Route = createFileRoute(
  '/_authenticated/material-management/purchase-order/',
)({
  component: () => <PurchaseOrder />,
});

const PurchaseOrder = () => {
  const [date, setDate] = useState<dayjs.Dayjs[]>([dayjs(), dayjs()]);

  const pos = useQuery({
    queryKey: ['purchase-order', date],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseOrderMain',
        parameters: {
          DateFrom: date[0].format('MM/DD/YYYY'),
          DateTo: date[1].format('MM/DD/YYYY'),
        },
      });
      if (res) {
        return res.parameters.lst as TPurchaseOrder[];
      }
    },
  });

  const actionBodyTemplate = (data: TPurchaseOrder) => {
    return (
      <Space>
        <Tooltip title="Preview Purchase Order">
          <Link
            to="/material-management/purchase-order/$transNo"
            params={{
              transNo: data.TransNo,
            }}
          >
            <Button size="small" type="primary">
              <FaRegEye size={14} />
            </Button>
          </Link>
        </Tooltip>

        <DisapprovePo data={data} />
        <CancelPo data={data} />
        <Tooltip title="Receive P.O.">
          <Link
            to="/material-management/purchase-order/receive/$transNo"
            params={{
              transNo: data.TransNo,
            }}
            search={{
              dept: data.DepartmentId,
              vendor: data.VendorId,
            }}
          >
            <Button
              size="small"
              type="primary"
              disabled={data.Status !== 'PENDING'}
            >
              <RiFolderReceivedLine size={14} />
            </Button>
          </Link>
        </Tooltip>
      </Space>
    );
  };

  return (
    <div className="cardBackGround">
      <Divider>Purchase Orders</Divider>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-5">
          <Form.Item label="Transaction Date" className="!m-0">
            <DatePicker.RangePicker
              value={[date[0], date[1]]}
              format={'MM/DD/YYYY'}
              onChange={(dates) => {
                if (dates[0] && dates[1]) {
                  setDate([dates[0], dates[1]]);
                }
              }}
            />
          </Form.Item>
          <Button type="primary">
            <Link to="/material-management/purchase-order/new">
              Add New Purchase Order
            </Link>
          </Button>
        </div>
        {pos.isFetching ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={pos.data}
            paginator
            rows={50}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filterDisplay="row"
          >
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            />
            <Column
              field="TransNo"
              header="Trans. No"
              body={(data) => <Tag color="#0078D4">{data.TransNo}</Tag>}
            />
            <Column
              field="TransDate"
              header="Trans. No"
              sortable
              body={(data) => dayjs(data.TransDate).format('MM/DD/YYYY h:mm A')}
            />
            <Column field="Description" header="Department" filter sortable />
            <Column field="Name" header="Vendor Name" filter sortable />
            <Column field="AddedBy" header="Prepared By" sortable />
            <Column field="CheckedBy" header="Checked By" sortable />
            <Column field="ApprovedBy" header="Approved By" sortable />
            <Column
              field="Status"
              header="Status"
              sortable
              body={(data) => {
                if (data.Status === 'PENDING') {
                  return <Tag color="#FF8904">{data.Status}</Tag>;
                } else if (data.Status === 'DISAPPROVED') {
                  return <Tag color="#DC2626">{data.Status}</Tag>;
                } else if (data.Status === 'CANCELLED') {
                  return <Tag color="#6B7280">{data.Status}</Tag>;
                } else if (data.Status === 'COMPLETED') {
                  return <Tag color="#16A34A">{data.Status}</Tag>;
                }
              }}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
};
