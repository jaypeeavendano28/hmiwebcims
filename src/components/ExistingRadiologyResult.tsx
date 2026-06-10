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
  counter: string;
};

export const ExistingRadiologyResults: FC<Props> = ({
  PatientId,
  AppointmentId,
  handleOpen,
  counter,
}) => {
  const { data } = useQuery({
    queryKey: ['radiology_result_patient_id', PatientId],
    enabled: !!PatientId && !!AppointmentId,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetRadiologyResultByPatientId',
        parameters: {
          PatientId: PatientId,
          AppointmentId,
        },
      });

      return res.parameters.lst.filter((x: any) => x.QCounter === counter);
    },
  });

  console.log('ExistingRadiologyResults', data);

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
