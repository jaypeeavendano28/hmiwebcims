import { FC } from 'react';
import { Button, Tooltip } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BiBookOpen } from 'react-icons/bi';
import { BsCalendar3, BsCheckCircleFill, BsCircleFill } from 'react-icons/bs';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';

type Props = {
  PatientId?: number;
  AppointmentId?: number;
  handleOpen: (data: any) => void;
  reloadKey?: string;
  activeChargeId?: number | string;
};

const getStatusDetails = (status?: unknown) => {
  const statusText = String(status ?? '').trim();
  const normalizedStatus = statusText.toUpperCase();

  if (normalizedStatus === 'DONE') {
    return {
      label: 'Done',
      icon: <BsCheckCircleFill className="text-teal-600" />,
      textClassName: 'text-slate-700',
    };
  }

  if (normalizedStatus === 'TO FOLLOW') {
    return {
      label: 'To Follow',
      icon: <BsCircleFill className="text-slate-500" size={9} />,
      textClassName: 'text-slate-600',
    };
  }

  if (normalizedStatus === 'DEFERRED') {
    return {
      label: 'Deferred',
      icon: <BsCircleFill className="text-rose-500" size={9} />,
      textClassName: 'text-rose-600',
    };
  }

  if (normalizedStatus === 'CANCELLED') {
    return {
      label: 'Cancelled',
      icon: <BsCircleFill className="text-red-600" size={9} />,
      textClassName: 'text-red-700',
    };
  }

  return {
    label: statusText || 'N/A',
    icon: <BsCircleFill className="text-slate-300" size={9} />,
    textClassName: 'text-slate-400',
  };
};

const formatStatusDate = (value?: unknown) => {
  const statusDateText = String(value ?? '').trim();
  if (isNullOrUndefinedOrBlank(statusDateText)) return '';

  const statusDate = dayjs(statusDateText);
  return statusDate.isValid()
    ? statusDate.format('MM/DD/YYYY h:mm A')
    : statusDateText;
};

const isPackageCharge = (value?: unknown) => {
  const packageValue = String(value ?? '')
    .trim()
    .toUpperCase();

  return packageValue === 'Y' || packageValue === 'TRUE' || packageValue === '1';
};

export const ExistingCadioResults: FC<Props> = ({
  AppointmentId,
  handleOpen,
  reloadKey,
  activeChargeId,
}) => {
  const selectedChargeId = Number(activeChargeId ?? 0);
  const { data = [] } = useQuery<any[]>({
    queryKey: ['existing-cardio-charge-results', AppointmentId, reloadKey],
    enabled: !!AppointmentId,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentIdForResult',
        parameters: {
          AppointmentId,
        },
      });

      const rows = Array.isArray(res?.parameters?.lst)
        ? res.parameters.lst
        : [];

      return rows
        .filter(
          (charge: any) =>
            !isPackageCharge(charge.IsPackage) &&
            Number(charge.ResultId ?? 0) > 0 &&
            String(charge.QCounter ?? '').trim() === 'CARDIO',
        )
        .map((charge: any) => ({
          ...charge,
          Id: charge.ResultId,
          ChargeId: charge.Id,
          fk_Charges_Id: charge.Id,
          ChargeDescription: charge.Description,
          AdmissionId: charge.fk_Appointments_Id ?? AppointmentId,
        }));
    },
  });

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white text-xs shadow-sm">
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(92px,0.8fr)_40px] items-center gap-2 bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase text-slate-600">
        <span>Examination</span>
        <span>Status</span>
        <span className="text-right">Open</span>
      </div>

      {data.length === 0 ? (
        <div className="px-3 py-6 text-center text-xs font-medium text-slate-400">
          No Records!
        </div>
      ) : (
        data.map((charge: any, index) => {
          const statusDetails = getStatusDetails(charge.Status);
          const statusDate = formatStatusDate(charge.StatusDate);
          const isActiveCharge =
            selectedChargeId > 0 && Number(charge.ChargeId) === selectedChargeId;

          return (
            <div
              key={charge.ChargeId ?? `${charge.Description}-${index}`}
              className={`grid grid-cols-[minmax(0,1.2fr)_minmax(92px,0.8fr)_40px] items-start gap-2 border-t px-3 py-3 transition-colors ${
                isActiveCharge
                  ? 'border-sky-200 bg-sky-100/80 shadow-[inset_3px_0_0_#0284c7]'
                  : `border-slate-100 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`
              }`}
            >
              <div className="min-w-0">
                <div
                  className={`truncate text-[11px] font-bold uppercase ${
                    isActiveCharge ? 'text-sky-950' : 'text-sky-800'
                  }`}
                >
                  {charge.Description || charge.ChargeDescription || '-'}
                </div>
                {charge.PackageName && (
                  <div className="mt-1 truncate text-[10px] font-semibold uppercase text-slate-500">
                    {charge.PackageName}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-semibold ${statusDetails.textClassName}`}
                >
                  {statusDetails.icon}
                  <span className="truncate">{statusDetails.label}</span>
                </div>
                {statusDate && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                    <BsCalendar3 size={10} />
                    <span className="truncate">{statusDate}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Tooltip title="Open">
                  <Button
                    type="text"
                    size="small"
                    aria-label="Open result"
                    icon={<BiBookOpen size={16} />}
                    onClick={() => handleOpen(charge)}
                  />
                </Tooltip>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
