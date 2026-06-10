import { Button, DatePicker, Form, Modal, Tooltip } from 'antd';
import { TDepartmentItems, TItemInventoryLog } from '../types';
import { FaRegEye } from 'react-icons/fa';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { PostData } from '../helpers';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import axios from 'axios';
import useAppStore from '../store';

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

export default function InventoryLog({
  data,
  departmentName,
}: {
  data: TDepartmentItems;
  departmentName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dates, setDates] = useState({
    from: dayjs(),
    to: dayjs(),
  });
  const store = useAppStore();
  const [isProccessing, setIsProccessing] = useState(false);

  const logs = useQuery({
    queryKey: ['item_inventory_log', data.ItemId, dates],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetItemInventoryLogs',
        parameters: {
          DepartmentId: data.Departmentid,
          DepartmentName: departmentName,
          ItemId: data.ItemId,
          ItemDescription: data.Description,
          DateFrom: dayjs(dates.from).format('YYYY-MM-DDTHH:mm:ss'),
          DateTo: dayjs(dates.to).format('YYYY-MM-DDTHH:mm:ss'),
        },
      });
      if (res) {
        return res.parameters.lst as TItemInventoryLog[];
      }
    },
  });

  const handlePrint = async () => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport/inventory-log';
    try {
      setIsProccessing(true);
      await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        params: {
          DepartmentId: data.Departmentid,
          DepartmentName: departmentName,
          ItemId: data.ItemId,
          ItemDescription: data.Description,
          DateFrom: dayjs(dates.from).format('YYYY-MM-DDTHH:mm:ss'),
          DateTo: dayjs(dates.to).format('YYYY-MM-DDTHH:mm:ss'),
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
    <>
      <Tooltip title="Inventory Logs">
        <Button size="small" type="primary" onClick={() => setIsOpen(true)}>
          <FaRegEye size={14} />
        </Button>
      </Tooltip>
      <Modal
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        centered
        title={`${data.Description} INVENTORY LOGS`}
        width={800}
        destroyOnClose
      >
        <div className="flex gap-x-2">
          <Form.Item label="From">
            <DatePicker
              value={dates.from}
              showTime
              format={'MM/DD/YYYY h:mm A'}
              onChange={(date) =>
                setDates((prev) => ({
                  ...prev,
                  from: date,
                }))
              }
            />
          </Form.Item>
          <Form.Item label="To">
            <DatePicker
              value={dates.to}
              showTime
              format={'MM/DD/YYYY h:mm A'}
              onChange={(date) =>
                setDates((prev) => ({
                  ...prev,
                  to: date,
                }))
              }
            />
          </Form.Item>
          <Button type="primary" loading={isProccessing} onClick={handlePrint}>
            Preview
          </Button>
        </div>
        <DataTable
          value={logs.data}
          paginator
          rows={10}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          filterDisplay="row"
        >
          <Column
            field="TransDate"
            header="Trans. Date"
            body={(data) => dayjs(data.TransDate).format('MM/DD/YYYY h:mm A')}
            sortable
          />
          <Column field="Description" header="Transaction Made" filter />
          <Column field="ReceivedQty" header="Qty From" />
          <Column field="RemainingQty" header="Qty To" />
          <Column field="Qty" header="Qty" />
          <Column field="UnitCost" header="Unit Cost/Amount" />
        </DataTable>
      </Modal>
    </>
  );
}
