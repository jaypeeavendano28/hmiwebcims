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
  TSaveStockIssuance,
} from '../../../../types';
import { useEffect, useState } from 'react';
import Table, { ColumnsType } from 'antd/es/table';
import { BiMinus, BiPlus, BiSearch } from 'react-icons/bi';
import { InputNumber } from 'primereact/inputnumber';
import useAppStore from '../../../../store';

export const Route = createFileRoute(
  '/_authenticated/material-management/stock-issuance/new',
)({
  component: () => <NewStockIssuance />,
});

const decimalFormat = (num: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

type FieldType = {
  transDate: string | dayjs.Dayjs;
  transNo: string;
  requestingDepartment: number;
  issuingDepartment: number;
  remarks: string;
  checkedBy: string;
  approvedBy: string;
};

type SiItemType = TDepartmentItems & {
  reqQty: number;
};

const NewStockIssuance = () => {
  const [form] = Form.useForm<FieldType>();
  const [siItems, setSiItems] = useState<SiItemType[]>([]);
  const [selecteSiItems, setSelecteSiItems] = useState<SiItemType[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [poitemSearch, setPoItemSearch] = useState('');
  const { notification } = App.useApp();
  const router = useRouter();
  const store = useAppStore();

  const approvedBy = useQuery({
    queryKey: ['si_approved_by'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetStockIssuanceCombo',
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
    queryKey: ['si_checked_by'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetStockIssuanceCombo',
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

  const selectedRequestingDepartment =
    Form.useWatch('requestingDepartment', form) ?? undefined;
  const selectedIssuingDepartment =
    Form.useWatch('issuingDepartment', form) ?? undefined;

  const departmentIssuanceItems = useQuery({
    queryKey: [
      'departments_items_issuance',
      selectedRequestingDepartment,
      selectedIssuingDepartment,
    ],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDepartmentItemsIssuance',
        parameters: {
          RequestingDepartmentId: selectedRequestingDepartment,
          IssuingDepartmentId: selectedIssuingDepartment,
        },
      });
      if (res) {
        return res.parameters.lst as TDepartmentItems[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: !!selectedRequestingDepartment && !!selectedIssuingDepartment,
  });

  useEffect(() => {
    if (departmentIssuanceItems.data) {
      const items = departmentIssuanceItems.data.map((i) => ({
        ...i,
        reqQty: 1,
      }));

      setSiItems(items);
      setSelecteSiItems([]);

      return;
    }
    setSiItems([]);
  }, [departmentIssuanceItems.data]);

  console.log(departmentIssuanceItems.data);

  const allSelecteItemIds = selecteSiItems.map((i) => i.ItemId);

  const itemsCol: ColumnsType<SiItemType> = [
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
      title: 'On Hand',
      dataIndex: 'Qty',
      width: 80,
      key: 'Qty',
      align: 'right',
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
            max={record.Qty}
            inputStyle={{ textAlign: 'right', width: '80px' }}
            disabled={allSelecteItemIds.includes(record.ItemId)}
            onChange={(e) => {
              setSiItems((prev) =>
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
            onClick={() => setSelecteSiItems((prev) => [...prev, record])}
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

  const selectedSiItemCol: ColumnsType<SiItemType> = [
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
            setSelecteSiItems((prev) =>
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
      title: 'Unit Cost',
      dataIndex: 'Cost',
      width: 80,
      key: 'Cost',
      align: 'right',
      render: (value) => decimalFormat(value),
      //   render: (_, record) => (
      //     <InputNumber
      //       inputClassName="text-sm"
      //       value={record.Cost}
      //       className="h-7"
      //       mode="decimal"
      //       minFractionDigits={2}
      //       maxFractionDigits={2}
      //       inputStyle={{ textAlign: 'right', width: '80px' }}
      //       onChange={(e) => {
      //         setSelecteSiItems((prev) =>
      //           prev.map((item) =>
      //             item.ItemId === record.ItemId
      //               ? { ...item, Cost: e.value || 0 }
      //               : item,
      //           ),
      //         );
      //       }}
      //     />
      //   ),
    },

    {
      title: 'Amount',
      align: 'right',
      width: 120,
      render: (_, record) => {
        return decimalFormat(record.reqQty * (record.Cost ?? 0));
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
              const n = selecteSiItems.filter(
                (item) => item.ItemId !== record.ItemId,
              );
              setSelecteSiItems(n);
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
      setIsSaving(true);
      const payload: TSaveStockIssuance = {
        TransNo: '',
        TransDate: dayjs(values.transDate).format('YYYY-MM-DDTHH:mm:ss'),
        IssuingDepartmentId: values.issuingDepartment,
        RequestingDepartmentId: values.requestingDepartment,
        CheckedBy: values.checkedBy,
        ApprovedBy: values.approvedBy,
        Remarks: values.remarks,
        BranchCode: store.branchCode,
        Details: selecteSiItems.map((item) => ({
          Id: 0,
          ItemId: item.ItemId,
          RequestedQty: item.reqQty,
          UnitCost: item.Cost,
          PurchaseReceivingDetailsId: 0,
        })),
      };
      console.log(payload);

      const res = await PostData('SaveStockIssuance', payload);
      if (res.status === 1) {
        notification.success({
          message: 'New Stock Issuance Successfully Save!',
          placement: 'topRight',
          duration: 3,
        });
        queryClient.invalidateQueries({
          queryKey: ['stock_issuance'],
        });
        router.navigate({
          to: '/material-management/stock-issuance/$transNo',
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
      <Divider>New Stock Issuance</Divider>
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
          <Input className="!min-w-[300px]" readOnly />
        </Form.Item>

        <Form.Item<FieldType>
          label="Requesting Department"
          name="requestingDepartment"
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
          label="Issuing Department"
          name="issuingDepartment"
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
            className="!min-w-[200px]"
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
            disabled={selecteSiItems.length < 1}
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
            dataSource={siItems.filter((item) =>
              item.Description?.toLocaleLowerCase()?.includes(
                itemSearch.toLocaleLowerCase(),
              ),
            )}
            pagination={false}
          />
        </div>
        <div className="lg:col-span-3">
          <div className="p-0.5 bg-blue-800 font-medium text-xs text-center text-white">
            Stock Issuance Items
          </div>
          <Table
            size="small"
            rowKey="ItemId"
            columns={selectedSiItemCol}
            dataSource={selecteSiItems.filter((item) =>
              item.Description?.toLocaleLowerCase().includes(
                poitemSearch.toLocaleLowerCase(),
              ),
            )}
            pagination={false}
            scroll={{ y: 200, x: 'max-content' }}
            footer={(po) => (
              <div className="font-bold uppercase flex justify-end gap-x-5">
                <div className="h-[20px] w-[1px] bg-slate-200" />
                <div>
                  <span className="text-slate-400">Total Amount </span>{' '}
                  <span>
                    {decimalFormat(
                      po.reduce((sum, item) => {
                        return sum + item.reqQty * (item.Cost ?? 0);
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
