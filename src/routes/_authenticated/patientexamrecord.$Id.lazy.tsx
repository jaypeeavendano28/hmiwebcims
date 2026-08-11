import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  App,
  AutoComplete,
  Button,
  Divider,
  Form,
  Input,
  Select,
  Tabs,
  Tag,
  TimePicker,
  Tooltip,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { BiArrowBack } from 'react-icons/bi';
import { MdOutlinePrint, MdSave } from 'react-icons/md';
import ChargesPerPatient, {
  getResultBlockedMessage,
  isResultBlockedStatus,
} from '../../components/ChargesPerPatient';
import AddReqPhysician from '../../components/add-req-physician';
import Loading from '../../components/loading';
import { PostData } from '../../helpers';
import { getCompletedResultsSearch } from '../../helpers/resultNavigation';
import useAppStore from '../../store';
import {
  TAppointments,
  TBranches,
  TDoctors,
  TPatientExaminationRecord,
} from '../../types';
import PatientInfoHeader from '../../components/PatientInfoHeader';

export const Route = createLazyFileRoute(
  '/_authenticated/patientexamrecord/$Id',
)({
  component: () => <PatientExaminationRecord />,
});

type PatExamFieldType = {
  processedBy: string;
  therapist: string;
  msu: string;
  reqPhysician: number;
  diagnosis: string;
  opanOr: string;
  timeIn: string;
  timeOut: string;
  remarks: string;
};

type ExistingRehabResultsProps = {
  PatientId?: number;
  AppointmentId?: number;
  reloadKey: string;
  handleOpen: (result: TPatientExaminationRecord) => void;
};

const isDev = import.meta.env.DEV;
const apiRoot = String(
  isDev ? import.meta.env.VITE_DEV_API : import.meta.env.VITE_PROD_API,
).replace(/\/$/, '');
const rehabCounters = ['REHAB'];

const ExistingRehabResults = ({
  PatientId,
  AppointmentId,
  reloadKey,
  handleOpen,
}: ExistingRehabResultsProps) => {
  const results = useQuery<TPatientExaminationRecord[]>({
    queryKey: [
      'patient-examination-results',
      PatientId,
      AppointmentId,
      reloadKey,
    ],
    enabled: Number(PatientId ?? 0) > 0,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPatientExaminationResultsByPatientId',
        parameters: {
          PatientId,
          AppointmentId,
        },
      });

      return res?.parameters?.lst ?? [];
    },
  });

  if (results.isLoading) {
    return <Loading size={48} />;
  }

  if (!results.data?.length) {
    return (
      <div className="rounded border border-dashed border-slate-200 px-3 py-6 text-center text-xs font-medium text-slate-400">
        No existing rehab results.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.data.map((result) => (
        <button
          key={result.Id}
          type="button"
          onClick={() => handleOpen(result)}
          className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
        >
          <div className="font-bold uppercase text-sky-800">
            {result.ChargeDescription || 'Rehabilitation Result'}
          </div>
          <div className="mt-1 truncate text-slate-500">
            {result.Diagnosis || result.Remarks || '-'}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Result ID: {result.Id}
          </div>
        </button>
      ))}
    </div>
  );
};

const PatientExaminationRecord = () => {
  const { Id } = Route.useParams();
  const search = Route.useSearch() as { chargeId?: string | number };
  const appointmentId = Number(Id);
  const requestedChargeId = Number(search.chargeId ?? 0);
  const selectedChargeHandledRef = useRef('');

  const router = useRouter();
  const store = useAppStore();
  const { notification, message } = App.useApp();
  const [form] = Form.useForm<PatExamFieldType>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultId, setResultId] = useState(0);
  const [chargeId, setChargeId] = useState(0);
  const [chargeDescription, setChargeDescription] = useState('');
  const [activeCharge, setActiveCharge] = useState<any>();
  const [selected, setSelected] = useState<TPatientExaminationRecord>();
  const [reloadKey, setReloadKey] = useState(Math.random().toString());
  const isResultSubmitBlocked = isResultBlockedStatus(activeCharge?.Status);
  const resultSubmitBlockedMessage = getResultBlockedMessage(activeCharge);

  const appointmentDetails = useQuery<TAppointments>({
    queryKey: ['patient-exam-appointment-details', appointmentId],
    enabled: appointmentId > 0,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentDetails',
        parameters: { Id: appointmentId },
      });

      return res?.parameters?.lst?.[0];
    },
  });

  // const appointmentImage = useQuery<string | null>({
  //   queryKey: ['patient-exam-appointment-image', appointmentId],
  //   enabled: appointmentId > 0,
  //   queryFn: async () => {
  //     const res = await PostData('GetRecords', {
  //       sp: 'udp_GetAppointmentImage',
  //       parameters: { AppointmentId: appointmentId },
  //     });

  //     return res?.parameters?.lst?.[0]?.Image ?? null;
  //   },
  // });

  const branches = useQuery<TBranches[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await PostData('GetRecords2', {
        sp: 'udp_GetBranches',
        parameters: {},
      });

      return res?.parameters?.lst ?? [];
    },
  });

  const doctors = useQuery<TDoctors[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await PostData('GetRecords2', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });

      return res?.parameters?.lst ?? [];
    },
  });

  const branchOptions = (branches.data ?? []).map((branch) => ({
    value: branch.Code,
    label: branch.Name,
  }));
  const doctorOptions = (doctors.data ?? []).map((doctor) => ({
    value: doctor.Id,
    label: doctor.NameAndSpecialty || doctor.Name,
  }));

  const resetResult = (charge?: any) => {
    const nextChargeId = Number(charge?.Id ?? 0);
    setResultId(0);
    setChargeId(nextChargeId);
    setChargeDescription(charge?.Description ?? '');
    setSelected(undefined);
    form.resetFields();
    form.setFieldsValue({
      processedBy: store.branchCode,
      reqPhysician: charge?.fk_Doctors_Id || undefined,
    });
  };

  const populateResult = (result: TPatientExaminationRecord) => {
    setSelected(result);
    setResultId(Number(result.Id ?? 0));
    setChargeId(Number(result.fk_Charges_Id ?? 0));
    setChargeDescription(result.ChargeDescription ?? '');
    form.setFieldsValue({
      processedBy: result.fk_Branches_Code || store.branchCode,
      therapist: result.Therapist,
      msu: result.Msu,
      reqPhysician: result.fk_Doctors_Id,
      diagnosis: result.Diagnosis,
      opanOr: result.OrNo,
      timeIn: result.TimeIn
        ? (dayjs(result.TimeIn, 'HH:mm') as any)
        : undefined,
      timeOut: result.TimeOut
        ? (dayjs(result.TimeOut, 'HH:mm') as any)
        : undefined,
      remarks: result.Remarks,
    });
  };

  const handleOpenResult = async (id: number) => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPatientExamination',
        parameters: {
          AppointmentId: appointmentId,
          Id: id,
          ChargeId: null,
        },
      });
      const result = res?.parameters?.lst?.[0] as
        | TPatientExaminationRecord
        | undefined;

      if (!result) {
        notification.error({
          message: 'Patient examination result was not found.',
          placement: 'topRight',
        });
        return;
      }

      populateResult(result);
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
      });
    }
  };

  const handleSelectCharge = async (charge: any) => {
    setActiveCharge(charge);

    const existingResultId = Number(charge?.ResultId ?? 0);

    if (existingResultId > 0) {
      await handleOpenResult(existingResultId);
      return;
    }

    resetResult(charge);
  };

  const handleSave = async (values: PatExamFieldType) => {
    if (chargeId <= 0) {
      notification.warning({
        message: 'Select a rehabilitation procedure first.',
        placement: 'topRight',
      });
      return;
    }

    if (isResultSubmitBlocked) {
      notification.warning({
        message: resultSubmitBlockedMessage,
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    try {
      setIsProcessing(true);
      const payload: TPatientExaminationRecord = {
        Id: resultId,
        fk_Appointments_Id: appointmentId,
        fk_Charges_Id: chargeId,
        fk_Branches_Code: values.processedBy,
        Therapist: values.therapist,
        Msu: values.msu,
        fk_Doctors_Id: values.reqPhysician,
        Diagnosis: values.diagnosis,
        OrNo: values.opanOr,
        TimeIn: values.timeIn
          ? dayjs(values.timeIn).format('HH:mm')
          : undefined,
        TimeOut: values.timeOut
          ? dayjs(values.timeOut).format('HH:mm')
          : undefined,
        Remarks: values.remarks,
      };
      const res = await PostData('SavePatientExaminationRecord', payload);

      if (res.status !== 1) {
        notification.error({
          message: res.message,
          placement: 'topRight',
        });
        return;
      }

      const savedId = Number(res.parameters?.Id ?? resultId);
      setResultId(savedId);
      setSelected((current) => ({
        ...(current ?? payload),
        Id: savedId,
        fk_Appointments_Id: appointmentId,
        fk_Charges_Id: chargeId,
        ChargeDescription: chargeDescription,
        UpdatedBy: res.parameters?.UpdatedBy ?? current?.UpdatedBy,
        UpdatedDate: res.parameters?.DateUpdated ?? current?.UpdatedDate,
      }));
      setReloadKey(Math.random().toString());
      notification.success({
        message: 'Rehabilitation result saved.',
        placement: 'topRight',
      });
      await handleOpenResult(savedId);
    } catch (error) {
      console.log(error);
      message.error('An error occurred while submitting the form.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsProcessing(true);
      const response = await axios({
        url: `${apiRoot}/api/GenerateReport`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${store.tokenIdWebCims}`,
        },
        params: {
          ReportName: 'PatientExamination.rdl',
          AppointmentId: appointmentId,
          ResultId: resultId,
          BranchCode: store.branchCode,
        },
      });

      const data = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' }),
      );
      const anchor = document.createElement('a');
      anchor.href = data;
      anchor.target = '_blank';
      anchor.click();
      window.setTimeout(() => window.URL.revokeObjectURL(data), 60_000);
    } catch (error: any) {
      notification.error({
        message: error.response?.statusText || error.message,
        placement: 'topRight',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(requestedChargeId) || requestedChargeId <= 0) {
      return;
    }

    const requestKey = `${appointmentId}:${requestedChargeId}`;
    if (selectedChargeHandledRef.current === requestKey) return;
    selectedChargeHandledRef.current = requestKey;

    const openRequestedCharge = async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentIdForResult',
        parameters: { AppointmentId: appointmentId },
      });
      const charge = res?.parameters?.lst?.find(
        (item: any) => Number(item.Id) === requestedChargeId,
      );

      if (
        charge &&
        rehabCounters.includes(String(charge.QCounter ?? '').trim())
      ) {
        await handleSelectCharge(charge);
      }
    };

    void openRequestedCharge();
  }, [appointmentId, requestedChargeId]);

  const patient = appointmentDetails.data;
  const patientAge = [
    patient?.AgeYears ? `${patient.AgeYears}Y` : '',
    patient?.AgeMonths ? `${patient.AgeMonths}M` : '',
    patient?.AgeDays ? `${patient.AgeDays}D` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const company = patient?.HmoCompanyName || patient?.Company || '-';

  return (
    <div className="cardBackGround min-h-full">
      {appointmentDetails.isLoading ? (
        <Loading size={64} />
      ) : !patient ? (
        <div>Appointment record not found!</div>
      ) : (
        <>
          <PatientInfoHeader
            appointmentId={appointmentId}
            patientId={patient.fk_PatientInformation_Id}
            name={patient.Name}
            age={patientAge}
            sex={patient.Sex}
            appointmentNo={patient.AppointmentNo || Id}
            fields={[{ label: 'Company', value: company }]}
          />

          <Divider className="print:hidden">
            Rehabilitation Result
            {chargeDescription ? ` (${chargeDescription})` : ''}
          </Divider>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <aside className="min-w-0 lg:col-span-3">
              <div className="lg:sticky lg:top-2">
                <Button
                  className="mb-2"
                  icon={<BiArrowBack />}
                  onClick={() =>
                    router.navigate({
                      to: '/registeredpatients/$station',
                      params: { station: '1' },
                      search: getCompletedResultsSearch(),
                    })
                  }
                >
                  Back
                </Button>
                <Divider>Charges</Divider>
                <Tabs
                  defaultActiveKey="charges"
                  size="small"
                  items={[
                    {
                      key: 'charges',
                      label: 'Charges',
                      children: (
                        <ChargesPerPatient
                          AppointmentId={appointmentId}
                          handleNewResult={handleSelectCharge}
                          Key={reloadKey}
                          Counter={rehabCounters}
                          activeChargeId={chargeId}
                          onActiveChargeChange={setActiveCharge}
                        />
                      ),
                    },
                    {
                      key: 'results',
                      label: 'Existing Results',
                      children: (
                        <ExistingRehabResults
                          PatientId={patient.fk_PatientInformation_Id}
                          AppointmentId={appointmentId}
                          reloadKey={reloadKey}
                          handleOpen={(result) => handleOpenResult(result.Id)}
                        />
                      ),
                    },
                  ]}
                />
              </div>
            </aside>

            <main className="min-w-0 lg:col-span-9">
              {chargeId === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
                  <div>
                    <p className="text-base font-semibold text-slate-700">
                      Please click the rehab charge result first.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Select a rehabilitation charge on the left to load the
                      result form.
                    </p>
                  </div>
                </div>
              ) : (
                <Form<PatExamFieldType>
                  form={form}
                  layout="vertical"
                  onFinish={handleSave}
                  initialValues={{ processedBy: store.branchCode }}
                  scrollToFirstError
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {/* {appointmentImage.data && (
                        <img
                          src={appointmentImage.data}
                          alt=""
                          className="h-14 w-14 rounded object-cover"
                        />
                      )} */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="truncate text-base font-semibold text-slate-900">
                            Rehab Result for {chargeDescription || 'Procedure'}
                          </h1>
                          <Tag color={resultId > 0 ? 'success' : 'processing'}>
                            {resultId > 0 ? 'Saved' : 'New'}
                          </Tag>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Result ID: {resultId || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <section className="border-t-2 border-sky-500 bg-white">
                    <div className="border-b border-slate-200 px-3 py-2">
                      <h2 className="text-sm font-semibold text-slate-800">
                        Rehabilitation Details
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3 px-3 py-3 md:grid-cols-2">
                      <Form.Item
                        label="Processed By"
                        name="processedBy"
                        className="!mb-0"
                      >
                        <Select
                          showSearch
                          allowClear
                          optionFilterProp="label"
                          loading={branches.isLoading}
                          options={branchOptions}
                        />
                      </Form.Item>
                      <div className="flex items-end gap-x-1">
                        <Form.Item
                          label="Requesting Physician"
                          name="reqPhysician"
                          className="!mb-0 flex-grow"
                        >
                          <Select
                            showSearch
                            allowClear
                            optionFilterProp="label"
                            loading={doctors.isLoading}
                            options={doctorOptions}
                          />
                        </Form.Item>
                        <AddReqPhysician />
                      </div>
                      <Form.Item
                        label="Therapist"
                        name="therapist"
                        className="!mb-0"
                      >
                        <AutoComplete />
                      </Form.Item>
                      <Form.Item label="MSU" name="msu" className="!mb-0">
                        <AutoComplete />
                      </Form.Item>
                      <Form.Item
                        label="Time-in"
                        name="timeIn"
                        className="!mb-0"
                      >
                        <TimePicker
                          use12Hours
                          needConfirm={false}
                          format="h:mm A"
                          className="w-full"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Time-out"
                        name="timeOut"
                        className="!mb-0"
                      >
                        <TimePicker
                          use12Hours
                          needConfirm={false}
                          format="h:mm A"
                          className="w-full"
                        />
                      </Form.Item>
                      <Form.Item
                        label="OPAN/OR#"
                        name="opanOr"
                        className="!mb-0"
                      >
                        <Input />
                      </Form.Item>
                    </div>
                  </section>

                  <section className="mt-5 border-t-2 border-amber-500 bg-white">
                    <div className="border-b border-slate-200 px-3 py-2">
                      <h2 className="text-sm font-semibold text-slate-800">
                        Notes
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 px-3 py-3 lg:grid-cols-2">
                      <Form.Item
                        label="Diagnosis"
                        name="diagnosis"
                        className="!mb-0"
                      >
                        <TextArea rows={8} />
                      </Form.Item>
                      <Form.Item
                        label="Remarks"
                        name="remarks"
                        className="!mb-0"
                      >
                        <TextArea rows={8} />
                      </Form.Item>
                    </div>
                  </section>

                  <section className="mt-5 border-t border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs md:grid-cols-4">
                      <div>
                        <p className="font-semibold uppercase text-slate-500">
                          Added By
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {selected?.AddedBy || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase text-slate-500">
                          Date Added
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {selected?.DateAdded || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase text-slate-500">
                          Updated By
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {selected?.UpdatedBy || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase text-slate-500">
                          Date Updated
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {selected?.UpdatedDate || '-'}
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                    <Tooltip title={resultId > 0 ? '' : 'Save result first'}>
                      <Button
                        icon={<MdOutlinePrint />}
                        loading={isProcessing}
                        disabled={resultId === 0}
                        onClick={handlePrint}
                      >
                        Print Result
                      </Button>
                    </Tooltip>
                    <Button
                      htmlType="submit"
                      type="primary"
                      icon={<MdSave />}
                      loading={isProcessing}
                      disabled={isResultSubmitBlocked}
                    >
                      Save Result
                    </Button>
                  </div>
                </Form>
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
};
