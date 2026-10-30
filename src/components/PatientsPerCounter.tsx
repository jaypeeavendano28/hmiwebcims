import { FC, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PostData } from '../helpers';
import useAppStore from '../store';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TAppointments, TQueueDetail } from '../types';
import {
  Button,
  Dropdown,
  Form,
  Input,
  MenuProps,
  Modal,
  Radio,
  Select,
  Space,
  Tag,
  Tooltip,
  notification,
} from 'antd';
import { BsCheckLg, BsClipboardCheck, BsMegaphoneFill } from 'react-icons/bs';
import Calling from './calling';
import { BiEdit, BiNotepad } from 'react-icons/bi';
import { Link, useRouter } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { FaUpload } from 'react-icons/fa6';
import { GiMedicines } from 'react-icons/gi';
import { PiQueueLight } from 'react-icons/pi';
import RequestForMedicines from './RequestForMedicines';
import { psychologyDepartmentId } from './psychology/psychologyForm';

type Props = {
  CounterCode?: string;
  DepartmentId?: number;
  DepartmentName?: string;
  DateFrom: string;
  DateTo: string;
  Station: string;
  isDone: boolean;
  MemberNo: string;
  Name: string;
  IsMobile: boolean;
  Compact?: boolean;
  CompletedStatus?: string;
  ItemId?: number;
};

const statusTagColors: Record<string, string> = {
  A: 'processing',
  C: 'blue',
  D: 'success',
  E: 'warning',
  O: 'error',
  W: 'default',
};

type ProcedureStatusFormValues = {
  Status?: string;
  StatusRemarks?: string;
};

const procedureStatusOptions = ['DONE', 'TO FOLLOW', 'DEFERRED', 'CANCELLED'];
const consultationCounterCodes = [
  'CONCARDIO',
  'CONDERMA',
  'CONEENT',
  'CONFAMMEN',
  'CONGASTRO',
  'CONINTMED',
  'CONOPTHA',
  'CONORTHO',
  'CONPEDIA',
  'CONSUR',
  'CONPULMPO',
  'CONSULTATION',
  'PHYS',
];
const consultationDepartmentId = 1043;
const rehabilitationCounterCodes = ['REHAB'];
const resultCounterCodes = [
  'LAB',
  'XRAY',
  'ULT',
  'CARDIO',
  'PSYCH',
  'PSYCHO',
  'PSYCHOLOGY',
  ...rehabilitationCounterCodes,
  ...consultationCounterCodes,
];
const isConsultationCounter = (counterCode?: string) =>
  consultationCounterCodes.includes(String(counterCode ?? '').trim());
const isRehabilitationCounter = (counterCode?: string) =>
  rehabilitationCounterCodes.includes(String(counterCode ?? '').trim());
const isConsultationDepartment = (
  departmentId?: unknown,
  departmentName?: string,
) =>
  Number(departmentId) === consultationDepartmentId ||
  String(departmentName ?? '')
    .trim()
    .toUpperCase()
    .includes('CONSULTATION');
const isRehabilitationDepartment = (departmentName?: string) =>
  String(departmentName ?? '')
    .trim()
    .toUpperCase()
    .includes('REHAB');
const isPsychologyCounter = (counterCode?: string) =>
  ['PSYCH', 'PSYCHO', 'PSYCHOLOGY'].includes(
    String(counterCode ?? '').trim().toUpperCase(),
  );
const isPsychologyDepartment = (departmentId?: unknown, departmentName?: string) =>
  Number(departmentId) === psychologyDepartmentId ||
  String(departmentName ?? '').trim().toUpperCase().includes('PSYCHOLOGY');
const allQueueDetailsOption = 0;
const normalizeStatusText = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

const resultBlockedStatuses = new Set(['DEFERRED', 'CANCELLED']);

const getProcedureStatus = (patient: any) =>
  normalizeStatusText(patient?.ChargeStatus) || 'NOT SET';

const isDeferredQueueOrProcedure = (patient: any) =>
  normalizeStatusText(patient.Status) === 'E' ||
  normalizeStatusText(patient.StatusDesc) === 'DEFERRED' ||
  normalizeStatusText(patient.StatusDescription) === 'DEFERRED' ||
  normalizeStatusText(patient.ChargeStatus) === 'DEFERRED';

const isResultBlockedProcedure = (patient: any) =>
  resultBlockedStatuses.has(getProcedureStatus(patient));

const getVisibleQueueDetails = (details: TQueueDetail[]) =>
  details.filter((detail) => !isDeferredQueueOrProcedure(detail));

const canOpenResultFromQueue = (
  data: any,
  counterCode?: string,
  departmentName?: string,
  departmentId?: number,
) => {
  if (!data || isResultBlockedProcedure(data)) {
    return false;
  }

  const effectiveCounterCode = String(
    data.CounterCode ?? data.QCounter ?? counterCode ?? '',
  ).trim();

  return (
    resultCounterCodes.includes(effectiveCounterCode) ||
    isConsultationCounter(effectiveCounterCode) ||
    isRehabilitationCounter(effectiveCounterCode) ||
    isPsychologyCounter(effectiveCounterCode) ||
    isPsychologyDepartment(data.DepartmentId ?? data.fk_Departments_Id, data.DepartmentName) ||
    isPsychologyDepartment(departmentId, departmentName) ||
    isConsultationDepartment(
      data.DepartmentId ?? data.fk_Departments_Id,
      data.DepartmentName,
    ) ||
    isConsultationDepartment(departmentId, departmentName) ||
    isRehabilitationDepartment(departmentName) ||
    isRehabilitationDepartment(data.DepartmentName)
  );
};

const PatientsPerCounter: FC<Props> = ({
  CounterCode,
  DepartmentId,
  DepartmentName,
  DateFrom,
  DateTo,
  Station,
  isDone,
  MemberNo,
  Name,
  IsMobile,
  Compact = false,
  CompletedStatus,
  ItemId,
}) => {
  const [showRequest, setShowRequest] = useState(false);
  const router = useRouter();
  const [selectedRecord, setSelectedRecord] = useState<any | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [pendingQueueDetails, setPendingQueueDetails] = useState<
    TQueueDetail[]
  >([]);
  const [selectedQueueDetailId, setSelectedQueueDetailId] = useState<
    number | undefined
  >();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusRecord, setStatusRecord] = useState<TAppointments>();
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
  const [queueingFollowUpChargeId, setQueueingFollowUpChargeId] = useState<
    number | undefined
  >();
  const [statusForm] = Form.useForm<ProcedureStatusFormValues>();
  const [IsSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(dayjs());
  const store = useAppStore();
  const queryClient = useQueryClient();
  const effectiveIsDone = IsMobile || isDone;

  const patientsQueryKey = [
    'patientsPerCounter',
    store.branchCode,
    CounterCode,
    DepartmentId,
    DateFrom,
    DateTo,
    effectiveIsDone,
    Name,
    MemberNo,
    IsMobile,
  ] as const;

  const patients = useQuery({
    queryKey: patientsQueryKey,
    queryFn: async () => {
      const useDepartmentView = DepartmentId !== undefined;
      const useProcedureCompletedList = isDone && !IsMobile && Station !== '0';
      const sp = IsMobile
        ? 'udp_GetMobileProceduresByDepartment'
        : useDepartmentView
          ? useProcedureCompletedList
            ? 'udp_GetCompletedProceduresByDepartment'
            : 'udp_GetPatientsPerDepartment'
          : useProcedureCompletedList
            ? 'udp_GetCompletedProcedures'
            : 'udp_GetPatientsPerCounter';
      const parameters = IsMobile
        ? {
            BranchCode: store.branchCode,
            DepartmentId: DepartmentId ?? 0,
            DateFrom,
            DateTo,
            UserId: store.userId,
            Name,
            MemberNo,
          }
        : useDepartmentView
          ? {
              BranchCode: store.branchCode,
              DepartmentId,
              ...(useProcedureCompletedList
                ? {}
                : { CounterCode: CounterCode ?? '' }),
              DateFrom,
              DateTo,
              Station,
              UserId: store.userId,
              IsDone: effectiveIsDone,
              Name,
              MemberNo,
              IsMobile,
            }
          : {
              BranchCode: store.branchCode,
              CounterCode,
              DateFrom,
              DateTo,
              IsDone: effectiveIsDone,
              Name,
              MemberNo,
              IsMobile,
            };
      const res = await PostData('GetRecords', {
        sp,
        parameters,
      });

      return res?.parameters.lst ?? [];
    },
    refetchOnWindowFocus: true,
  });

  const selectedItemId = Number(ItemId);
  const hasItemFilter = Number.isFinite(selectedItemId) && selectedItemId > 0;
  const rawListOfPatients = patients.data ?? [];
  const itemFilteredPatients = hasItemFilter
    ? rawListOfPatients.filter(
        (patient: any) =>
          Number(patient.ItemId ?? patient.fk_Items_Id) === selectedItemId,
      )
    : rawListOfPatients;
  const selectedCompletedStatus = normalizeStatusText(CompletedStatus);
  const listOfPatients = effectiveIsDone && selectedCompletedStatus
    ? itemFilteredPatients.filter(
        (patient: any) => getProcedureStatus(patient) === selectedCompletedStatus,
      )
    : itemFilteredPatients;

  const refreshPatientQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: patientsQueryKey,
        exact: true,
      }),
      queryClient.invalidateQueries({
        queryKey: ['patientPerCounter'],
      }),
    ]);
  };

  const getPositiveNumber = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
  };

  const hasProcedureResult = (data: TAppointments) => {
    if (typeof data.HasResult === 'boolean') return data.HasResult;
    if (data.HasResult !== undefined) return Number(data.HasResult) === 1;

    return getPositiveNumber(data.ResultId) > 0 || Boolean(data.DateRead);
  };

  const canSetProcedureStatus = (data: TAppointments) => {
    return (
      effectiveIsDone &&
      getPositiveNumber(data.ChargeId) > 0 &&
      !hasProcedureResult(data)
    );
  };

  const openSetProcedureStatus = (data: TAppointments) => {
    setStatusRecord(data);
    statusForm.setFieldsValue({
      Status: data.ChargeStatus?.trim() || undefined,
      StatusRemarks: data.ChargeStatusRemarks ?? '',
    });
    setShowStatusModal(true);
  };

  const handleSetProcedureStatus = async (
    values: ProcedureStatusFormValues,
  ) => {
    const chargeId = getPositiveNumber(statusRecord?.ChargeId);
    const queueDetailId = getPositiveNumber(statusRecord?.QueueDetailId);

    if (!chargeId) {
      notification.error({
        message: 'Procedure charge is missing.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setIsStatusSubmitting(true);
    try {
      const res = await PostData('SaveProcedureStatus', {
        ChargeId: chargeId,
        QueueDetailId: queueDetailId || undefined,
        Status: values.Status,
        StatusRemarks: values.StatusRemarks,
        QCounter: statusRecord?.CounterCode ?? CounterCode,
      });

      if (res?.status === 1) {
        notification.success({
          message: 'Successfully Saved!',
          placement: 'topRight',
          duration: 3,
        });
        setShowStatusModal(false);
        setStatusRecord(undefined);
        statusForm.resetFields();
        await refreshPatientQueries();
        return;
      }

      notification.error({
        message: res?.message ?? 'Unable to set procedure status.',
        placement: 'topRight',
        duration: 5,
      });
    } catch (error: any) {
      notification.error({
        message: error?.message ?? 'Unable to set procedure status.',
        placement: 'topRight',
        duration: 5,
      });
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const handleSendFollowUpToQueue = async (data: TAppointments) => {
    const appointmentId = getPositiveNumber(
      (data as TAppointments & { fk_Appointments_Id?: number })
        .fk_Appointments_Id,
    );
    const chargeId = getPositiveNumber(data.ChargeId ?? data.Id);
    const itemId = getPositiveNumber(data.ItemId);

    if (!appointmentId || !chargeId || !itemId) {
      notification.error({
        message: 'The mobile follow-up procedure is incomplete.',
        placement: 'topRight',
        duration: 4,
      });
      return;
    }

    setQueueingFollowUpChargeId(chargeId);
    try {
      const res = await PostData('follow-up', {
        AppointmentId: appointmentId,
        ChargeId: chargeId,
        ItemId: itemId,
      });

      if (res?.status !== 1) {
        throw new Error(res?.message ?? 'Unable to send follow-up to queue.');
      }

      notification.success({
        message: res.message ?? 'Follow-up sent to queue.',
        placement: 'topRight',
        duration: 4,
      });
      await refreshPatientQueries();
    } catch (error) {
      notification.error({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to send follow-up to queue.',
        placement: 'topRight',
        duration: 5,
      });
    } finally {
      setQueueingFollowUpChargeId(undefined);
    }
  };

  const confirmSendFollowUpToQueue = (data: TAppointments) => {
    Modal.confirm({
      title: 'Send Follow-up to Queue?',
      content:
        'This mobile procedure will be added to its department queue. Continue?',
      okText: 'Yes',
      cancelText: 'No',
      centered: true,
      onOk: () => handleSendFollowUpToQueue(data),
    });
  };

  const handleCall = async (
    data: any,
    options: { openResultAfterAccept?: boolean } = {},
  ) => {
    setIsSubmitting(true);

    try {
      const valuesToSave = {
        ...data,
        Username: store.username,
        Counter: data.CounterName,
        QNo: data.QueueNo,
        Code: data.CounterCode,
        fk_Appointments_Id: data.fk_Appointments_Id,
        ElapseTime: '',
        Station,
      };

      const res = await PostData('CallCounter', valuesToSave);
      if (!res) {
        return;
      }

      if (res.status === 2) {
        const visibleDetails = getVisibleQueueDetails(res.parameters ?? []);

        if (visibleDetails.length === 0) {
          notification.warning({
            message: 'This queue has no pending procedures.',
            placement: 'topRight',
            duration: 3,
          });
          await refreshPatientQueries();
          return;
        }

        if (visibleDetails.length === 1) {
          await handleCall({
            ...data,
            Status: 'C',
            QueueDetailId: visibleDetails[0].QueueDetailId,
          });
          return;
        }

        setSelectedRecord({ ...data, Status: 'C' });
        setPendingQueueDetails(visibleDetails);
        setSelectedQueueDetailId(undefined);
        setShowProcedureModal(true);
        return;
      }

      if (res.status === 1) {
        const responseDetailId =
          res.parameters?.QueueDetailId ??
          res.parameters?.queueDetailId ??
          data.QueueDetailId;
        const activeRecord = {
          ...data,
          ...(res.parameters ?? {}),
          Id: data.Id,
          QueueDetailId: responseDetailId,
          CurrentQueueDetailId: responseDetailId,
        };

        if (data.Status === 'C') {
          setSelectedRecord(activeRecord);
          setShowModal(true);
        } else if (data.Status === 'O') {
          setSelectedRecord({});
          setShowModal(false);
        } else if (data.Status === 'A') {
          setSelectedRecord(activeRecord);
          setShowModal(false);
          if (options.openResultAfterAccept) {
            if (activeRecord.AllProcedures) {
              openProcedureSelectionWorkspace(activeRecord);
            } else {
              openProcedureWorkspace(activeRecord);
            }
          }
        }
        await refreshPatientQueries();
        queryClient.invalidateQueries({
          queryKey: ['patientsPerCounter'],
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 5,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error?.message ?? 'Unable to update the queue.',
        placement: 'topRight',
        duration: 5,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginCall = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await PostData('GetPendingQueueDetails', {
        QueueId: data.Id,
      });

      if (!res || res.status !== 1) {
        notification.error({
          message: res?.message ?? 'Unable to load pending procedures.',
          placement: 'topRight',
          duration: 5,
        });
        return;
      }

      const details: TQueueDetail[] = getVisibleQueueDetails(
        res.parameters ?? [],
      );
      if (details.length === 0) {
        notification.warning({
          message: 'This queue has no pending procedures.',
          placement: 'topRight',
          duration: 3,
        });
        await refreshPatientQueries();
        return;
      }

      if (details.length > 1) {
        setSelectedRecord({ ...data, Status: 'C' });
        setPendingQueueDetails(details);
        setSelectedQueueDetailId(undefined);
        setShowProcedureModal(true);
        return;
      }

      const queueDetailId =
        details[0]?.QueueDetailId ?? (details[0] as any)?.queueDetailId;
      await handleCall({
        ...data,
        Status: 'C',
        QueueDetailId: queueDetailId,
      });
    } catch (error: any) {
      notification.error({
        message: error?.message ?? 'Unable to load pending procedures.',
        placement: 'topRight',
        duration: 5,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const items: MenuProps['items'] = [
    {
      key: 'A',
      label: 'Attending',
      onClick: () => {
        void handleCall(
          { ...selectedRecord, Status: 'A' },
          {
            openResultAfterAccept: canOpenResultFromQueue(
              selectedRecord,
              CounterCode,
              DepartmentName,
              DepartmentId,
            ),
          },
        );
      },
    },
    {
      key: 'D',
      label: 'Done',
      onClick: (e) => {
        void handleCall({ ...selectedRecord, Status: e.key });
      },
    },
    {
      key: 'E',
      label: 'Deferred',
      onClick: (e) => {
        void handleCall({ ...selectedRecord, Status: e.key });
      },
    },
    {
      key: 'O',
      label: 'Out When Called',
      onClick: (e) => {
        void handleCall({ ...selectedRecord, Status: e.key });
      },
    },
    {
      key: 'W',
      label: 'Waiting',
      onClick: (e) => {
        void handleCall({ ...selectedRecord, Status: e.key });
      },
    },
  ];
  const openResultLocation = (locationOptions: any) => {
    void router.navigate(locationOptions);
  };
  const handleLabResult = (data: any) => {
    openResultLocation({
      to: '/laboratoryresults/$Id',
      params: {
        Id: data.fk_Appointments_Id.toString(),
      },
      search: {
        templateId: Number(data.LabTemplateId ?? 0),
        chargeId: Number(data.ChargeId ?? 0),
      },
    });
  };

  const handleXrayResult = (data: any) => {
    openResultLocation({
      to: '/xrayresult/$Id',
      params: {
        Id: data.fk_Appointments_Id.toString(),
      },
      search: {
        chargeId: Number(data.ChargeId ?? 0),
      },
    });
  };

  const handlePsychologyResult = (data: any) => {
    openResultLocation({
      to: '/psychologyresult/$Id',
      params: { Id: data.fk_Appointments_Id.toString() },
      search: { chargeId: Number(data.ChargeId ?? 0) },
    });
  };

  const handleCardioResult = (data: any) => {
    // router.navigate({
    //   to: '/cardioresult/$Id',
    //   params: {
    //     Id: data.fk_Appointments_Id,
    //   },
    // });

    openResultLocation({
      to: '/cardiologyresult/$Id',
      params: {
        Id: data.fk_Appointments_Id.toString(),
      },
      search: {
        exam: data.Exam,
        chargeId: Number(data.ChargeId ?? 0),
        resultId: Number(data.ResultId ?? 0),
      },
    });
  };

  const handleUltrasoundResult = (data: any) => {
    openResultLocation({
      to: '/ultrasound/$Id',
      params: {
        Id: data.fk_Appointments_Id.toString(),
      },
      search: {
        chargeId: Number(data.ChargeId ?? 0),
      },
    });
  };

  const handleConsultationResult = (data: any) => {
    openResultLocation({
      to: '/consultation/$Id',
      params: {
        Id: data.fk_Appointments_Id.toString(),
      },
      search: {
        chargeId: Number(data.ChargeId ?? 0),
      },
    });
  };

  const handleRehabilitationResult = (data: any) => {
    openResultLocation({
      to: '/patientexamrecord/$Id',
      params: {
        Id: data.fk_Appointments_Id.toString(),
      },
      search: {
        chargeId: Number(data.ChargeId ?? 0),
      },
    });
  };

  const openProcedureWorkspace = (data: any) => {
    const counterCode = data.CounterCode ?? CounterCode;
    if (
      isPsychologyCounter(counterCode) ||
      isPsychologyDepartment(DepartmentId, DepartmentName) ||
      isPsychologyDepartment(data.DepartmentId ?? data.fk_Departments_Id, data.DepartmentName)
    ) {
      handlePsychologyResult(data);
      return;
    }
    if (
      isRehabilitationCounter(counterCode) ||
      isRehabilitationDepartment(DepartmentName) ||
      isRehabilitationDepartment(data.DepartmentName)
    ) {
      handleRehabilitationResult(data);
      return;
    }

    if (
      isConsultationCounter(counterCode) ||
      isConsultationDepartment(DepartmentId, DepartmentName) ||
      isConsultationDepartment(
        data.DepartmentId ?? data.fk_Departments_Id,
        data.DepartmentName,
      )
    ) {
      handleConsultationResult(data);
      return;
    }

    switch (counterCode) {
      case 'LAB':
        handleLabResult(data);
        break;
      case 'XRAY':
        handleXrayResult(data);
        break;
      case 'CARDIO':
        handleCardioResult(data);
        break;
      case 'ULT':
        handleUltrasoundResult(data);
        break;
    }
  };

  const openProcedureSelectionWorkspace = (data: any) => {
    const appointmentId = data.fk_Appointments_Id?.toString();

    if (!appointmentId) {
      return;
    }

    const counterCode = data.CounterCode ?? CounterCode;
    if (
      isPsychologyCounter(counterCode) ||
      isPsychologyDepartment(DepartmentId, DepartmentName) ||
      isPsychologyDepartment(data.DepartmentId ?? data.fk_Departments_Id, data.DepartmentName)
    ) {
      openResultLocation({
        to: '/psychologyresult/$Id',
        params: { Id: appointmentId },
      });
      return;
    }
    if (
      isRehabilitationCounter(counterCode) ||
      isRehabilitationDepartment(DepartmentName) ||
      isRehabilitationDepartment(data.DepartmentName)
    ) {
      openResultLocation({
        to: '/patientexamrecord/$Id',
        params: {
          Id: appointmentId,
        },
      });
      return;
    }

    if (
      isConsultationCounter(counterCode) ||
      isConsultationDepartment(DepartmentId, DepartmentName) ||
      isConsultationDepartment(
        data.DepartmentId ?? data.fk_Departments_Id,
        data.DepartmentName,
      )
    ) {
      openResultLocation({
        to: '/consultation/$Id',
        params: {
          Id: appointmentId,
        },
      });
      return;
    }

    switch (counterCode) {
      case 'LAB':
        openResultLocation({
          to: '/laboratoryresults/$Id',
          params: {
            Id: appointmentId,
          },
        });
        break;
      case 'XRAY':
        openResultLocation({
          to: '/xrayresult/$Id',
          params: {
            Id: appointmentId,
          },
        });
        break;
      case 'CARDIO':
        openResultLocation({
          to: '/cardiologyresult/$Id',
          params: {
            Id: appointmentId,
          },
        });
        break;
      case 'ULT':
        openResultLocation({
          to: '/ultrasound/$Id',
          params: {
            Id: appointmentId,
          },
        });
        break;
    }
  };
  const actionBodyElapseTime = (data: TAppointments) => {
    if (data.Status === 'D') return data.ElapseTime ?? '-';
    const elapsedStart =
      data.ElapsedStart ?? (IsMobile ? data.AppointmentDate : data.DateAdded);
    if (!elapsedStart) return '-';

    return formatLiveElapsed(elapsedStart);
  };

  const formatLiveElapsed = (elapsedStart?: string) => {
    if (!elapsedStart) return '-';

    const dateAdded = dayjs(elapsedStart);
    if (!dateAdded.isValid()) return '-';

    const elapsedSeconds = Math.max(now.diff(dateAdded, 'second'), 0);
    const days = Math.floor(elapsedSeconds / 86400);
    const hours = Math.floor((elapsedSeconds % 86400) / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours
        .toString()
        .padStart(2, '0')} hr`;
    }

    if (hours > 0) {
      return `${hours} hr ${minutes.toString().padStart(2, '0')} min`;
    }

    return `${minutes} min ${seconds.toString().padStart(2, '0')} sec`;
  };

  const actionBodyStatusElapsed = (data: TAppointments) => {
    if (!data.SetStatusDate || data.Status === 'D') {
      return null;
    }

    return (
      <div className="mt-1 text-[10px] font-semibold leading-none text-slate-500">
        {formatLiveElapsed(data.SetStatusDate)}
      </div>
    );
  };

  // const handleUploadDocument = async (data: TAppointments) => {
  //   const appointmentId = Number((data as any).fk_Appointments_Id ?? 0);
  //   let patientId = Number(data.fk_PatientInformation_Id ?? 0);

  //   if (appointmentId <= 0) {
  //     notification.error({
  //       message: 'Unable to identify appointment for document upload.',
  //       placement: 'topRight',
  //       duration: 3,
  //     });
  //     return;
  //   }

  //   try {
  //     if (patientId <= 0) {
  //       const res = await PostData('GetRecords', {
  //         sp: 'udp_GetPatientInformationByAppointmentId',
  //         parameters: {
  //           AppointmentId: appointmentId,
  //         },
  //       });

  //       patientId = Number(res?.parameters?.lst?.[0]?.Id ?? 0);
  //     }

  //     if (patientId <= 0) {
  //       throw new Error('Unable to identify patient for document upload.');
  //     }

  //     router.navigate({
  //       to: '/uploaddocuments/$Id',
  //       params: {
  //         Id: String(patientId),
  //       },
  //       search: {
  //         appointmentId,
  //         departmentId: DepartmentId,
  //       },
  //     });
  //   } catch (error: any) {
  //     notification.error({
  //       message: error.message,
  //       placement: 'topRight',
  //       duration: 3,
  //     });
  //   }
  // };

  const actionBodyTemplate = (data: TAppointments) => {
    const rowCounterCode = data.CounterCode ?? CounterCode;
    const appointmentId = String((data as any).fk_Appointments_Id ?? '');
    const isConsultationResult =
      isConsultationCounter(rowCounterCode) ||
      isConsultationDepartment(DepartmentId, DepartmentName) ||
      isConsultationDepartment(
        (data as any).DepartmentId ?? (data as any).fk_Departments_Id,
        (data as any).DepartmentName,
      );
    const isRehabilitationResult =
      isRehabilitationCounter(rowCounterCode) ||
      isRehabilitationDepartment(DepartmentName) ||
      isRehabilitationDepartment((data as any).DepartmentName);
    const isPsychologyResult =
      isPsychologyCounter(rowCounterCode) ||
      isPsychologyDepartment(DepartmentId, DepartmentName) ||
      isPsychologyDepartment(
        (data as any).DepartmentId ?? (data as any).fk_Departments_Id,
        (data as any).DepartmentName,
      );
    const hasResultWorkspace =
      resultCounterCodes.includes(rowCounterCode ?? '') ||
      isConsultationResult ||
      isRehabilitationResult ||
      isPsychologyResult;
    const resultBlocked = isResultBlockedProcedure(data);
    const chargeId = getPositiveNumber(data.ChargeId ?? data.Id);
    const canQueueMobileFollowUp =
      IsMobile &&
      getProcedureStatus(data) === 'TO FOLLOW' &&
      !Boolean(data.HasActiveQueue);
    const canChangeProcedureStatus =
      canSetProcedureStatus(data) && (!hasResultWorkspace || resultBlocked);
    const resultTooltip = resultBlocked
      ? `${data.ChargeStatus} procedure cannot have a result.`
      : 'Result';
    const resultButton = <Button type="primary" icon={<BiNotepad />} />;
    const disabledResultButton = (
      <Tooltip title={resultTooltip}>
        <Button type="primary" icon={<BiNotepad />} disabled />
      </Tooltip>
    );

    return (
      <Space>
        {!IsMobile && !effectiveIsDone && (
          <Tooltip title="Call">
            <Button
              type="primary"
              icon={<BsMegaphoneFill />}
              onClick={() => {
                void beginCall(data);
              }}
              className="text-center"
              loading={IsSubmitting}
              disabled={
                data.CurrentQStatus === 'A' ||
                data.cantCall ||
                isDeferredQueueOrProcedure(data)
              }
            />
          </Tooltip>
        )}
        {!IsMobile && !effectiveIsDone && (
          <Tooltip title="Change Status">
            <Dropdown menu={{ items }} placement="top" trigger={['click']}>
              <Button
                type="primary"
                icon={<BsClipboardCheck />}
                onClick={() => {
                  setSelectedRecord(data);
                }}
              />
            </Dropdown>
          </Tooltip>
        )}
        {canChangeProcedureStatus && (
          <Tooltip
            title={resultBlocked ? 'Change procedure status' : 'Set status'}
          >
            <Button
              type="primary"
              icon={<BiEdit />}
              onClick={() => openSetProcedureStatus(data)}
              loading={isStatusSubmitting}
            />
          </Tooltip>
        )}
        {canQueueMobileFollowUp && (
          <Tooltip title="Send Follow-up to Queue">
            <Button
              type="primary"
              icon={<PiQueueLight />}
              loading={queueingFollowUpChargeId === chargeId}
              disabled={queueingFollowUpChargeId !== undefined}
              onClick={() => confirmSendFollowUpToQueue(data)}
            />
          </Tooltip>
        )}
        {isPsychologyResult && effectiveIsDone && resultBlocked && disabledResultButton}
        {isPsychologyResult && effectiveIsDone && !resultBlocked && (
          <Tooltip title={resultTooltip}>
            <Link
              to="/psychologyresult/$Id"
              params={{ Id: appointmentId }}
              search={{ chargeId: Number(data.ChargeId ?? 0) }}
            >
              {resultButton}
            </Link>
          </Tooltip>
        )}
        {rowCounterCode === 'LAB' &&
          effectiveIsDone &&
          resultBlocked &&
          disabledResultButton}
        {rowCounterCode === 'LAB' && effectiveIsDone && !resultBlocked && (
          <>
            <Tooltip title={resultTooltip}>
              <Link
                to="/laboratoryresults/$Id"
                params={{
                  Id: appointmentId,
                }}
                search={{
                  templateId: Number(data.LabTemplateId ?? 0),
                  chargeId: Number(data.ChargeId ?? 0),
                }}
              >
                {resultButton}
              </Link>
            </Tooltip>
          </>
        )}
        {rowCounterCode === 'XRAY' &&
          effectiveIsDone &&
          resultBlocked &&
          disabledResultButton}
        {rowCounterCode === 'XRAY' && effectiveIsDone && !resultBlocked && (
          <>
            <Tooltip title={resultTooltip}>
              <Link
                to="/xrayresult/$Id"
                params={{
                  Id: appointmentId,
                }}
                search={{
                  chargeId: Number(data.ChargeId ?? 0),
                }}
              >
                {resultButton}
              </Link>
            </Tooltip>
          </>
        )}

        {rowCounterCode === 'ULT' &&
          effectiveIsDone &&
          resultBlocked &&
          disabledResultButton}
        {rowCounterCode === 'ULT' && effectiveIsDone && !resultBlocked && (
          <>
            <Tooltip title={resultTooltip}>
              <Link
                to="/ultrasound/$Id"
                params={{
                  Id: appointmentId,
                }}
                search={{
                  chargeId: Number(data.ChargeId ?? 0),
                }}
              >
                {resultButton}
              </Link>
            </Tooltip>
          </>
        )}
        {rowCounterCode === 'CARDIO' &&
          effectiveIsDone &&
          resultBlocked &&
          disabledResultButton}
        {rowCounterCode === 'CARDIO' && effectiveIsDone && !resultBlocked && (
          <>
            <Tooltip title={resultTooltip}>
              <Link
                to="/cardiologyresult/$Id"
                params={{
                  Id: appointmentId,
                }}
                search={{
                  exam: data.Exam,
                  chargeId: Number(data.ChargeId ?? 0),
                  resultId: Number(data.ResultId ?? 0),
                }}
              >
                {resultButton}
              </Link>
            </Tooltip>
          </>
        )}
        {isConsultationResult &&
          effectiveIsDone &&
          resultBlocked &&
          disabledResultButton}
        {isConsultationResult && effectiveIsDone && !resultBlocked && (
          <Tooltip title={resultTooltip}>
            <Link
              to="/consultation/$Id"
              params={{
                Id: appointmentId,
              }}
              search={{
                chargeId: Number(data.ChargeId ?? 0),
              }}
            >
              {resultButton}
            </Link>
          </Tooltip>
        )}
        {isRehabilitationResult &&
          effectiveIsDone &&
          resultBlocked &&
          disabledResultButton}
        {isRehabilitationResult && effectiveIsDone && !resultBlocked && (
          <Tooltip title={resultTooltip}>
            <Link
              to="/patientexamrecord/$Id"
              params={{
                Id: appointmentId,
              }}
              search={{
                chargeId: Number(data.ChargeId ?? 0),
              }}
            >
              {resultButton}
            </Link>
          </Tooltip>
        )}
        {(rowCounterCode === 'DIA' || rowCounterCode === 'AMB') && (
          <>
            <Tooltip title="Request for Medicines">
              <Button
                type="primary"
                icon={<GiMedicines />}
                onClick={() => handleRequest(data)}
              />
            </Tooltip>
          </>
        )}
        <Tooltip title="Upload Document">
          <Link
            to="/uploaddocuments/$Id"
            params={{
              Id: data.fk_PatientInformation_Id?.toString() || '',
            }}
            search={{
              appointmentId: appointmentId?.toString() || '',
              departmentId: DepartmentId,
            }}
          >
            <Button
              type="primary"
              icon={<FaUpload />}
              onClick={() => console.log('Upload Document clicked', data)}
            />
          </Link>
        </Tooltip>

        {/* {data.Status === 'D' && <BsCheckLg size={32} color="green" />} */}

        {data.WithMer === 'Y' && (
          <Tooltip title="MER is available">
            <BsCheckLg size={32} color="green" />
          </Tooltip>
        )}
      </Space>
    );
  };
  const descriptionsRowTemplate = (data: any) => {
    return (
      <div className="whitespace-normal break-words px-4 py-2 font-normal leading-5 text-gray-600">
        {data.Descriptions}
      </div>
    );
  };
  const statusBodyTemplate = (data: any) => {
    const statusDescription = data.StatusDesc ?? data.StatusDescription ?? '-';
    const color = statusTagColors[data.Status] ?? 'default';

    return (
      <div className="inline-flex flex-col items-start">
        <Tag color={color} className="m-0 font-semibold">
          {statusDescription}
        </Tag>
        {actionBodyStatusElapsed(data)}
      </div>
    );
  };
  const completedStatusBodyTemplate = (data: TAppointments) => {
    const chargeStatus = getProcedureStatus(data);
    const color =
      chargeStatus === 'DONE'
        ? 'success'
        : chargeStatus === 'TO FOLLOW'
          ? 'warning'
          : chargeStatus === 'DEFERRED'
            ? 'warning'
            : chargeStatus === 'CANCELLED'
              ? 'error'
            : 'default';

    return (
      <Tag color={color} className="m-0 px-2 text-[10px] font-bold uppercase">
        {chargeStatus === 'DONE' && <BsCheckLg className="mr-1 inline" />}
        {chargeStatus}
      </Tag>
    );
  };
  const formatProcedureWait = (dateQueued?: string) => {
    if (!dateQueued) return null;

    const queuedAt = dayjs(dateQueued);
    if (!queuedAt.isValid()) return null;

    const elapsedMinutes = Math.max(now.diff(queuedAt, 'minute'), 0);
    if (elapsedMinutes < 60) {
      return `${elapsedMinutes} min waiting`;
    }

    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    return `${hours} hr ${minutes.toString().padStart(2, '0')} min waiting`;
  };
  const packageBodyTemplate = (data: TAppointments) =>
    data.IsPackage ? (
      <span className="font-semibold text-blue-700">✓ Yes</span>
    ) : (
      <span className="font-semibold text-red-600">✕ No</span>
    );
  const handleRequest = (data: any) => {
    setSelectedRecord(data);
    setShowRequest(true);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const expandedDescriptionRows = listOfPatients.filter(
    (patient: any) => patient.Descriptions,
  );

  return (
    <div className="cardBackGround">
      <DataTable
        value={listOfPatients}
        loading={patients.isFetching}
        paginator={Compact}
        rows={Compact ? 10 : undefined}
        rowsPerPageOptions={Compact ? [10, 25, 50] : undefined}
        filterDisplay="row"
        emptyMessage="No Records!"
        stripedRows
        scrollable={Compact}
        size={Compact ? 'small' : 'normal'}
        // rowExpansionTemplate={rowExpansionTemplate}
        // expandedRows={expandedRows as any}
        // onRowToggle={(e) => setExpandedRows(e.data as any)}
        rowExpansionTemplate={Compact ? undefined : descriptionsRowTemplate}
        expandedRows={Compact ? undefined : (expandedDescriptionRows as any)}
        tableStyle={{
          fontSize: Compact ? '13px' : '14px',
          fontWeight: 'bold',
          minWidth: Compact ? '1180px' : undefined,
        }}
      >
        {Compact && (
          <Column
            field="AppointmentDate"
            header="APNT DATE"
            sortable
            body={(data) => (
              <span className="text-blue-700">
                {data.AppointmentDate
                  ? dayjs(data.AppointmentDate).format('MMM DD, YYYY')
                  : '-'}
              </span>
            )}
          />
        )}
        {Compact && (
          <Column
            field="Descriptions"
            header="EXAMINATION"
            sortable
            body={(data) => (
              <span className="font-medium">{data.Descriptions ?? '-'}</span>
            )}
          />
        )}
        {Compact && (
          <Column
            field="IsPackage"
            header="PACKAGE"
            sortable
            body={packageBodyTemplate}
          />
        )}
        {Compact && (
          <Column
            field="Name"
            header="PATIENT NAME"
            sortable
            body={(data) => (
              <span className="uppercase">{data.Name ?? '-'}</span>
            )}
          />
        )}
        {Compact && (
          <Column
            field="CompanyName"
            header="COMPANY"
            sortable
            body={(data) => (
              <span className="font-medium italic">
                {data.CompanyName || '-'}
              </span>
            )}
          />
        )}
        {Compact && (
          <Column
            field="BranchName"
            header="BRANCH"
            sortable
            body={(data) => (
              <span className="font-semibold text-blue-700">
                {data.BranchName || data.BranchCode || '-'}
              </span>
            )}
          />
        )}
        {Compact && (
          <Column
            field="MemberNo"
            header="CONTRACT #"
            sortable
            body={(data) => (
              <span className="font-semibold text-blue-700">
                {data.MemberNo || '-'}
              </span>
            )}
          />
        )}
        {Compact && (
          <Column
            field="ChargeStatusDate"
            header="DATE DONE"
            sortable
            body={(data) =>
              data.ChargeStatusDate
                ? dayjs(data.ChargeStatusDate).format('MMM DD, YYYY')
                : '-'
            }
          />
        )}
        {Compact && (
          <Column
            field="ChargeStatus"
            header="STATUS"
            body={completedStatusBodyTemplate}
          />
        )}
        {Compact && (
          <Column
            field="action"
            header="ACTION"
            body={(data) => actionBodyTemplate(data)}
            frozen
            alignFrozen="right"
          />
        )}
        {!Compact && (
          <Column
            field="action"
            header="Action"
            body={(data) => actionBodyTemplate(data)}
          />
        )}
        {!Compact && (
          <Column
            field="AppointmentDate"
            header="Appointment Date"
            filter
            body={(data) =>
              data.AppointmentDate
                ? dayjs(data.AppointmentDate).format('MMM D, YYYY')
                : '-'
            }
          />
        )}
        {!Compact && <Column field="Name" header="Name" filter />}
        {!Compact && (
          <Column
            field="CurrentCounterAndStatus"
            header="Current Counter"
            hidden={isDone}
            filter
          />
        )}
        {!Compact && <Column field="QueueNo" header="Queue No." filter />}
        {!Compact && <Column field="MemberNo" header="Member No." filter />}
        {!Compact && !IsMobile && (
          <Column
            field="StatusDesc"
            header="Status"
            filter
            body={(data) => statusBodyTemplate(data)}
          />
        )}
        {!Compact && IsMobile && (
          <Column
            field="ChargeStatus"
            header="Status"
            filter
            body={completedStatusBodyTemplate}
          />
        )}
        {!Compact && (
          <Column
            hidden={!isDone}
            field="DateCompleted"
            header="Date Completed"
            body={(data) =>
              data.DateCompleted
                ? dayjs(data.DateCompleted).format('MMM D, YYYY')
                : '-'
            }
          />
        )}
        {!Compact && (
          <Column
            hidden={isDone}
            field="ElapseTime"
            header="Elapsed Time"
            body={(data) => actionBodyElapseTime(data)}
          />
        )}
      </DataTable>
      <Modal
        open={showStatusModal}
        destroyOnClose
        title={`Set status for ${statusRecord?.Descriptions ?? 'procedure'}`}
        footer={false}
        onCancel={() => {
          setShowStatusModal(false);
          setStatusRecord(undefined);
          statusForm.resetFields();
        }}
        width={500}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleSetProcedureStatus}
        >
          <Form.Item
            name="Status"
            label="Status"
            rules={[
              {
                required: true,
                message: 'Status is required!',
              },
            ]}
          >
            <Select
              options={procedureStatusOptions.map((status) => ({
                value: status,
                label: status,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="StatusRemarks"
            label="Remarks"
            normalize={(value) =>
              typeof value === 'string' ? value.toUpperCase() : value
            }
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    ['DEFERRED', 'CANCELLED'].includes(
                      getFieldValue('Status'),
                    ) &&
                    !String(value ?? '').trim()
                  ) {
                    return Promise.reject('Remarks is required!');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isStatusSubmitting}>
            Submit
          </Button>
        </Form>
      </Modal>
      <Modal
        open={showProcedureModal}
        title={`Select procedure for ${selectedRecord?.QueueNo ?? 'queue'}`}
        okText="Call selected procedure"
        confirmLoading={IsSubmitting}
        okButtonProps={{ disabled: selectedQueueDetailId === undefined }}
        onCancel={() => {
          setShowProcedureModal(false);
          setSelectedQueueDetailId(undefined);
        }}
        onOk={() => {
          if (selectedQueueDetailId === undefined) return;
          const isAllProcedures =
            selectedQueueDetailId === allQueueDetailsOption;
          setShowProcedureModal(false);
          void handleCall({
            ...selectedRecord,
            Status: 'C',
            QueueDetailId: isAllProcedures ? undefined : selectedQueueDetailId,
            AllProcedures: isAllProcedures,
          });
        }}
      >
        <Radio.Group
          className="w-full"
          value={selectedQueueDetailId}
          onChange={(event) => setSelectedQueueDetailId(event.target.value)}
        >
          <Space direction="vertical" className="w-full">
            <Radio value={allQueueDetailsOption}>
              <div>
                <div>All procedures</div>
                <div className="text-xs font-normal text-gray-500">
                  Call every pending procedure for this queue
                </div>
              </div>
            </Radio>
            {getVisibleQueueDetails(pendingQueueDetails).map((detail) => {
              const detailId =
                detail.QueueDetailId ?? (detail as any).queueDetailId;
              const dateQueued =
                detail.DateQueued ?? (detail as any).dateQueued;
              const procedureWait = formatProcedureWait(dateQueued);
              return (
                <Radio key={detailId} value={detailId}>
                  <div>
                    <div>
                      {detail.Description ??
                        (detail as any).description ??
                        `Charge ${detail.ChargeId ?? (detail as any).chargeId}`}
                    </div>
                    {procedureWait && (
                      <div className="text-xs font-normal text-gray-500">
                        Queued {dayjs(dateQueued).format('MMM D, h:mm A')} ·{' '}
                        {procedureWait}
                      </div>
                    )}
                  </div>
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </Modal>
      <Modal
        open={showModal}
        destroyOnClose
        closable={false}
        maskClosable={false}
        keyboard={false}
        okText="Accept"
        cancelText="Cancel"
        footer={false}
      >
        <Calling size={200} />
        <div className="font-bold text-2xl text-center">
          Calling-{selectedRecord?.QueueNo}
        </div>
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            type="primary"
            danger
            onClick={() => {
              void handleCall({ ...selectedRecord, Status: 'O' });
              setShowModal(false);
            }}
          >
            Out When Called
          </Button>
          <Button
            type="primary"
            onClick={() => {
              if (Station === '1') {
                void handleCall({ ...selectedRecord, Status: 'A' });
              }

              setShowModal(false);
            }}
          >
            Accept
          </Button>
          {canOpenResultFromQueue(
            selectedRecord,
            CounterCode,
            DepartmentName,
            DepartmentId,
          ) && (
            <Tooltip title="Accept and open result">
              <Button
                type="primary"
                icon={<BiNotepad />}
                onClick={() => {
                  if (Station === '1') {
                    void handleCall(
                      { ...selectedRecord, Status: 'A' },
                      { openResultAfterAccept: true },
                    );
                  }

                  setShowModal(false);
                }}
              >
                Accept & Result
              </Button>
            </Tooltip>
          )}
        </div>
      </Modal>
      <Modal
        open={showRequest}
        destroyOnClose
        onCancel={() => setShowRequest(false)}
        footer={false}
        width={window.innerWidth - 100}
      >
        <RequestForMedicines
          Name={selectedRecord?.Name}
          AppointmentId={selectedRecord?.fk_Appointments_Id}
        />
      </Modal>
    </div>
  );
};

export default PatientsPerCounter;
