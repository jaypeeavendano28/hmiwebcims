import { createFileRoute, Link } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PostData } from '../../../../helpers';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Divider, Form, Space, Tag, Tooltip } from 'antd';
import { TStockIssuance } from '../../../../types';
import Loading from '../../../../components/loading';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FaRegEye } from 'react-icons/fa';

export const Route = createFileRoute(
  '/_authenticated/material-management/stock-issuance/',
)({
  component: () => <StockIssuance />,
});

const StockIssuance = () => {
  const [date, setDate] = useState<dayjs.Dayjs[]>([dayjs(), dayjs()]);

  const si = useQuery({
    queryKey: ['stock_issuance', date],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetStockIssuanceMain',
        parameters: {
          DateFrom: date[0].format('MM/DD/YYYY'),
          DateTo: date[1].format('MM/DD/YYYY'),
        },
      });
      if (res) {
        return res.parameters.lst as TStockIssuance[];
      }
    },
  });

  const actionBodyTemplate = (data: TStockIssuance) => {
    return (
      <Space>
        <Tooltip title="Preview Stock Issuance">
          <Link
            to="/material-management/stock-issuance/$transNo"
            params={{
              transNo: data.TransNo,
            }}
          >
            <Button size="small" type="primary">
              <FaRegEye size={14} />
            </Button>
          </Link>
        </Tooltip>
      </Space>
    );
  };

  return (
    <div className="cardBackGround">
      <Divider>Stock Issuance</Divider>
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
            <Link to="/material-management/stock-issuance/new">
              Add New Stock Issuance
            </Link>
          </Button>
        </div>

        {si.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={si.data}
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
              body={(data: TStockIssuance) => actionBodyTemplate(data)}
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
            <Column
              field="RequestingDepartmentName"
              header="Req. Department"
              filter
              sortable
            />
            <Column
              field="IssuingDepartmentName"
              header="Iss. Department"
              filter
              sortable
            />
            <Column field="AddedBy" header="Prepared By" sortable />
            <Column field="CheckedBy" header="Checked By" sortable />
            <Column field="ApprovedBy" header="Approved By" sortable />
          </DataTable>
        )}
      </div>
    </div>
  );
};
