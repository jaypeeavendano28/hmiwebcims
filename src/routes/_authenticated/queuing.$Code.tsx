import { createFileRoute, useRouter } from '@tanstack/react-router';
import useAppStore from '../../store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/userAuth';
import { notification } from 'antd';
import Header from '../../components/Header';
import {
  TCounters,
  TCurrentDepartment,
  TQCalling,
  TQCounters,
} from '../../types';
import { PostData, isNullOrUndefinedOrBlank } from '../../helpers';
import dayjs from 'dayjs';
import Calling2 from '../../components/calling2';
import Attending from '../../components/attending';
import QPatients from '../../components/QPatients';

export const Route = createFileRoute('/_authenticated/queuing/$Code')({
  component: () => <Queuing />,
});

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const Queuing = () => {
  const [, setIsCalling] = useState(false);
  const isGettingCallsRef = useRef(false);
  const stopCallingRef = useRef(false);
  const { Code } = Route.useParams();
  const auth = useAuth();
  const store = useAppStore();
  const router = useRouter();
  const [Counters, setCounters] = useState<TCounters[] | undefined>([]);
  const [queueCounters, setQueueCounters] = useState<TCurrentDepartment[]>([]);
  const [currentCounterIndex, setCurrentCounterIndex] = useState(0);

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
        BranchCode: store.branchCode,
        DateFrom: dayjs().format('YYYYMMDD'),
        DateTo: dayjs().format('YYYYMMDD'),
        Station: Code,
      },
    });
    if (res) {
      setQueueCounters(res.parameters.lst ?? []);
    }
  }, [Code, store.branchCode]);

  useEffect(() => {
    store.setHideSideBar('Y');

    handleGetCounterValues();
    handleGetDepartments();

    const counterInterval = setInterval(handleGetCounterValues, 5000);
    const departmentInterval = setInterval(handleGetDepartments, 15000);

    return () => {
      clearInterval(counterInterval);
      clearInterval(departmentInterval);
    };
  }, []);

  useEffect(() => {
    if (queueCounters.length <= 1) {
      setCurrentCounterIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentCounterIndex(
        (currentIndex) => (currentIndex + 1) % queueCounters.length,
      );
    }, 5000);

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

  return (
    <div className="p-2 m-2 cardBackGround h-screen">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Header />

          {Counters?.map((v: TQCounters) => {
            const isSameAsToday = v.DateAdded
              ? dayjs(v.DateAdded).format('YYYYMMDD') ===
                dayjs().format('YYYYMMDD')
              : false;

            return (
              <div className="bg-orange-100 mt-2" key={v.Code}>
                <div className="text-3xl font-bold text-center">
                  {v.Description}
                </div>
                <div className="text-3xl font-bold text-center">
                  {!isNullOrUndefinedOrBlank(v.CurrentQ) && isSameAsToday && (
                    <div className="flex flex-row justify-center items-center">
                      {v.Status === 'C' ? (
                        <Calling2 size={64} />
                      ) : (
                        <Attending size={64} />
                      )}
                      {v.CurrentQ}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="col-span-8 bg-green-500 p-4 min-h-screen">
          <>
            {queueCounters[currentCounterIndex] && (
              <QPatients CurrentDepartment={queueCounters[currentCounterIndex]} />
            )}
          </>
        </div>
      </div>
    </div>
  );
};
