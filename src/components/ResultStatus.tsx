import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable';
import { PostData } from '../helpers';
import { Column } from 'primereact/column';
import { Space, Tooltip } from 'antd';

// import { BiNote } from 'react-icons/bi';
import { PiQueueLight } from 'react-icons/pi';
// import { useRouter } from '@tanstack/react-router';
import { TCharges } from '../types';
import useAppStore from '../store';
import { Modal } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';

type Props = {
  AppointmentId?: number;
  AppointmentType?: string;
  QueueNo?: string;
};

export default function ({ AppointmentId, AppointmentType, QueueNo }: Props) {
  // const router = useRouter();
  const resultStatus = useQuery({
    queryKey: ['resultStatus', AppointmentId],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentIdAll',
        parameters: {
          AppointmentId: AppointmentId,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const [queueLoading, setQueueLoading] = useState(false);
  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        {/* {(data.fk_Departments_Id === 1000 ||
          data.fk_Departments_Id === 1001 ||
          data.fk_Departments_Id === 1002) && (
          <Tooltip title="Result">
            <BiNote
              size={16}
              className="cursor-pointer"
              onClick={() => handleResult(data)}
            />
          </Tooltip>
        )} */}
        {data.Status === 'TO FOLLOW' && QueueNo === '' && (
          <Tooltip title="Send to Queue">
            <PiQueueLight
              size={16}
              className="cursor-pointer"
              onClick={() => confirmSendToQueue(data)}
            />
          </Tooltip>
        )}
      </Space>
    );
  };

  // function handleResult(data: any) {
  //   ///Lab
  //   if (data.fk_Departments_Id === 1000) {
  //     router.navigate({
  //       to: '/laboratoryresults/$Id',
  //       params: {
  //         Id: data.fk_Appointments_Id,
  //       },
  //     });
  //   } else if (data.fk_Departments_Id === 1001) {
  //     router.navigate({
  //       to: '/xrayresult/$Id',
  //       params: {
  //         Id: data.fk_Appointments_Id,
  //       },
  //     });
  //   } else if (data.fk_Departments_Id === 1002) {
  //     router.navigate({
  //       to: '/ultrasound/$Id',
  //       params: {
  //         Id: data.fk_Appointments_Id,
  //       },
  //     });
  //   }
  // }

  const store = useAppStore();

  const handleSendToQueue = async (data: TCharges, close: () => void) => {
    try {
      setQueueLoading(true);

      const payload = {
        BranchCode: store.branchCode,
        AppointmentType: AppointmentType,
        AppointmentId: AppointmentId,
        ItemId: data.fk_Items_Id,
      };

      const res = await PostData('follow-up', payload);

      if (res) {
        close(); // closes modal
        // better than reload:
        resultStatus.refetch();
      }
    } finally {
      setQueueLoading(false);
      window.location.reload();
    }
  };

  const confirmSendToQueue = (data: TCharges) => {
    let modalRef: any;

    const close = () => modalRef?.destroy();

    modalRef = Modal.confirm({
      title: 'Send to Queue?',
      content: 'This patient will be added to the follow-up queue. Continue?',
      okText: queueLoading ? 'Processing...' : 'Yes',
      cancelText: 'No',
      centered: true,

      // 👇 disables buttons while loading
      okButtonProps: {
        loading: queueLoading,
        type: 'primary',
        style: {
          backgroundColor: '#1677ff',
          borderColor: '#1677ff',
        },
      },

      onOk: async () => {
        await handleSendToQueue(data, close);
      },

      onCancel: close,
    });
  };

  return (
    <div>
      <DataTable
        value={resultStatus.data}
        emptyMessage="No Records!"
        stripedRows
        size="small"
      >
        <Column field="Description" header="Description"></Column>
        <Column
          field="DateAdded"
          header="Date Added"
          body={(data: TCharges) => dayjs(data.DateAdded).format('MM/DD/YYYY')}
        ></Column>
        <Column field="Status" header="Status"></Column>
        <Column field="StatusDate" header="Date"></Column>
        <Column
          field="action"
          header="Action"
          body={(data: any) => actionBodyTemplate(data)}
        ></Column>
      </DataTable>
    </div>
  );
}
