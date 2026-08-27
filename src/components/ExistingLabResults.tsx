import { FC, useEffect, useState } from 'react';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';
import { Space, Tooltip } from 'antd';
import { BiBookOpen } from 'react-icons/bi';
import { BsCalendar3, BsCheckCircleFill, BsCircleFill } from 'react-icons/bs';
import dayjs from 'dayjs';

type Props = {
  AppointmentId?: number;
  handleOpen: (data: any) => void;
  Key?: string;
  activeChargeId?: number | string;
};

const ExistingLabResults: FC<Props> = ({
  AppointmentId,
  handleOpen,
  Key,
  activeChargeId,
}) => {
  const [labresults, setLabResults] = useState([]);
  const selectedChargeId = Number(activeChargeId ?? 0);

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

    return (
      packageValue === 'Y' || packageValue === 'TRUE' || packageValue === '1'
    );
  };

  const handleLabResults = async () => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentIdForResult',
        parameters: {
          AppointmentId: AppointmentId,
        },
      });
      if (res) {
        setLabResults(
          res.parameters.lst.filter(
            (charge: any) =>
              !isPackageCharge(charge.IsPackage) &&
              Number(charge.ResultId ?? 0) > 0 &&
              String(charge.QCounter ?? '').trim() === 'LAB',
          ),
        );
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
  }, [AppointmentId, Key]);
  return (
    <div>
      <div className="overflow-hidden rounded border border-slate-200 bg-white text-xs shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(92px,0.8fr)_40px] items-center gap-2 bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase text-slate-600">
          <span>Examination</span>
          <span>Status</span>
          <span className="text-right">Open</span>
        </div>

        {labresults.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs font-medium text-slate-400">
            No Records!
          </div>
        ) : (
          labresults.map((charge: any, index) => {
            const statusDetails = getStatusDetails(charge.Status);
            const statusDate = formatStatusDate(charge.StatusDate);
            const isActiveCharge =
              selectedChargeId > 0 && Number(charge.Id) === selectedChargeId;

            return (
              <div
                key={charge.Id ?? `${charge.Description}-${index}`}
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
                    {charge.Description || '-'}
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
                  {actionBodyTemplate(charge)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExistingLabResults;
