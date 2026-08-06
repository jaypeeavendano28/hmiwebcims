import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable';
import { PostData } from '../helpers';
import { Column } from 'primereact/column';
import { Modal, notification, Space, Tooltip } from 'antd';

// import { BiNote } from 'react-icons/bi';
import { PiQueueLight } from 'react-icons/pi';
// import { useRouter } from '@tanstack/react-router';
import { TCharges } from '../types';
import { useState } from 'react';
import dayjs from 'dayjs';

type Props = {
  AppointmentId?: number;
};

export default function ({ AppointmentId }: Props) {
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

  const [queueingChargeId, setQueueingChargeId] = useState<number>();
  const actionBodyTemplate = (data: TCharges) => {
    const canQueueFollowUp =
      data.Status?.trim().toUpperCase() === 'TO FOLLOW' &&
      data.IsPackage?.trim().toUpperCase() !== 'Y' &&
      !data.HasActiveQueue;

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
        {canQueueFollowUp && (
          <Tooltip title="Send to Queue">
            <PiQueueLight
              size={16}
              className={
                queueingChargeId === data.Id
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
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

  const handleSendToQueue = async (data: TCharges) => {
    try {
      setQueueingChargeId(data.Id);

      const payload = {
        AppointmentId: AppointmentId,
        ItemId: data.fk_Items_Id,
        ChargeId: data.Id,
      };

      const res = await PostData('follow-up', payload);

      if (res?.status !== 1) {
        throw new Error(res?.message ?? 'Unable to send the follow-up to queue.');
      }

      notification.success({
        message: res.message ?? 'Follow-up sent to queue.',
        placement: 'topRight',
      });
      await resultStatus.refetch();
    } catch (error) {
      notification.error({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to send the follow-up to queue.',
        placement: 'topRight',
      });
      throw error;
    } finally {
      setQueueingChargeId(undefined);
    }
  };

  const confirmSendToQueue = (data: TCharges) => {
    Modal.confirm({
      title: 'Send to Queue?',
      content: 'This patient will be added to the follow-up queue. Continue?',
      okText: 'Yes',
      cancelText: 'No',
      centered: true,
      okButtonProps: {
        type: 'primary',
        style: {
          backgroundColor: '#1677ff',
          borderColor: '#1677ff',
        },
      },
      onOk: () => handleSendToQueue(data),
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
          body={(data: TCharges) => actionBodyTemplate(data)}
        ></Column>
      </DataTable>
    </div>
  );
}
