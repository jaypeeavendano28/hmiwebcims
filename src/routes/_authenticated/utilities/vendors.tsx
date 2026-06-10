import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Divider, Space, Tooltip } from 'antd';
import { PostData } from '../../../helpers';
import { TVendor } from '../../../types';
import Loading from '../../../components/loading';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import AddVendor from '../../../components/add-vendor';
import EditVendor from '../../../components/edit-vendor';
import DeleteVendor from '../../../components/delete-vendor';

export const Route = createFileRoute('/_authenticated/utilities/vendors')({
  component: () => <Vendors />,
});

const Vendors = () => {
  const vendors = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSuppliers',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst as TVendor[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const actionBodyTemplate = (data: TVendor) => {
    //  store.setItemDetails(data);
    return (
      <Space>
        <Tooltip title="Edit">
          <EditVendor data={data} />
        </Tooltip>
        <Tooltip title="Delete">
          <DeleteVendor data={data} />
        </Tooltip>
      </Space>
    );
  };

  return (
    <div className="cardBackGround">
      <Divider>Vendors</Divider>
      <AddVendor />
      {vendors.isLoading ? (
        <Loading size={64} />
      ) : (
        <DataTable
          value={vendors.data}
          tableStyle={{ minWidth: '50rem' }}
          paginator
          rows={10}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          filterDisplay="row"
        >
          <Column
            field="action"
            header="Action"
            body={(data: TVendor) => actionBodyTemplate(data)}
          ></Column>
          <Column field="Name" header="Name" filter />
          <Column field="Address" header="Address" />
          <Column field="ContactPerson" header="Contact Person" />
          <Column field="EmailAddress" header="Email Address" />
          <Column field="Tax" header="Tax Percent" />
        </DataTable>
      )}
    </div>
  );
};
