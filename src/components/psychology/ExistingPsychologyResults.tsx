import { Button, Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { BiBookOpen } from 'react-icons/bi';
import { BsCalendar3, BsCheckCircleFill, BsCircleFill } from 'react-icons/bs';
import { PsychologyResult } from './psychologyForm';

type Props = {
  results: PsychologyResult[];
  charges: any[];
  loading: boolean;
  activeChargeId: number;
  onOpen: (result: PsychologyResult) => void;
};

const getStatusDetails = (status?: unknown) => {
  const value = String(status ?? '').trim();
  switch (value.toUpperCase()) {
    case 'DONE':
      return { label: 'Done', icon: <BsCheckCircleFill className="text-teal-600" />, textClassName: 'text-slate-700' };
    case 'TO FOLLOW':
      return { label: 'To Follow', icon: <BsCircleFill className="text-slate-500" size={9} />, textClassName: 'text-slate-600' };
    case 'DEFERRED':
      return { label: 'Deferred', icon: <BsCircleFill className="text-rose-500" size={9} />, textClassName: 'text-rose-600' };
    case 'CANCELLED':
      return { label: 'Cancelled', icon: <BsCircleFill className="text-red-600" size={9} />, textClassName: 'text-red-700' };
    default:
      return { label: value || 'N/A', icon: <BsCircleFill className="text-slate-300" size={9} />, textClassName: 'text-slate-400' };
  }
};

export default function ExistingPsychologyResults({
  results,
  charges,
  loading,
  activeChargeId,
  onOpen,
}: Props) {
  return (
    <Spin spinning={loading}>
      <div className="overflow-hidden rounded border border-slate-200 bg-white text-xs shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(92px,0.8fr)_40px] items-center gap-2 bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase text-slate-600">
          <span>Examination</span>
          <span>Status</span>
          <span className="text-right">Open</span>
        </div>

        {results.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs font-medium text-slate-400">
            {loading ? 'Loading results...' : 'No Records!'}
          </div>
        ) : (
          results.map((result, index) => {
            const charge = charges.find((item) => Number(item.Id) === Number(result.ChargeId));
            const statusDetails = getStatusDetails(charge?.Status);
            const interpretationDate = result.DateOfInterpretation;
            const statusDate = interpretationDate && dayjs(interpretationDate).isValid()
              ? dayjs(interpretationDate).format('MM/DD/YYYY')
              : '';
            const isActive = Number(result.ChargeId) === activeChargeId;

            return (
              <div
                key={result.Id}
                className={`grid grid-cols-[minmax(0,1.2fr)_minmax(92px,0.8fr)_40px] items-start gap-2 border-t px-3 py-3 transition-colors ${
                  isActive
                    ? 'border-sky-200 bg-sky-100/80 shadow-[inset_3px_0_0_#0284c7]'
                    : `border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`
                }`}
              >
                <div className="min-w-0">
                  <div className={`truncate text-[11px] font-bold uppercase ${isActive ? 'text-sky-950' : 'text-sky-800'}`}>
                    {result.ChargeDescription || charge?.Description || `Result ${result.Id}`}
                  </div>
                  <div className="mt-1 truncate text-[10px] font-semibold uppercase text-slate-500">
                    {result.FormType === 'LOCAL' ? 'LOCAL' : 'OFW'}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${statusDetails.textClassName}`}>
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
                      aria-label={`Open ${result.FormType === 'LOCAL' ? 'LOCAL' : 'OFW'} psychology result`}
                      icon={<BiBookOpen size={16} />}
                      onClick={() => onOpen(result)}
                    />
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Spin>
  );
}
