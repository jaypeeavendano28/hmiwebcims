import { FC, useEffect, useState } from 'react';
import { PostData } from '../helpers';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Space, Tooltip } from 'antd';
import { BiBookOpen } from 'react-icons/bi';

type Props = {
  PatientId?: number;
  handleOpen: (data: any) => void;
  Key?: string;
};

const ExistingLabResults: FC<Props> = ({ PatientId, handleOpen, Key }) => {
  const [labresults, setLabResults] = useState([]);
  const handleLabResults = async () => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetLabResultsByPatientId',
        parameters: {
          PatientId: PatientId,
        },
      });
      if (res) {
        setLabResults(res.parameters.lst);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Open">
          <BiBookOpen
            size={16}
            className="cursor-pointer text-gray-500 hover:text-gray-600"
            onClick={() => handleOpen(data)}
          />
        </Tooltip>
      </Space>
    );
  };
  useEffect(() => {
    handleLabResults();
  }, [PatientId, Key]);
  return (
    <div>
      <DataTable
        value={labresults}
        // paginator
        // rows={10}
        // rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No Records!"
        stripedRows
        size="small"
      >
        <Column
          field="action"
          header="Action"
          body={(data) => actionBodyTemplate(data)}
        ></Column>
        <Column field="Description" header="Description"></Column>

        <Column field="ReportDateStr" header="Report Date"></Column>
      </DataTable>
    </div>
  );
};

export default ExistingLabResults;
