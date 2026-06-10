import { FC } from 'react';
import { PostData } from '../helpers';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Space, Tooltip } from 'antd';
import { BiBookOpen } from 'react-icons/bi';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

type Props = {
  PatientId?: number;
  AppointmentId?: number;
  handleOpen: (data: any) => void;
};

export const ExistingCadioResults: FC<Props> = ({
  PatientId,
  AppointmentId,
  handleOpen,
}) => {
  const { data } = useQuery({
    queryKey: ['udp_GetCardiologyResultByPatientId', PatientId],
    enabled: !!PatientId && !!AppointmentId,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetCardiologyResultByPatientId',
        parameters: {
          PatientId: PatientId,
          AppointmentId,
        },
      });

      return res.parameters.lst;
    },
  });

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

  return (
    <DataTable
      value={data}
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
      <Column field="ChargeDescription" header="Description"></Column>

      <Column
        field="ReportDate"
        header="Report Date"
        body={(rowdata) => {
          return dayjs(rowdata.ReportDate).format('DD/MM/YYYY h:mm:ss A');
        }}
      />
    </DataTable>
  );
};
