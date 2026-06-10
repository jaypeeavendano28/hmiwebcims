import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { Button, Divider, Modal, Space, Tooltip, notification } from 'antd';
import useAppStore from '../../store';
import { PostData, WithAccess } from '../../helpers';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable';
import Loading from '../../components/loading';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { TItems } from '../../types';
import { BiBuilding, BiEdit, BiNote, BiTrash } from 'react-icons/bi';
import { TbCurrencyPeso } from 'react-icons/tb';

export const Route = createFileRoute('/_authenticated/items')({
  component: () => <Items />,
});

const Items = () => {
  const q = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<TItems | undefined>();
  const [showDelete, setShowDelete] = useState(false);
  const [expandedRows, setExpandedRows] = useState(null);
  const [filters] = useState({
    Description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Department: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ChargeType: { value: null, matchMode: FilterMatchMode.CONTAINS },
    GenericName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const router = useRouter();
  const store = useAppStore();

  const items = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetItems',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: 'udp_WithAccess',
      parameters: {
        Username: store.username,
        ModuleId: 8,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: 'Access denied for module-Items',
          placement: 'topRight',
          duration: 3,
        });
        router.navigate({
          to: '/',
        });
      }
    }
  };
  const actionBodyTemplate = (data: TItems) => {
    //  store.setItemDetails(data);
    return (
      <Space>
        <Tooltip title="Edit">
          <Link
            to="/itemprofile/$Id"
            params={{
              Id: data !== undefined ? data.Id : '',
            }}
          >
            <Button type="primary" icon={<BiEdit />} />
          </Link>
        </Tooltip>

        <Tooltip title="Item Departments">
          <Link
            to="/itemsdepartment/$Id"
            params={{
              Id: data !== undefined ? data.Id : '',
            }}
          >
            <Button
              type="primary"
              icon={<BiBuilding />}
              disabled={String(data.Inventoriable) === 'Y' ? false : true}
            />
          </Link>
        </Tooltip>

        <Tooltip title="Prices">
          <Link
            to="/itemprice/$Id"
            params={{
              Id: data.Id,
            }}
            onClick={() => store.setItemDetails(data)}
          >
            <Button
              icon={<TbCurrencyPeso />}
              disabled={data.ForSale === 'N'}
              type="primary"
            />
          </Link>
        </Tooltip>
        <Tooltip title="Delete">
          <Button
            type="primary"
            icon={<BiTrash />}
            onClick={() => {
              setSelectedItem(data);
              setShowDelete(true);
            }}
          />
        </Tooltip>
      </Space>
    );
  };
  const rowExpansionTemplate = (data: TItems) => {
    return (
      <div className="p-3">
        <div>Id</div>
        <div>
          <strong>{data.Id}</strong>
        </div>
        <div>Added By</div>
        <div>
          <strong>{data.AddedBy}</strong>
        </div>
        <div>Updated By</div>
        <div>
          <strong>{data.UpdatedBy}</strong>
        </div>
        <div>Date Updated</div>
        <div>
          <strong>{data.DateUpdated}</strong>
        </div>
      </div>
    );
  };
  const handleDeleteItem = async () => {
    const res = await PostData('DeleteItem', selectedItem);
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: 'Sucessfully deleted!',
          placement: 'topRight',
          duration: 3,
        });
        q.invalidateQueries({ queryKey: ['items'] });
        setShowDelete(false);
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };
  useEffect(() => {
    store.setHideSideBar('N');
    handleWithAccess();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Items</Divider>
      <Link
        to="/itemprofile/$Id"
        params={{
          Id: '0',
        }}
      >
        <Button type="primary" icon={<BiNote />}>
          New
        </Button>
      </Link>
      <div className="mt-2">
        {items.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={items.data}
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
          >
            <Column
              expander={items.data!.length > 0}
              style={{ width: '5rem' }}
            />
            <Column
              field="action"
              header="Action"
              body={(data: TItems) => actionBodyTemplate(data)}
            ></Column>
            <Column
              field="Description"
              header="Description/Brand"
              filter
            ></Column>
            <Column field="GenericName" header="Generic Name" filter></Column>
            <Column field="Department" header="Department" filter></Column>
            <Column field="ChargeType" header="Charge Type" filter></Column>
            <Column field="QCounter" header="Queue Counter" filter></Column>
          </DataTable>
        )}
      </div>
      <Modal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        okText="Yes"
        cancelText="No"
        onOk={handleDeleteItem}
        title={<p className="text-bold">{selectedItem?.Description}</p>}
      >
        Delete this item?
      </Modal>
    </div>
  );
};
