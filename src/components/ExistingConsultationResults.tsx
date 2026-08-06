import { FC } from 'react';
import { Button, Empty, Tooltip } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BiBookOpen } from 'react-icons/bi';
import { PostData } from '../helpers';

type Props = {
  PatientId?: number;
  AppointmentId?: number;
  reloadKey?: string;
  handleOpen: (data: any) => void;
};

const ExistingConsultationResults: FC<Props> = ({
  PatientId,
  AppointmentId,
  reloadKey,
  handleOpen,
}) => {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: [
      'consultation-results-by-patient',
      PatientId,
      AppointmentId,
      reloadKey,
    ],
    enabled: Number(PatientId ?? 0) > 0,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetConsultationResultsByPatientId',
        parameters: {
          PatientId,
          AppointmentId,
        },
      });

      return res?.parameters?.lst ?? [];
    },
  });

  if (!isLoading && data.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No results" />;
  }

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white text-xs">
      <div className="grid grid-cols-[minmax(0,1fr)_32px] gap-2 bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase text-slate-600">
        <span>Consultation Result</span>
        <span />
      </div>
      {data.map((result, index) => (
        <div
          key={result.Id}
          className={`grid grid-cols-[minmax(0,1fr)_32px] items-center gap-2 border-t border-slate-100 px-3 py-2.5 ${
            index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase text-sky-800">
              {result.ChargeDescription || 'Consultation'}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              {result.SpecialistName || '-'}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {result.Started
                ? dayjs(result.Started).format('MM/DD/YYYY h:mm A')
                : '-'}
            </p>
          </div>
          <Tooltip title="Open result">
            <Button
              type="text"
              size="small"
              aria-label="Open result"
              icon={<BiBookOpen size={17} />}
              onClick={() => handleOpen(result)}
            />
          </Tooltip>
        </div>
      ))}
    </div>
  );
};

export default ExistingConsultationResults;
