import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Divider, Form, Select, Space } from 'antd';
import { useState } from 'react';
import { PostData } from '../../../../helpers';
import { TDepartmentItems, TDepartments } from '../../../../types';
import Loading from '../../../../components/loading';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ItemInventoryLogs from '../../../../components/item-inventory-logs';
import ItemAdjustment from '../../../../components/item-adjustment';
import axios from 'axios';
import useAppStore from '../../../../store';

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

export const Route = createFileRoute(
  '/_authenticated/material-management/quantity-on-hand/',
)({
  component: () => <QtyOnHand />,
});

const decimalFormat = (num: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const QtyOnHand = () => {
  const [department, setDepartment] = useState<number | undefined>(undefined);
  const [departmentName, setDepartmentName] = useState('');
  const store = useAppStore();
  const [isProccessing, setIsProccessing] = useState(false);

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

  const departmentItems = useQuery({
    queryKey: ['departments_items', department],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDepartmentItems',
        parameters: {
          DepartmentId: department,
        },
      });
      if (res) {
        return res.parameters.lst as TDepartmentItems[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: !!department,
  });

  const actionBodyTemplate = (data: TDepartmentItems) => {
    return (
      <Space>
        <ItemInventoryLogs data={data} departmentName={departmentName} />
        <ItemAdjustment data={data} />
      </Space>
    );
  };

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
          ReportName: 'DepartmentInventory.rdl',
          AppointmentId: department,
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
      <Divider>Quantity on Hand</Divider>
      <div className="flex gap-x-2">
        <Form.Item label="Department">
          <Select
            showSearch
            value={department}
            className="!w-[300px]"
            optionFilterProp="label"
            onChange={(val, opt) => {
              setDepartment(val);
              // @ts-ignore
              setDepartmentName(opt.label);
            }}
            options={departments.data?.map((d) => ({
              value: d.Id,
              label: d.Description,
            }))}
          />
        </Form.Item>

        <Button
          type="primary"
          loading={isProccessing}
          onClick={handlePrint}
          disabled={!department}
        >
          Preview
        </Button>
      </div>

      {departmentItems.isLoading ? (
        <Loading size={64} />
      ) : (
        <DataTable
          value={departmentItems.data}
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
            className="w-[80px]"
            body={(data: any) => actionBodyTemplate(data)}
          />
          <Column field="Description" header="Description" filter sortable />
          <Column
            field="Cost"
            header="Unit Cost"
            className="w-[100px]"
            sortable
            body={(data) => decimalFormat(data.Cost)}
          />
          <Column field="Qty" className="w-[100px]" header="On Hand" sortable />
        </DataTable>
      )}
    </div>
  );
};
