import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { BiArrowBack } from 'react-icons/bi';
import { MdOutlinePrint, MdSave, MdSearch } from 'react-icons/md';
import ChargesPerPatient, {
  getResultBlockedMessage,
  isResultBlockedStatus,
} from '../../components/ChargesPerPatient';
import AddReqPhysician from '../../components/add-req-physician';
import ExistingConsultationResults from '../../components/ExistingConsultationResults';
import SearchICD from '../../components/SearchICD';
import { PostData } from '../../helpers';
import useAppStore from '../../store';
import { TAppointments, TChart, TDoctors, TICd10 } from '../../types';
import { getCompletedResultsSearch } from '../../helpers/resultNavigation';
import PatientInfoHeader from '../../components/PatientInfoHeader';
import UploadDocumentButton from '../../components/UploadDocumentButton';

export const Route = createLazyFileRoute('/_authenticated/consultation/$Id')({
  component: () => <ConsultationResult />,
});

const isDev = import.meta.env.DEV;
const apiRoot = String(
  isDev ? import.meta.env.VITE_DEV_API : import.meta.env.VITE_PROD_API,
).replace(/\/$/, '');
const consultationCounters = [
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

const ConsultationResult = () => {
  const router = useRouter();
  const store = useAppStore();
  const [form] = Form.useForm<TChart>();
  const { Id } = Route.useParams();
  const search = Route.useSearch() as { chargeId?: string | number };
  const appointmentId = Number(Id);
  const requestedChargeId = Number(search.chargeId ?? 0);
  const selectedChargeHandledRef = useRef('');

  const [showIcdModal, setShowIcdModal] = useState(false);
  const [resultId, setResultId] = useState(0);
  const [chargeId, setChargeId] = useState(0);
  const [chargeDescription, setChargeDescription] = useState('');
  const [activeCharge, setActiveCharge] = useState<any>();
  const [selected, setSelected] = useState<TChart>();
  const [reloadKey, setReloadKey] = useState(Math.random().toString());
  const [isSaving, setIsSaving] = useState(false);
  const [isPrintingChart, setIsPrintingChart] = useState(false);
  const isResultSubmitBlocked = isResultBlockedStatus(activeCharge?.Status);
  const resultSubmitBlockedMessage = getResultBlockedMessage(activeCharge);

  const appointmentDetails = useQuery<TAppointments>({
    queryKey: ['consultation-appointment-details', appointmentId],
    enabled: appointmentId > 0,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentDetails',
        parameters: { Id: appointmentId },
      });

      return res?.parameters?.lst?.[0];
    },
  });

  const specialists = useQuery<TDoctors[]>({
    queryKey: ['consultation-specialists'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });

      return res?.parameters?.lst ?? [];
    },
  });

  const doctorOptions = (specialists.data ?? [])
    .filter((doctor) => doctor.Id !== undefined)
    .map((doctor) => ({
      value: doctor.Id!,
      label: doctor.NameAndSpecialty || doctor.Name || '',
    }));

  const resetResult = (charge?: any) => {
    const nextChargeId = Number(charge?.Id ?? 0);

    setResultId(0);
    setChargeId(nextChargeId);
    setChargeDescription(charge?.Description ?? '');
    setSelected(undefined);
    form.resetFields();
    form.setFieldsValue({
      Started: dayjs() as any,
      Ended: dayjs() as any,
      Specialist: charge?.fk_Doctors_Id || undefined,
      RequestingPhysician: charge?.fk_Doctors_Id || undefined,
    });
  };

  const populateResult = (result: TChart) => {
    setSelected(result);
    setResultId(Number(result.Id));
    setChargeId(Number(result.fk_Charges_Id ?? 0));
    setChargeDescription(result.ChargeDescription ?? '');
    form.setFieldsValue({
      Started: result.Started ? (dayjs(result.Started) as any) : undefined,
      Ended: result.Ended ? (dayjs(result.Ended) as any) : undefined,
      Specialist: result.Specialist,
      RequestingPhysician: result.RequestingPhysician,
      AssessmentDiagnosis: result.AssessmentDiagnosis,
      Icd10: result.Icd10,
      Ruv: result.Ruv,
      Planx: result.Planx,
    });
  };

  const handleOpenResult = async (id: number) => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChart',
        parameters: {
          AppointmentId: null,
          Id: id,
          ChargeId: null,
        },
      });
      const result = res?.parameters?.lst?.[0] as TChart | undefined;

      if (!result) {
        notification.error({
          message: 'Consultation result was not found.',
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

  const handleSubmit = async (values: TChart) => {
    if (chargeId <= 0) {
      notification.warning({
        message: 'Select a consultation procedure first.',
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
      setIsSaving(true);
      const res = await PostData('SaveChart', {
        ...values,
        Id: resultId,
        fk_Appointments_Id: appointmentId,
        fk_Charges_Id: chargeId,
        Started: dayjs(values.Started).format(),
        Ended: dayjs(values.Ended).format(),
      });

      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? 'Unable to save consultation result.',
          placement: 'topRight',
        });
        return;
      }

      const savedId = Number(res.parameters?.Id ?? resultId);
      setResultId(savedId);
      setSelected((current) => ({
        ...(current ?? values),
        Id: savedId,
        fk_Appointments_Id: appointmentId,
        fk_Charges_Id: chargeId,
        AddedBy: current?.AddedBy,
        DateAdded: current?.DateAdded,
        UpdatedBy: res.parameters?.UpdatedBy ?? current?.UpdatedBy,
        DateUpdated: res.parameters?.DateUpdated ?? current?.DateUpdated,
        ChargeDescription: chargeDescription,
      }));
      setReloadKey(Math.random().toString());
      notification.success({
        message: 'Consultation result saved.',
        placement: 'topRight',
      });

      await handleOpenResult(savedId);
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openPdf = (blob: Blob) => {
    const data = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = data;
    anchor.target = '_blank';
    anchor.click();
    window.setTimeout(() => window.URL.revokeObjectURL(data), 60_000);
  };

  const printReport = async (
    reportName: string,
    setLoading: (value: boolean) => void,
    includeResultId = false,
  ) => {
    try {
      setLoading(true);
      const response = await axios({
        url: `${apiRoot}/api/GenerateReport`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${store.tokenIdWebCims}`,
        },
        params: {
          ReportName: reportName,
          AppointmentId: appointmentId,
          BranchCode: store.branchCode,
          ...(includeResultId ? { ResultId: resultId } : {}),
        },
      });

      openPdf(new Blob([response.data], { type: 'application/pdf' }));
    } catch (error: any) {
      notification.error({
        message: error.response?.statusText || error.message,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIcdSelected = (icd: TICd10) => {
    form.setFieldsValue({
      Icd10: icd.ITEM_CODE,
      Ruv: icd.ITEM_DESC,
      AssessmentDiagnosis: icd.ITEM_DESC,
    });
    setShowIcdModal(false);
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

      if (charge && consultationCounters.includes(charge.QCounter)) {
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
  const formatAuditDate = (value?: Date) =>
    value && dayjs(value).isValid()
      ? dayjs(value).format('MM/DD/YYYY hh:mm A')
      : '-';

  return (
    <div className="cardBackGround min-h-full">
      <PatientInfoHeader
        appointmentId={appointmentId}
        patientId={patient?.fk_PatientInformation_Id}
        name={patient?.Name}
        age={patientAge}
        sex={patient?.Sex}
        appointmentNo={patient?.AppointmentNo || Id}
        fields={[{ label: 'Company', value: company }]}
      />

      <Divider className="print:hidden">
        Consultation Result
        {chargeDescription ? ` (${chargeDescription})` : ''}
      </Divider>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-3">
          <div className="lg:sticky lg:top-2">
            <Space wrap>
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
              <UploadDocumentButton
                patientId={patient?.fk_PatientInformation_Id}
                appointmentId={appointmentId}
                departmentId={activeCharge?.fk_Departments_Id}
              />
            </Space>
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
                      Counter={consultationCounters}
                      activeChargeId={chargeId}
                      onActiveChargeChange={setActiveCharge}
                    />
                  ),
                },
                {
                  key: 'results',
                  label: 'Existing Results',
                  children: (
                    <ExistingConsultationResults
                      PatientId={patient?.fk_PatientInformation_Id}
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
                  Please click the charge result first.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Select a consultation charge on the left to load the result
                  form.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-base font-semibold text-slate-900">
                      Consultation Result for {chargeDescription || 'Procedure'}
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

              <Form<TChart>
                id="consultation-result-form"
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                scrollToFirstError
              >
                <section className="border-t-2 border-sky-500 bg-white">
                  <div className="border-b border-slate-200 px-3 py-2">
                    <h2 className="text-sm font-semibold text-slate-800">
                      Encounter Details
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 px-3 py-3 md:grid-cols-2 xl:grid-cols-4">
                    <Form.Item
                      name="Specialist"
                      label="Specialist"
                      className="!mb-0"
                      rules={[
                        { required: true, message: 'Specialist is required.' },
                      ]}
                    >
                      <Select
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        options={doctorOptions}
                      />
                    </Form.Item>
                    <div className="flex items-end gap-x-1">
                      <Form.Item
                        name="RequestingPhysician"
                        label="Requesting Physician"
                        className="!mb-0 flex-grow"
                      >
                        <Select
                          showSearch
                          allowClear
                          optionFilterProp="label"
                          options={doctorOptions}
                        />
                      </Form.Item>
                      <AddReqPhysician />
                    </div>
                    <Form.Item
                      name="Started"
                      label="Started"
                      className="!mb-0"
                      rules={[{ required: true, message: 'Started is required.' }]}
                    >
                      <DatePicker
                        className="w-full"
                        format="MM/DD/YYYY hh:mm A"
                        showTime
                      />
                    </Form.Item>
                    <Form.Item
                      name="Ended"
                      label="Ended"
                      className="!mb-0"
                      rules={[{ required: true, message: 'Ended is required.' }]}
                    >
                      <DatePicker
                        className="w-full"
                        format="MM/DD/YYYY hh:mm A"
                        showTime
                      />
                    </Form.Item>
                  </div>
                </section>

                <section className="mt-5 border-t-2 border-amber-500 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                    <h2 className="text-sm font-semibold text-slate-800">
                      Clinical Notes
                    </h2>
                    <Tooltip title="Search ICD-10 / RVS">
                      <Button
                        size="small"
                        icon={<MdSearch />}
                        onClick={() => setShowIcdModal(true)}
                      >
                        ICD-10 / RVS
                      </Button>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-1 gap-4 px-3 py-3 lg:grid-cols-2">
                    <div className="min-w-0">
                      <Form.Item
                        name="AssessmentDiagnosis"
                        label="Assessment / Diagnosis"
                        className="!mb-3"
                        rules={[
                          {
                            required: true,
                            message: 'Assessment/Diagnosis is required.',
                          },
                        ]}
                      >
                        <Input.TextArea rows={8} />
                      </Form.Item>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Form.Item
                          name="Icd10"
                          label="ICD-10"
                          className="!mb-0"
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name="Ruv"
                          label="RVS / RUV"
                          className="!mb-0"
                        >
                          <Input />
                        </Form.Item>
                      </div>
                    </div>
                    <Form.Item name="Planx" label="Plan" className="!mb-0">
                      <Input.TextArea rows={12} />
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
                        {formatAuditDate(selected?.DateAdded)}
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
                        {formatAuditDate(selected?.DateUpdated)}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                  <Button
                    icon={<MdOutlinePrint />}
                    loading={isPrintingChart}
                    disabled={resultId === 0}
                    onClick={() =>
                      printReport('chart.rdl', setIsPrintingChart, true)
                    }
                  >
                    Print Result
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<MdSave />}
                    loading={isSaving}
                    disabled={isResultSubmitBlocked}
                  >
                    Save Result
                  </Button>
                </div>
              </Form>
            </>
          )}
        </main>
      </div>

      <Modal
        title="Search ICD-10 / RVS"
        open={showIcdModal}
        onCancel={() => setShowIcdModal(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <SearchICD handleClose={handleIcdSelected} />
      </Modal>
    </div>
  );
};
