import { useQuery } from '@tanstack/react-query';
import { Avatar } from 'antd';
import { PostData } from '../helpers';

type PatientInfoHeaderField = {
  label: string;
  value?: string | number | null;
  className?: string;
};

type PatientInfoHeaderProps = {
  appointmentId?: number | string | null;
  patientId?: number | string | null;
  name?: string | null;
  age?: string | null;
  sex?: string | null;
  appointmentNo?: string | number | null;
  fields?: PatientInfoHeaderField[];
  className?: string;
};

const getPositiveNumber = (value?: number | string | null) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};

const getInitials = (name?: string | null) => {
  const parts = String(name ?? '')
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return '?';
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const getAppointmentImage = async (
  appointmentId?: number | string | null,
  patientId?: number | string | null,
) => {
  const nextAppointmentId = getPositiveNumber(appointmentId);

  if (nextAppointmentId > 0) {
    const appointmentImage = await PostData('GetRecordsImages', {
      sp: 'udp_GetAppointmentImage',
      parameters: {
        AppointmentId: nextAppointmentId,
      },
    });

    const image = appointmentImage?.parameters?.lst?.[0]?.Image;

    if (image) {
      return image as string;
    }
  }

  const nextPatientId = getPositiveNumber(patientId);

  if (nextPatientId > 0) {
    const patientImage = await PostData('GetRecordsImages', {
      sp: 'udp_GetLastPatientImage',
      parameters: {
        PatientId: nextPatientId,
      },
    });

    return (patientImage?.parameters?.lst?.[0]?.Image as string) ?? null;
  }

  return null;
};

const PatientInfoHeader = ({
  appointmentId,
  patientId,
  name,
  age,
  sex,
  appointmentNo,
  fields = [],
  className = '',
}: PatientInfoHeaderProps) => {
  const patientImage = useQuery<string | null>({
    queryKey: ['patient-info-header-image', appointmentId, patientId],
    enabled: getPositiveNumber(appointmentId) > 0 || getPositiveNumber(patientId) > 0,
    queryFn: () => getAppointmentImage(appointmentId, patientId),
    staleTime: 60_000,
  });

  const headerFields = [
    {
      label: 'Name',
      value: name || '-',
      className: 'col-span-2 min-w-0 md:col-span-1 xl:col-span-2',
    },
    { label: 'Age', value: age || '-' },
    { label: 'Sex', value: sex || '-' },
    { label: 'Appointment No.', value: appointmentNo || '-' },
    ...fields,
  ];

  return (
    <section
      className={`flex flex-col gap-3 border-b border-slate-200 pb-3 text-sm md:flex-row md:items-center ${className}`}
    >
      <Avatar
        className="shrink-0 bg-slate-200 text-base font-semibold text-slate-700"
        shape="square"
        size={72}
        src={patientImage.data ?? undefined}
      >
        {getInitials(name)}
      </Avatar>
      <div className="grid flex-1 grid-cols-2 gap-x-5 gap-y-3 md:grid-cols-3 xl:grid-cols-6">
        {headerFields.map((field) => (
          <div key={field.label} className={field.className ?? 'min-w-0'}>
            <p className="text-slate-500">{field.label}</p>
            <p
              className="truncate font-semibold text-slate-900"
              title={String(field.value ?? '-')}
            >
              {field.value ?? '-'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PatientInfoHeader;
