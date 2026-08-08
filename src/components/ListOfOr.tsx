import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isNullOrUndefinedOrBlank, PostData, WithAccess } from '../helpers';
import {
  Button,
  DatePicker,
  Form,
  Input,
  notification,
  Popconfirm,
  Row,
  Space,
  Tooltip,
} from 'antd';
import { Divider } from 'primereact/divider';
import useAppStore from '../store';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import Loading from './loading';
import { DataTable } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { TPaymentsMain } from '../types';
import { round } from 'lodash';
import { TbTrash } from 'react-icons/tb';
import { FaX } from 'react-icons/fa6';
import { ColumnGroup } from 'primereact/columngroup';

const ListOfOr = () => {
  const [reason, setReason] = useState('');
  const [expandedRows, setExpandedRows] = useState(null);
  const q = useQueryClient();
  const [filters] = useState({
    OrNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Payee: { value: null, matchMode: FilterMatchMode.CONTAINS },
    CashierLocationDesc: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const store = useAppStore();
  const [form] = Form.useForm();
  const data = useQuery({
    queryKey: ['data'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetListOfOr',
        parameters: {
          BranchCode: store.branchCode,
          DateFrom: dayjs(form.getFieldValue('DateFrom')).format('YYYY-MM-DD'),
          DateTo: dayjs(form.getFieldValue('DateTo')).format('YYYY-MM-DD'),
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  useEffect(() => {
    form.setFieldsValue({
      DateFrom: dayjs(),
      DateTo: dayjs(),
    });
    q.invalidateQueries({ queryKey: ['data'] });
  }, []);
  const handleCancel = async (data: TPaymentsMain) => {
    const res = await WithAccess({
      sp: 'udp_WithAccess',
      parameters: {
        Username: store.username,
        ModuleId: 36,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: 'Access denied-Cashier-Cancel O.R.',
          placement: 'topRight',
          duration: 3,
        });
      } else {
        if (isNullOrUndefinedOrBlank(reason)) {
          notification.error({
            message: 'Please encode a reason!',
            placement: 'topRight',
            duration: 3,
          });
          return;
        }

        const res = await PostData('CancelOr', {
          Id: data.Id,
          DeleteReason: reason,
        });
        if (res) {
          if (res.status === 1) {
            notification.success({
              message: 'O.R. successfully cancelled',
              placement: 'topRight',
              duration: 3,
            });
            setReason('');
            q.invalidateQueries({ queryKey: ['data'] });
          } else {
            notification.error({
              message: res.message,
              placement: 'topRight',
              duration: 3,
            });
          }
        }
      }
    }
  };
  const actionBodyTemplate = (data: TPaymentsMain) => {
    return (
      <Space>
        {isNullOrUndefinedOrBlank(data.DeletedBy) && (
          <>
            <Tooltip title="Cancel OR">
              <Popconfirm
                title="Cancel O.R?"
                okText="Yes"
                cancelText="No"
                onConfirm={() => handleCancel(data)}
                description={
                  <>
                    Reason:
                    <Input onChange={(e: any) => setReason(e.target.value)} />
                  </>
                }
                placement="right"
              >
                <Button type="primary" danger icon={<TbTrash />} />
              </Popconfirm>
            </Tooltip>
          </>
        )}

        {!isNullOrUndefinedOrBlank(data.DeletedBy) && (
          <>
            <FaX color="red" size={24} />
          </>
        )}
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TPaymentsMain) => {
    return (
      <div className="p-3">
        <div>Added By</div>
        <div>
          <strong>{data.AddedBy}</strong>
        </div>
        <div>Date Added</div>
        <div>
          <strong>{data.DateAdded}</strong>
        </div>
        <div>Updated By</div>
        <div>
          <strong>{data.UpdatedBy}</strong>
        </div>
        <div>Date Updated</div>
        <div>
          <strong>{data.DateUpdated}</strong>
        </div>
        <div>Deleted By</div>
        <div>
          <strong>{data.DeletedBy}</strong>
        </div>
        <div>Date Deleted</div>
        <div>
          <strong>{data.DateDeleted}</strong>
        </div>
        <div>Deleted Reason</div>
        <div>
          <strong>{data.DeleteReason}</strong>
        </div>
      </div>
    );
  };

  const amountBodyTemplate = (data: TPaymentsMain) => {
    const amount = round(data.Amount as number, 2);
    return amount.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };
  const formatCurrency = (value: any) => {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };
  const totalAmount = () => {
    let total = 0;
    if (data.data && data.data.length) {
      for (let amount of data.data) {
        total += amount.Amount2;
      }
    }
    let t = formatCurrency(total);

    return <p className="text-lg font-bold">{t}</p>;
  };
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={5}
          footerStyle={{ textAlign: 'right' }}
        />
        <Column footer={totalAmount} />
      </Row>
    </ColumnGroup>
  );
  return (
    <div>
      <Divider>List Of Official Receipts</Divider>

      <Form
        form={form}
        layout="inline"
        onFinish={() => {
          q.invalidateQueries({ queryKey: ['data'] });
        }}
      >
        <Form.Item name="DateFrom" label="Date To">
          <DatePicker format="MM/DD/YYYY" />
        </Form.Item>
        <Form.Item name="DateTo" label="Date To">
          <DatePicker format="MM/DD/YYYY" />
        </Form.Item>
        <Form.Item noStyle>
          <Button type="primary" htmlType="submit">
            Refrech List
          </Button>
        </Form.Item>
      </Form>
      <div className="mt-2">
        {data.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={data.data}
            tableStyle={{ minWidth: '50rem' }}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filters={filters}
            filterDisplay="row"
            rowExpansionTemplate={rowExpansionTemplate}
            expandedRows={expandedRows as any}
            onRowToggle={(e) => setExpandedRows(e.data as any)}
            footerColumnGroup={footerGroup}
          >
            <Column
              expander={data.data && data.data.length > 0}
              style={{ width: '5rem' }}
            />
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
            <Column
              field="OrNo"
              header="O.R No."
              filter
              style={{ minWidth: '12rem' }}
            ></Column>
            <Column
              field="Payee"
              header="Payee"
              style={{ minWidth: '12rem' }}
              filter
            ></Column>
            <Column
              field="CashierLocationDesc"
              header="CashierLocationDesc"
              filter
            ></Column>
            <Column
              field="Amount"
              header="Amount"
              style={{ minWidth: '12rem' }}
              body={(data: any) => amountBodyTemplate(data)}
              align="right"
            ></Column>
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default ListOfOr;
