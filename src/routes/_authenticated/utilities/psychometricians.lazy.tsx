import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Divider, notification, Popconfirm, Space, Tooltip } from 'antd';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useState } from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';
import Loading from '../../../components/loading';
import { PostData } from '../../../helpers';
import { TMedtechs } from '../../../types';

export const Route = createLazyFileRoute('/_authenticated/utilities/psychometricians')({
  component: Psychometricians,
});

function Psychometricians() {
  const [deletingId, setDeletingId] = useState(0);
  const [expandedRows, setExpandedRows] = useState(null);
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const psychometricians = useQuery<TMedtechs[]>({
    queryKey: ['psychometricians'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetListOfMedtechs',
        parameters: { Type: 'P' },
      });
      return res?.parameters?.lst ?? [];
    },
  });

  const deletePsychometrician = async (record: TMedtechs) => {
    setDeletingId(record.Id);
    try {
      const res = await PostData('DeleteMedtech', { Id: record.Id });
      if (res?.status !== 1) {
        throw new Error(res?.message || 'Unable to delete psychometrician.');
      }
      notification.success({ message: 'Psychometrician deleted.' });
      await psychometricians.refetch();
    } catch (error) {
      notification.error({
        message: error instanceof Error ? error.message : 'Unable to delete psychometrician.',
      });
    } finally {
      setDeletingId(0);
    }
  };

  return (
    <div className="cardBackGround">
      <Divider>Psychometricians</Divider>
      <Link to="/utilities/psychometrician/$Id" params={{ Id: '0' }}>
        <Button type="primary">New</Button>
      </Link>
      <div className="mt-2">
        {psychometricians.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={psychometricians.data ?? []}
            tableStyle={{ minWidth: '50rem' }}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No psychometricians found."
            stripedRows
            size="small"
            filters={filters}
            filterDisplay="row"
            expandedRows={expandedRows as any}
            onRowToggle={(event) => setExpandedRows(event.data as any)}
            rowExpansionTemplate={(record: TMedtechs) => (
              <div className="p-3">
                <div>Updated by: {record.UpdatedBy || '—'}</div>
                <div>Date updated: {record.DateUpdated || '—'}</div>
              </div>
            )}
          >
            <Column expander={Boolean(psychometricians.data?.length)} style={{ width: '5rem' }} />
            <Column
              header="Action"
              body={(record: TMedtechs) => (
                <Space>
                  <Tooltip title="Edit">
                    <Link to="/utilities/psychometrician/$Id" params={{ Id: String(record.Id) }}>
                      <Button type="primary" icon={<BiEdit />} />
                    </Link>
                  </Tooltip>
                  <Popconfirm
                    title="Delete this psychometrician?"
                    description="This record will be removed from the active list."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => deletePsychometrician(record)}
                  >
                    <Tooltip title="Delete">
                      <Button danger icon={<BiTrash />} loading={deletingId === record.Id} />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              )}
            />
            <Column field="Id" header="Id" />
            <Column field="Name" header="Name" filter />
            <Column field="LicenseNo" header="License No." />
            <Column field="Title" header="Title" />
          </DataTable>
        )}
      </div>
    </div>
  );
}
