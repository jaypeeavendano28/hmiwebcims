import { createFileRoute, useRouter } from '@tanstack/react-router';
import useAppStore from '../../store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/userAuth';
import { notification } from 'antd';
import {
  TCounters,
  TCurrentDepartment,
  TQCalling,
  TQCounters,
} from '../../types';
import { PostData } from '../../helpers';
import dayjs from 'dayjs';
import logo from '../../assets/logo.jpg';

export const Route = createFileRoute('/_authenticated/queuing/$Code')({
  component: () => <Queuing />,
});

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const rowsPerDepartment = 8;

const formatCounterQueue = (counter: TQCounters) => {
  const isSameAsToday = counter.DateAdded
    ? dayjs(counter.DateAdded).format('YYYYMMDD') === dayjs().format('YYYYMMDD')
    : false;

  return counter.CurrentQ && isSameAsToday ? counter.CurrentQ : '--';
};

const getStatusClassName = (status?: string) =>
  status?.toUpperCase().includes('DONE')
    ? 'text-cyan-300'
    : 'text-white';

const DepartmentQueue = ({
  currentDepartment,
}: {
  currentDepartment?: TCurrentDepartment;
}) => {
  const [patients, setPatients] = useState<any[]>([]);
  const branchCode = useAppStore((state) => state.branchCode);

  const handleGetPatients = useCallback(async () => {
    if (!currentDepartment?.CounterCode) {
      setPatients([]);
      return;
    }

    const res = await PostData('GetRecords', {
      sp: 'udp_GetPatientsPerCounter2',
      parameters: {
        BranchCode: branchCode,
        CounterCode: currentDepartment.CounterCode,
        DateFrom: dayjs().format('YYYYMMDD'),
        DateTo: dayjs().format('YYYYMMDD'),
      },
    });

    if (res) {
      setPatients(res.parameters.lst ?? []);
    }
  }, [branchCode, currentDepartment?.CounterCode]);

  useEffect(() => {
    handleGetPatients();
    const interval = setInterval(handleGetPatients, 5000);

    return () => clearInterval(interval);
  }, [handleGetPatients]);

  const visiblePatients = patients.slice(0, rowsPerDepartment);
  const fillerRows = Math.max(rowsPerDepartment - visiblePatients.length, 0);

  return (
    <section className="min-w-0">
      <div className="mb-2 truncate text-center text-3xl font-black uppercase leading-tight tracking-wide text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)] lg:text-4xl 2xl:text-6xl">
        {currentDepartment?.CounterName2 ?? currentDepartment?.CounterName ?? ''}
      </div>

      <div className="overflow-hidden rounded-sm border border-emerald-400/35 bg-emerald-700/25 shadow-[inset_0_0_24px_rgba(0,0,0,0.15)]">
        {visiblePatients.map((patient, index) => (
          <div
            className="grid h-16 grid-cols-[32%_68%] items-center border-b border-emerald-300/35 bg-emerald-800/35 px-1.5 last:border-b-0 lg:h-20 2xl:h-24"
            key={patient.Id ?? `${patient.QueueNo}-${index}`}
          >
            <div className="truncate text-2xl font-black leading-[1.18] text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)] lg:text-3xl 2xl:text-5xl">
              {patient.QueueNo}
            </div>
            <div
              className={`truncate text-2xl font-black leading-[1.18] drop-shadow-[2px_2px_0_rgba(0,0,0,0.28)] lg:text-3xl 2xl:text-5xl ${getStatusClassName(
                patient.StatusDesc,
              )}`}
            >
              {patient.StatusDesc}
            </div>
          </div>
        ))}

        {Array.from({ length: fillerRows }).map((_, index) => (
          <div
            className="h-16 border-b border-emerald-300/30 bg-emerald-700/15 last:border-b-0 lg:h-20 2xl:h-24"
            key={`empty-${index}`}
          />
        ))}
      </div>
    </section>
  );
};

const Queuing = () => {
  const [, setIsCalling] = useState(false);
  const isGettingCallsRef = useRef(false);
  const stopCallingRef = useRef(false);
  const { Code } = Route.useParams();
  const auth = useAuth();
  const branchCode = useAppStore((state) => state.branchCode);
  const setHideSideBar = useAppStore((state) => state.setHideSideBar);
  const router = useRouter();
  const [Counters, setCounters] = useState<TCounters[] | undefined>([]);
  const [queueCounters, setQueueCounters] = useState<TCurrentDepartment[]>([]);
  const [currentCounterIndex, setCurrentCounterIndex] = useState(0);
  const [now, setNow] = useState(dayjs());

  const handleGetCounterValues = useCallback(async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetReceptionCounters',
      parameters: { Grp: Code },
    });
    if (res) {
      setCounters(res.parameters.lst);
    }
  }, [Code]);

  const handleGetDepartments = useCallback(async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetPatientPerCounter2',
      parameters: {
        BranchCode: branchCode,
        DateFrom: dayjs().format('YYYYMMDD'),
        DateTo: dayjs().format('YYYYMMDD'),
        Station: Code,
      },
    });
    if (res) {
      setQueueCounters(res.parameters.lst ?? []);
    }
  }, [Code, branchCode]);

  useEffect(() => {
    setHideSideBar('Y');

    handleGetCounterValues();
    handleGetDepartments();

    const counterInterval = setInterval(handleGetCounterValues, 5000);
    const departmentInterval = setInterval(handleGetDepartments, 15000);
    const clockInterval = setInterval(() => setNow(dayjs()), 1000);

    return () => {
      clearInterval(counterInterval);
      clearInterval(departmentInterval);
      clearInterval(clockInterval);
    };
  }, [handleGetCounterValues, handleGetDepartments, setHideSideBar]);

  useEffect(() => {
    if (queueCounters.length <= 2) {
      setCurrentCounterIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentCounterIndex(
        (currentIndex) => (currentIndex + 2) % queueCounters.length,
      );
    }, 7000);

    return () => clearInterval(interval);
  }, [queueCounters.length]);

  const speak = useCallback(async (text: string) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }

    await new Promise<void>((resolve) => {
      const speech = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      if (voices.length > 0) {
        speech.voice = voices[0];
      }

      speech.rate = 0.7;
      speech.onend = () => resolve();
      speech.onerror = () => resolve();
      window.speechSynthesis.speak(speech);
    });
  }, []);

  const getCallText = (qCalling: TQCalling) => {
    if (qCalling.Station !== '2') {
      return `Patient ${qCalling.QNo} please proceed to ${qCalling.Counter}`;
    }

    return `Patient ${qCalling.QNo} please proceed to STATION 2`;
  };

  const handleGetQCalling = useCallback(async () => {
    if (isGettingCallsRef.current) {
      return;
    }

    isGettingCallsRef.current = true;

    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetQCalling',
        parameters: {},
      });

      const callingList: TQCalling[] = res?.parameters?.lst ?? [];
      setIsCalling(callingList.length > 0);

      for (const qCalling of callingList) {
        if (stopCallingRef.current) {
          break;
        }

        await speak(getCallText(qCalling));
        await delay(750);
      }
    } finally {
      isGettingCallsRef.current = false;
    }
  }, [speak]);

  useEffect(() => {
    stopCallingRef.current = false;

    const pollCalling = async () => {
      while (!stopCallingRef.current) {
        await handleGetQCalling();
        await delay(2500);
      }
    };

    pollCalling();

    return () => {
      stopCallingRef.current = true;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [handleGetQCalling]);

  useEffect(() => {
    if (!auth.isWithAccess(13)) {
      notification.error({
        message: 'Access denied-Queuing',
        placement: 'topRight',
        duration: 3,
      });
      router.navigate({
        to: '/',
      });
    }
  }, []);

  const visibleDepartments =
    queueCounters.length <= 2
      ? queueCounters
      : [
          queueCounters[currentCounterIndex],
          queueCounters[(currentCounterIndex + 1) % queueCounters.length],
        ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-emerald-600 text-white">
      <div className="grid h-full grid-cols-[300px_1fr] 2xl:grid-cols-[390px_1fr]">
        <aside className="flex min-h-0 flex-col border-r-4 border-emerald-700 bg-[#fff5f7] text-slate-900 shadow-2xl">
          <div className="flex h-24 items-center justify-center border-b border-rose-100 px-4 2xl:h-32">
            <img
              alt="HMI Care"
              className="max-h-20 w-full object-contain 2xl:max-h-28"
              src={logo}
            />
          </div>

          <div className="min-h-0 flex-1">
            {Counters?.map((counter: TQCounters) => (
              <div
                className="flex min-h-[92px] flex-col items-center justify-center border-b border-rose-100 bg-white/45 px-4 text-center 2xl:min-h-[118px]"
                key={counter.Code}
              >
                <div className="font-sans text-xl font-semibold uppercase tracking-normal text-slate-800 2xl:text-3xl">
                  {counter.Description}
                </div>
                <div className="mt-1 font-sans text-5xl font-bold leading-none tracking-normal text-blue-900 2xl:text-7xl">
                  {formatCounterQueue(counter)}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="relative min-w-0 bg-[radial-gradient(circle_at_25%_15%,rgba(72,255,145,0.35),transparent_28%),linear-gradient(135deg,#01c851_0%,#00a843_42%,#008b38_100%)] p-3 2xl:p-4">
          <div className="absolute right-4 top-3 flex items-center gap-6 text-lg font-black text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.35)] 2xl:right-6 2xl:text-2xl">
            <span>{now.format('MMMM D, YYYY')}</span>
            <span>{now.format('hh:mm:ss A')}</span>
          </div>

          <div className="flex h-full items-center pt-11 2xl:pt-12">
            <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 2xl:gap-4">
              {visibleDepartments.map((department) => (
                <DepartmentQueue
                  currentDepartment={department}
                  key={department.CounterCode}
                />
              ))}

              {visibleDepartments.length === 0 && (
                <div className="col-span-full flex h-[420px] items-center justify-center text-3xl font-black uppercase text-white/80">
                  No queue available
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
