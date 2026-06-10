import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { PostData, WithAccess } from '../../helpers';
import { DataTable } from 'primereact/datatable';
import Loading from '../../components/loading';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { TBranches } from '../../types';
import { Button, Divider, notification, Space, Tooltip } from 'antd';
import useAppStore from '../../store';
import { BiEdit } from 'react-icons/bi';

export const Route = createFileRoute('/_authenticated/branches')({
  component: () => <Branches />,
});

const Branches = () => {
  const router = useRouter();
  const store = useAppStore();
  const [expandedRows, setExpandedRows] = useState(null);
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetBranches',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const actionBodyTemplate = (data: TBranches) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Link
            to="/branchprofile/$code"
            params={{
              code: data.Code,
            }}
          >
            <Button type="primary" icon={<BiEdit />} />
          </Link>
        </Tooltip>
      </Space>
    );
  };
  const rowExpansionTemplate = (data: TBranches) => {
    return (
      <div className="p-3">
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
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: 'udp_WithAccess',
      parameters: {
        Username: store.username,
        ModuleId: 4,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: 'Access denied for module-Branches',
          placement: 'topRight',
          duration: 3,
        });
        router.navigate({
          to: '/',
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
      <Divider>Branches</Divider>
      <div className="mt-2">
        {branches.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={branches.data}
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
            {/* <Column
              expander={branches.data!.length > 0}
              style={{ width: "5rem" }}
            /> 
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column> */}
            <Column field="Code" header="Code" filter></Column>
            <Column field="Name" header="Name" filter></Column>
            <Column field="AddressLine1" header="AddressLine1"></Column>
            <Column field="AddressLine2" header="AddressLine2"></Column>
            <Column
              field="DohAccreditationNo"
              header="DOH Accreditation No."
            ></Column>
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>{' '}
            */
          </DataTable>
        )}
      </div>
    </div>
  );
};
