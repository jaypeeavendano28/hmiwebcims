import { Button, DatePicker, Modal, notification, Space, Tooltip } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { FaRegEdit } from 'react-icons/fa';
import { PostData } from '../helpers';
import { TCharges } from '../types';

type Props = {
  charge: TCharges;
  appointmentId?: number;
  onSaved?: () => void | Promise<void>;
};

export const formatChargeDateTime = (value?: string) => {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('MM/DD/YYYY hh:mm A') : '-';
};

const ChargeDateAddedEditor = ({ charge, appointmentId, onSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [dateAdded, setDateAdded] = useState<Dayjs | null>(null);
  const [saving, setSaving] = useState(false);
  const resolvedAppointmentId = Number(
    appointmentId ?? charge.fk_Appointments_Id ?? 0,
  );

  const openEditor = () => {
    const currentDate = charge.DateAdded ? dayjs(charge.DateAdded) : null;
    setDateAdded(currentDate?.isValid() ? currentDate : dayjs());
    setOpen(true);
  };

  const save = async () => {
    if (!dateAdded?.isValid() || !charge.Id || resolvedAppointmentId <= 0) {
      notification.error({ message: 'Select a valid date and time.' });
      return;
    }

    let wasSaved = false;
    try {
      setSaving(true);
      const result = await PostData('UpdateChargeDateAdded', {
        Id: charge.Id,
        AppointmentId: resolvedAppointmentId,
        DateAdded: dateAdded.format('YYYY-MM-DDTHH:mm:ss'),
      });

      if (result?.status !== 1) {
        throw new Error(result?.message ?? 'Unable to update Date Added.');
      }

      setOpen(false);
      wasSaved = true;
      notification.success({ message: 'Date Added updated.' });
    } catch (error) {
      notification.error({
        message:
          error instanceof Error ? error.message : 'Unable to update Date Added.',
      });
    } finally {
      setSaving(false);
    }

    if (!wasSaved) return;

    try {
      await onSaved?.();
    } catch {
      notification.warning({
        message: 'Date Added was saved, but the list could not be refreshed.',
      });
    }
  };

  return (
    <>
      <Space size={4}>
        <span className="whitespace-nowrap">
          {formatChargeDateTime(charge.DateAdded)}
        </span>
        <Tooltip title="Edit Date Added">
          <Button
            type="text"
            size="small"
            aria-label="Edit Date Added"
            icon={<FaRegEdit />}
            onClick={openEditor}
          />
        </Tooltip>
      </Space>
      {open && (
        <Modal
          title="Edit Date Added"
          open={open}
          okText="Save"
          okButtonProps={{ loading: saving, disabled: !dateAdded }}
          onOk={() => void save()}
          onCancel={() => {
            if (!saving) setOpen(false);
          }}
          closable={!saving}
          maskClosable={!saving}
        >
          <DatePicker
            className="w-full"
            value={dateAdded}
            onChange={setDateAdded}
            format="MM/DD/YYYY hh:mm A"
            showTime={{ format: 'hh:mm A' }}
            allowClear={false}
          />
          <p className="mt-2 text-xs text-slate-500">
            Originally recorded: {formatChargeDateTime(charge.TransDate)}
          </p>
        </Modal>
      )}
    </>
  );
};

export default ChargeDateAddedEditor;
