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

const formatDate = (value: unknown, format: string) => {
  if (!value) {
    return '';
  }

  const date = dayjs(value as string | number | Date);

  return date.isValid() ? date.format(format) : '';
};

export const ExistingCadioResults: FC<Props> = ({
  PatientId,
  AppointmentId,
  handleOpen,
}) => {
  const { data } = useQuery({
    queryKey: [
      'udp_GetCardiologyResultsByPatientId',
      PatientId,
      AppointmentId,
    ],
    enabled: !!PatientId && !!AppointmentId,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetCardiologyResultsByPatientId',
        parameters: {
          PatientId: PatientId,
          AppointmentId: AppointmentId,
        },
      });

      const rows = Array.isArray(res?.parameters?.lst)
        ? res.parameters.lst
        : [];

      return rows.map((row: any) => ({
        ...row,
        Id: row.Id ?? row.ResultId,
      }));
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
      value={data ?? []}
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
      {/* <Column field="ResultId" header="Result Id"></Column> */}
      {/* <Column field="AdmissionId" header="Admission Id"></Column> */}
      {/* <Column field="ChargeId" header="Charge Id"></Column> */}
      <Column
        field="DateOfExamination"
        header="Date Of Examination"
        body={(rowdata) => formatDate(rowdata.DateOfExamination, 'MM/DD/YYYY')}
      />
      <Column
        field="DateFinalized"
        header="Date Finalized"
        body={(rowdata) =>
          formatDate(rowdata.DateFinalized, 'MM/DD/YYYY hh:mm:ss A')
        }
      />
      <Column field="FinalizedBy" header="Finalized By"></Column>
    </DataTable>
  );
};
