import { useState } from 'react';
import {
  TDepartmentItems,
  TItemDepartmentReceiving,
  TSaveStockAdjustment,
} from '../types';
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Switch,
  Tooltip,
} from 'antd';
import { BiEdit, BiSave } from 'react-icons/bi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PostData } from '../helpers';
import Table, { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import useAppStore from '../store';

type FieldType = {
  reason: string;
  type: boolean;
};

export default function ItemAdjustment({ data }: { data: TDepartmentItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState<
    TItemDepartmentReceiving[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const store = useAppStore();

  const { notification, modal } = App.useApp();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['item_department_receving', data.ItemId, data.Departmentid],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetItemsByDepartmentReceivingList',
        parameters: {
          DepartmentId: data.Departmentid,
          ItemId: data.ItemId,
        },
      });

      return res?.parameters.lst as TItemDepartmentReceiving[];
    },
    enabled: false,
    staleTime: 0,
  });

  const handleOpen = async () => {
    form.resetFields();
    setAdjustmentData([]);
    setIsOpen(true);

    const res = await itemsQuery.refetch();
    if (res.data) {
      setAdjustmentData(res.data);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setAdjustmentData([]);
  };

  const handleSubmit = async (record: TItemDepartmentReceiving) => {
    try {
      setIsSaving(true);

      const values: FieldType = form.getFieldsValue();

      if (!record.LotNo?.trim()) {
        modal.error({
          title: 'ADJUSTMENT DETAILS',
          content: 'Lot No. cannot be empty!',
          centered: true,
        });
        return;
      }

      const prevData = itemsQuery.data?.find((item) => item.Id === record.Id);

      const payload: TSaveStockAdjustment = {
        DepartmentId: data.Departmentid.toString(),
        ItemId: data.ItemId.toString(),
        Qty: record.Qty,
        AdjustmentCode: values.type,
        LotNo: record.LotNo,
        ExpiryDate: record.ExpiryDate
          ? dayjs(record.ExpiryDate).format('YYYY-MM-DDTHH:mm:ss')
          : undefined,
        PurchaseReceivingDetailsId: record.Id,
        UnitCost: record.UnitCost,
        Remarks: values.reason ?? '',
        AdjustLotExpDetails:
          prevData?.LotNo !== record.LotNo ||
          prevData?.ExpiryDate !== record.ExpiryDate
            ? 'Y'
            : 'N',
        BranchCode: store.branchCode,
      };

      console.log(payload);

      const res = await PostData('SaveStockItemAdjustment', payload);
      if (res.status === 1) {
        notification.success({
          message: 'Adjustment Details Successfully Saved!',
          placement: 'topRight',
          duration: 3,
        });
        queryClient.invalidateQueries({
          queryKey: ['departments_items', data.Departmentid.toString()],
        });
        queryClient.invalidateQueries({
          queryKey: ['item_inventory_log'],
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
      setIsOpen(false);
    }
  };

  const columns: ColumnsType<TItemDepartmentReceiving> = [
    {
      title: 'Trans. No',
      dataIndex: 'TransNo',
      width: 100,
    },
    {
      title: 'Vendor/Department Name',
      dataIndex: 'VendorName',
      width: 170,
    },
    {
      title: 'Trans Date',
      dataIndex: 'TransDate',
      width: 140,
      render: (value) => dayjs(value).format('MM/DD/YYYY h:mm A'),
    },
    {
      title: 'Rec. Qty',
      dataIndex: 'ReceivedQty',
      width: 65,
      align: 'right',
    },
    {
      title: 'On Hand',
      dataIndex: 'RemainingQty',
      width: 65,
      align: 'right',
    },
    {
      title: 'Unit Cost',
      dataIndex: 'UnitCost',
      width: 70,
      align: 'right',
    },
    {
      title: 'Lot No.',
      dataIndex: 'LotNo',
      width: 80,
      render: (value, record) => (
        <InputText
          value={value}
          className="!w-[80px] h-7"
          onChange={(e) => {
            setAdjustmentData((prev) =>
              prev.map((item) =>
                item.Id === record.Id
                  ? { ...item, LotNo: e.target.value }
                  : item,
              ),
            );
          }}
        />
      ),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'ExpiryDate',
      width: 120,
      render: (value, record) => (
        <DatePicker
          size="small"
          className="!w-[120px]"
          value={value ? dayjs(value) : undefined}
          format="MM/DD/YYYY"
          onChange={(date) => {
            setAdjustmentData((prev) =>
              prev.map((item) =>
                item.Id === record.Id
                  ? { ...item, ExpiryDate: dayjs(date).format('MM/DD/YYYY') }
                  : item,
              ),
            );
          }}
        />
      ),
    },
    {
      title: 'Adjustment',
      dataIndex: 'Qty',
      width: 75,

      render: (_, record) => (
        <InputNumber
          inputClassName="text-sm"
          value={record.Qty}
          className="h-7"
          inputStyle={{ textAlign: 'right', width: '75px' }}
          onChange={(e) => {
            setAdjustmentData((prev) =>
              prev.map((item) =>
                item.Id === record.Id ? { ...item, Qty: e.value || 1 } : item,
              ),
            );
          }}
        />
      ),
    },
    {
      title: 'Action',
      width: 55,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          className="!px-2 !h-6"
          onClick={() => handleSubmit(record)}
          loading={isSaving}
        >
          <BiSave size={14} />
        </Button>
      ),
    },
  ];

  return (
    <>
      <Tooltip title="Adjustment Details">
        <Button size="small" type="primary" onClick={handleOpen}>
          <BiEdit size={14} />
        </Button>
      </Tooltip>

      <Modal
        open={isOpen}
        onCancel={handleClose}
        footer={null}
        centered
        title={`${data.Description} ADJUSTMENT DETAILS`}
        width={1000}
        destroyOnClose
      >
        <div
          className="
            [&_.ant-table-cell]:!text-xs
            [&_.ant-table-cell]:!py-1
            [&_.ant-table-cell]:!px-2
          "
        >
          <Form
            form={form}
            className="flex items-end gap-x-2"
            layout="vertical"
          >
            <Form.Item<FieldType>
              name="type"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch
                checkedChildren="Additional"
                unCheckedChildren="Deduction"
              />
            </Form.Item>

            <Form.Item<FieldType>
              label="Reason for Adjustment"
              name="reason"
              className="grow"
            >
              <Input />
            </Form.Item>
          </Form>

          <Table
            size="small"
            scroll={{ y: 500, x: 'max-content' }}
            rowKey="Id"
            columns={columns}
            dataSource={adjustmentData}
            loading={itemsQuery.isFetching}
            pagination={false}
          />
        </div>
      </Modal>
    </>
  );
}
