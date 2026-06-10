import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, DatePicker, Divider, Form, Space, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PostData } from '../../../../helpers';
import { TPurchaseReceiving } from '../../../../types';
import Loading from '../../../../components/loading';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FaRegEye } from 'react-icons/fa';
import CancelPr from '../../../../components/cancel-pr';

export const Route = createFileRoute(
  '/_authenticated/material-management/receiving/',
)({
  component: () => <Receiving />,
});

const Receiving = () => {
  const [date, setDate] = useState<dayjs.Dayjs[]>([dayjs(), dayjs()]);

  const rr = useQuery({
    queryKey: ['receiving', date],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPurchaseReceivingMain',
        parameters: {
          DateFrom: date[0].format('MM/DD/YYYY'),
          DateTo: date[1].format('MM/DD/YYYY'),
        },
      });
      if (res) {
        return res.parameters.lst as TPurchaseReceiving[];
      }
    },
  });
  const actionBodyTemplate = (data: TPurchaseReceiving) => {
    return (
      <Space>
        <Tooltip title="Preview Purchase Receiving">
          <Link
            to="/material-management/receiving/$transNo"
            params={{
              transNo: data.TransNo,
            }}
          >
            <Button
              size="small"
              type="primary"
              disabled={data.DeletedDate ? true : false}
            >
              <FaRegEye size={14} />
            </Button>
          </Link>
        </Tooltip>
        <CancelPr data={data} />
      </Space>
    );
  };

  return (
    <div className="cardBackGround">
      <Divider>Receiving</Divider>
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
            <Link to="/material-management/receiving/new">
              Add New Purchase Receiving
            </Link>
          </Button>
        </div>

        {rr.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={rr.data}
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
              body={(data: TPurchaseReceiving) => actionBodyTemplate(data)}
            />
            <Column
              field="TransNo"
              header="Trans. No"
              body={(data) => {
                if (data.DeletedDate) {
                  return <Tag color="#DC2626">{data.TransNo}</Tag>;
                } else {
                  return <Tag color="#0078D4">{data.TransNo}</Tag>;
                }
              }}
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
            <Column field="ApprovedBy" header="Approved By" sortable />
            <Column field="Remarks" header="Remarks" sortable />
            <Column field="Terms" header="Terms" sortable />
          </DataTable>
        )}
      </div>
    </div>
  );
};
