import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tabs,
  notification,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { BiArrowBack } from 'react-icons/bi';
import ChargesPerPatient, {
  getResultBlockedMessage,
  isResultBlockedStatus,
} from '../../components/ChargesPerPatient';
import ExistingPsychologyResults from '../../components/psychology/ExistingPsychologyResults';
import PatientInfoHeader from '../../components/PatientInfoHeader';
import FinalizeForm from '../../components/FinalizeForm';
import {
  getPsychologyNarrative,
  getLocalPsychologyNarrative,
  getLocalRecommendedConclusion,
  intellectualLevels,
  localIntellectualLevels,
  localScoreGroups,
  LocalPsychologyScores,
  parseLocalPsychologyScores,
  parsePsychologyRatings,
  psychologyDepartmentId,
  psychologyTraitGroups,
  PsychologyRatings,
  PsychologyFormType,
  PsychologyResult,
  recommendationTypes,
} from '../../components/psychology/psychologyForm';
import UploadDocumentButton from '../../components/UploadDocumentButton';
import { PostData, blobToDataUrl } from '../../helpers';
import { getCompletedResultsSearch } from '../../helpers/resultNavigation';
import useAppStore from '../../store';
import { TAppointments, TDoctors, TMedtechs } from '../../types';

const apiRoot = String(
  import.meta.env.DEV ? import.meta.env.VITE_DEV_API : import.meta.env.VITE_PROD_API,
).replace(/\/$/, '');

export const Route = createLazyFileRoute('/_authenticated/psychologyresult/$Id')({
  component: PsychologyResultPage,
});

type PsychologyFormValues = {
  DateOfExamination?: Dayjs;
  DateOfInterpretation?: Dayjs;
  PsychologicalScreeningPurpose?: string;
  PsychologicalScreeningPurposeOther?: string;
  IntelligenceTest?: string;
  PersonalityTest?: string;
  OtherTests?: string;
  IntellectualLevel?: string;
  NarrativeReport?: string;
  Recommendation?: string;
  RecommendationType?: string;
  RecommendationDetails?: string;
  FurtherEvaluationDetails?: string;
  PsychologistId?: number;
  PreparedById?: number;
};

const ratingScale = [1, 2, 3, 4, 5, 6, 7];
const onlineResultType = 'PSYCHOLOGY';
const defaultRecommendationDetails =
  'There is no significant psychological and/or personality problems manifested to the client during the time of testing.';
const defaultNarrative = (type: PsychologyFormType, level?: string) =>
  type === 'LOCAL' ? getLocalPsychologyNarrative(level) : getPsychologyNarrative(level);

function PsychologyResultPage() {
  const router = useRouter();
  const store = useAppStore();
  const { Id } = Route.useParams();
  const search = Route.useSearch() as { chargeId?: string | number };
  const appointmentId = Number(Id);
  const requestedChargeId = Number(search.chargeId ?? 0);
  const autoSelectedCharge = useRef(0);
  const narrativeAutoFill = useRef(true);
  const [form] = Form.useForm<PsychologyFormValues>();
  const recommendation = Form.useWatch('Recommendation', { form, preserve: true });
  const screeningPurpose = Form.useWatch('PsychologicalScreeningPurpose', form);
  const [activeCharge, setActiveCharge] = useState<any>();
  const [chargeId, setChargeId] = useState(0);
  const [resultId, setResultId] = useState(0);
  const [ratings, setRatings] = useState<PsychologyRatings>({});
  const [localScores, setLocalScores] = useState<LocalPsychologyScores>({});
  const [formType, setFormType] = useState<PsychologyFormType>('LOCAL');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [chargesKey, setChargesKey] = useState('initial');
  const [printing, setPrinting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const recommendedConclusionText = formType === 'LOCAL'
    ? getLocalRecommendedConclusion(localScores.denial)
    : '';

  const appointment = useQuery<TAppointments>({
    queryKey: ['psychology-appointment', appointmentId],
    enabled: appointmentId > 0,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentDetails',
        parameters: { Id: appointmentId },
      });
      return res?.parameters?.lst?.[0];
    },
  });

  const charges = useQuery<any[]>({
    queryKey: ['psychology-charges', appointmentId],
    enabled: appointmentId > 0,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentIdForResult',
        parameters: { AppointmentId: appointmentId },
      });
      return res?.parameters?.lst ?? [];
    },
  });

  const results = useQuery<PsychologyResult[]>({
    queryKey: ['psychology-results', appointmentId],
    enabled: appointmentId > 0,
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPsychologyResults',
        parameters: { AppointmentId: appointmentId },
      });
      return res?.parameters?.lst ?? [];
    },
  });

  const onlineResultStatus = useQuery<boolean>({
    queryKey: ['psychology-online-result', resultId],
    enabled: resultId > 0,
    queryFn: async () => {
      const res = await PostData('GetPdfFileStatus', {
        ResultId: resultId,
        ResultType: onlineResultType,
      });
      if (res?.status !== 1) {
        throw new Error(res?.message || 'Unable to check online result status.');
      }
      return Boolean(res.parameters?.Shown);
    },
  });
  const isOnlineResultShown = onlineResultStatus.data === true;
  const onlineStatusUnavailable = resultId > 0 &&
    (!onlineResultStatus.isSuccess || onlineResultStatus.isFetching);
  const appointmentSavedFormType = results.data
    ?.filter((result) => result.FormType === 'LOCAL' || result.FormType === 'OFW')
    .sort((a, b) => b.Id - a.Id)[0]?.FormType;
  const savedFormType = resultId > 0
    ? results.data?.find((result) => result.Id === resultId)?.FormType ?? formType
    : appointmentSavedFormType;

  const psychologists = useQuery<TDoctors[]>({
    queryKey: ['psychology-doctors'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });
      return (res?.parameters?.lst ?? []).filter((doctor: TDoctors) => doctor.Psychologist);
    },
  });

  const psychometricians = useQuery<TMedtechs[]>({
    queryKey: ['psychology-psychometricians'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetListOfMedtechs',
        parameters: { Type: 'P' },
      });
      return res?.parameters?.lst ?? [];
    },
  });

  useEffect(() => {
    if (!appointment.data || chargeId) return;
    setFormType(String(appointment.data.AppointmentType ?? '').trim().toUpperCase() === 'OFW' ? 'OFW' : 'LOCAL');
  }, [appointment.data?.AppointmentType, chargeId]);

  useEffect(() => {
    if (!chargeId || resultId || !appointmentSavedFormType || formType === appointmentSavedFormType) return;
    setFormType(appointmentSavedFormType);
    form.setFieldValue('IntellectualLevel', undefined);
    if (narrativeAutoFill.current) {
      form.setFieldValue('NarrativeReport', defaultNarrative(appointmentSavedFormType));
    }
  }, [appointmentSavedFormType, chargeId, resultId, formType, form]);

  const resetForCharge = (charge: any) => {
    const nextFormType = appointmentSavedFormType ?? (
      String(appointment.data?.AppointmentType ?? '').trim().toUpperCase() === 'OFW' ? 'OFW' : 'LOCAL'
    );
    setShowFinalize(false);
    setActiveCharge(charge);
    setChargeId(Number(charge.Id));
    setResultId(0);
    setRatings({});
    setLocalScores({});
    setFormType(nextFormType);
    narrativeAutoFill.current = true;
    setDirty(false);
    form.resetFields();
    form.setFieldsValue({
      DateOfExamination: dayjs(),
      DateOfInterpretation: dayjs(),
      NarrativeReport: defaultNarrative(nextFormType),
      Recommendation: 'RECOMMENDED',
      RecommendationType: 'RECOMMENDED',
      RecommendationDetails: defaultRecommendationDetails,
    });
  };

  const openResult = (result: PsychologyResult, charge?: any) => {
    const resultFormType = result.FormType === 'LOCAL' ? 'LOCAL' : 'OFW';
    const generatedNarrative = defaultNarrative(resultFormType, result.IntellectualLevel);
    setShowFinalize(false);
    const matchingCharge = charge ?? charges.data?.find((item) => Number(item.Id) === result.ChargeId);
    setActiveCharge(matchingCharge);
    setChargeId(result.ChargeId);
    setResultId(result.Id);
    setRatings(parsePsychologyRatings(result.RatingsJson));
    setLocalScores(parseLocalPsychologyScores(result.LocalScoresJson));
    setFormType(resultFormType);
    narrativeAutoFill.current = !result.NarrativeReport || result.NarrativeReport === generatedNarrative;
    form.resetFields();
    form.setFieldsValue({
      DateOfExamination: result.DateOfExamination ? dayjs(result.DateOfExamination) : undefined,
      DateOfInterpretation: result.DateOfInterpretation ? dayjs(result.DateOfInterpretation) : undefined,
      PsychologicalScreeningPurpose: result.PsychologicalScreeningPurpose,
      PsychologicalScreeningPurposeOther: result.PsychologicalScreeningPurposeOther,
      IntelligenceTest: result.IntelligenceTest,
      PersonalityTest: result.PersonalityTest,
      OtherTests: result.OtherTests,
      IntellectualLevel: result.IntellectualLevel,
      NarrativeReport: result.NarrativeReport ?? generatedNarrative,
      Recommendation: result.Recommendation,
      RecommendationType: result.RecommendationType,
      RecommendationDetails: result.RecommendationDetails,
      FurtherEvaluationDetails: result.FurtherEvaluationDetails,
      PsychologistId: result.PsychologistId,
      PreparedById: result.PreparedById,
    });
    setDirty(false);
  };

  const selectCharge = (charge: any) => {
    const existing = results.data?.find((item) => Number(item.ChargeId) === Number(charge.Id));
    if (existing) {
      openResult(existing, charge);
    } else if (Number(charge.ResultId ?? 0) > 0) {
      notification.warning({ message: 'This charge is linked to another result. Open that result first.' });
    } else {
      resetForCharge(charge);
    }
  };

  useEffect(() => {
    if (requestedChargeId <= 0 || !appointment.data || !charges.data || !results.data ||
        autoSelectedCharge.current === requestedChargeId) return;
    const selected = charges.data.find(
      (charge) => Number(charge.Id) === requestedChargeId &&
        Number(charge.fk_Departments_Id) === psychologyDepartmentId,
    );
    if (selected) {
      autoSelectedCharge.current = requestedChargeId;
      selectCharge(selected);
    }
  }, [requestedChargeId, appointment.data, charges.data, results.data]);

  const saveResult = async (values: PsychologyFormValues) => {
    if (saving || deleting || finalizing || printing || onlineStatusUnavailable) return;
    if (isOnlineResultShown) {
      notification.warning({ message: 'Unshow the online result before submitting changes.' });
      return;
    }
    if (!chargeId || isResultBlockedStatus(activeCharge?.Status)) {
      notification.warning({ message: getResultBlockedMessage(activeCharge) });
      return;
    }
    if (formType === 'LOCAL' && localScoreGroups.some((group) =>
      group.scores.some((score) => localScores[score.code] === undefined))) {
      notification.warning({ message: 'Enter all Local BPI scores before saving.' });
      return;
    }

    setSaving(true);
    try {
      const res = await PostData('SavePsychologyResult', {
        ...values,
        Id: resultId,
        AppointmentId: appointmentId,
        ChargeId: chargeId,
        DateOfExamination: values.DateOfExamination?.format('YYYY-MM-DD'),
        DateOfInterpretation: values.DateOfInterpretation?.format('YYYY-MM-DD'),
        FormType: formType,
        NarrativeReport: values.NarrativeReport,
        Ratings: ratings,
        LocalScores: formType === 'LOCAL' ? localScores : {},
      });
      if (res?.status !== 1) throw new Error(res?.message || 'Unable to save the Psychology result.');

      const savedId = Number(res.parameters?.Id ?? 0);
      setResultId(savedId);
      setDirty(false);
      setChargesKey(String(Date.now()));
      const refreshedCharges = await charges.refetch();
      const refreshedResults = await results.refetch();
      const saved = refreshedResults.data?.find((result) => result.Id === savedId);
      if (saved) {
        openResult(
          saved,
          refreshedCharges.data?.find((charge) => Number(charge.Id) === chargeId),
        );
      }
      notification.success({ message: 'Psychology result saved.' });
    } catch (error) {
      notification.error({ message: error instanceof Error ? error.message : 'Unable to save result.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteResult = async () => {
    if (!resultId || saving || deleting || finalizing || printing) return;
    setDeleting(true);
    try {
      const res = await PostData('DeletePsychologyResult', {
        Id: resultId,
        AppointmentId: appointmentId,
      });
      if (res?.status !== 1) throw new Error(res?.message || 'Unable to delete the result.');
      setResultId(0);
      setRatings({});
      setLocalScores({});
      narrativeAutoFill.current = true;
      setDirty(false);
      form.resetFields();
      form.setFieldsValue({
        DateOfExamination: dayjs(),
        DateOfInterpretation: dayjs(),
        NarrativeReport: defaultNarrative(formType),
        Recommendation: 'RECOMMENDED',
        RecommendationType: 'RECOMMENDED',
        RecommendationDetails: defaultRecommendationDetails,
      });
      setChargesKey(String(Date.now()));
      await charges.refetch();
      await results.refetch();
      notification.success({ message: 'Psychology result deleted.' });
    } catch (error) {
      notification.error({ message: error instanceof Error ? error.message : 'Unable to delete result.' });
    } finally {
      setDeleting(false);
    }
  };

  const fetchResultPdf = async () => {
    const saved = results.data?.find((item) => item.Id === resultId);
    if (!saved) throw new Error('Save the result first.');

    const response = await axios.get(`${apiRoot}/api/GenerateReport`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${store.tokenIdWebCims}` },
      params: {
        ReportName: saved.FormType === 'LOCAL' ? 'PsychologyLocal.rdl' : 'PsychologyOFW.rdl',
        ResultId: saved.Id,
      },
    });
    return new Blob([response.data], { type: 'application/pdf' });
  };

  const handleOnlineResult = async (values: { Username: string; Password: string }) => {
    if (!resultId || saving || deleting || finalizing || printing || onlineStatusUnavailable) return;
    if (dirty && !isOnlineResultShown) {
      notification.warning({ message: 'Submit your changes before showing the online result.' });
      return;
    }

    setShowFinalize(false);
    setFinalizing(true);
    try {
      const credentials = {
        ResultId: resultId,
        ResultType: onlineResultType,
        Username: values.Username,
        Password: values.Password,
      };
      const res = isOnlineResultShown
        ? await PostData('UnshowPdfFile', credentials)
        : await PostData('UploadPdfFile', {
          ...credentials,
          fk_Appointments_Id: appointmentId,
          fk_Departments_Id: psychologyDepartmentId,
          Description: `Psychology ${formType} Result`,
          ShowInCompanyPortal: 'Y',
          Pdf: await blobToDataUrl(await fetchResultPdf()),
        });
      if (res?.status !== 1) {
        throw new Error(res?.message || 'Unable to update the online Psychology result.');
      }

      notification.success({
        message: isOnlineResultShown
          ? 'Result hidden from online results.'
          : 'Result shown to online results.',
      });
      await onlineResultStatus.refetch();
      setChargesKey(String(Date.now()));
    } catch (error) {
      notification.error({ message: error instanceof Error ? error.message : 'Unable to update online result.' });
    } finally {
      setFinalizing(false);
    }
  };

  const printSavedResult = async () => {
    if (saving || deleting || finalizing || printing) return;
    if (dirty) {
      notification.warning({ message: 'Save your changes before printing.' });
      return;
    }
    setPrinting(true);
    try {
      const url = URL.createObjectURL(await fetchResultPdf());
      const preview = window.open(url, '_blank');
      if (!preview) {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'PsychologyReport.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      notification.error({ message: error instanceof Error ? error.message : 'Unable to generate the Psychology PDF.' });
    } finally {
      setPrinting(false);
    }
  };

  const patient = appointment.data;
  const age = patient?.AgeYears ? `${patient.AgeYears}Y` : '';

  return (
    <div className="cardBackGround">
      <PatientInfoHeader
        appointmentId={patient?.Id}
        patientId={patient?.fk_PatientInformation_Id}
        name={patient?.Name}
        age={age}
        sex={patient?.Sex}
        appointmentNo={patient?.AppointmentNo}
      />
      <Divider>Psychological Evaluation</Divider>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-3">
          <div className="lg:sticky lg:top-2">
            <Space wrap>
              <Button
                icon={<BiArrowBack />}
                onClick={() => router.navigate({
                  to: '/registeredpatients/$station',
                  params: { station: '1' },
                  search: getCompletedResultsSearch(),
                })}
              >
                Back
              </Button>
              <UploadDocumentButton
                patientId={patient?.fk_PatientInformation_Id}
                appointmentId={patient?.Id}
                departmentId={psychologyDepartmentId}
              />
            </Space>
            <Divider>Charges</Divider>
            <Tabs
              defaultActiveKey="charges"
              items={[
                {
                  key: 'charges',
                  label: 'Charges',
                  children: (
                    <ChargesPerPatient
                      AppointmentId={patient?.Id}
                      DepartmentId={psychologyDepartmentId}
                      Key={chargesKey}
                      activeChargeId={chargeId}
                      handleNewResult={selectCharge}
                      onActiveChargeChange={setActiveCharge}
                    />
                  ),
                },
                {
                  key: 'results',
                  label: 'Existing Results',
                  children: (
                    <ExistingPsychologyResults
                      results={results.data ?? []}
                      charges={charges.data ?? []}
                      loading={results.isLoading}
                      activeChargeId={chargeId}
                      onOpen={openResult}
                    />
                  ),
                },
              ]}
            />
          </div>
        </aside>

        <main className="min-w-0 lg:col-span-9">
          {!chargeId ? (
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              Select a Psychology procedure to begin or open an existing result.
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={saveResult}
              onValuesChange={(changedValues: Partial<PsychologyFormValues>) => {
                setDirty(true);
                if (Object.prototype.hasOwnProperty.call(changedValues, 'NarrativeReport')) {
                  narrativeAutoFill.current = false;
                } else if (Object.prototype.hasOwnProperty.call(changedValues, 'IntellectualLevel') && narrativeAutoFill.current) {
                  form.setFieldValue('NarrativeReport', defaultNarrative(formType, changedValues.IntellectualLevel));
                }
              }}
              scrollToFirstError
            >
              <Tabs
                activeKey={formType}
                items={([
                  { key: 'LOCAL', label: 'LOCAL' },
                  { key: 'OFW', label: 'OFW' },
                ] as const).map((tab) => ({
                  ...tab,
                  disabled: savedFormType !== undefined && savedFormType !== tab.key,
                }))}
                onChange={(key) => {
                  const next = key as PsychologyFormType;
                  if (next === formType || (savedFormType && next !== savedFormType)) return;
                  setFormType(next);
                  form.setFieldValue('IntellectualLevel', undefined);
                  if (narrativeAutoFill.current) {
                    form.setFieldValue('NarrativeReport', defaultNarrative(next));
                  }
                  if (!form.getFieldValue('DateOfInterpretation')) {
                    form.setFieldValue('DateOfInterpretation', dayjs());
                  }
                  setDirty(true);
                }}
              />
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{activeCharge?.Description || 'Psychology Result'}</h2>
                  <p className="text-sm text-slate-500">{resultId ? `Result #${resultId}` : 'New result'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
                <Form.Item name="DateOfExamination" label="Date of Examination" rules={[{ required: true }]}>
                  <DatePicker className="w-full" format="MM/DD/YYYY" />
                </Form.Item>
                <Form.Item name="DateOfInterpretation" label="Date of Interpretation" rules={[{ required: true }]}>
                  <DatePicker className="w-full" format="MM/DD/YYYY" />
                </Form.Item>
                <Form.Item name="PsychologistId" label="Psychologist" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={(psychologists.data ?? []).map((doctor) => ({
                      value: doctor.Id,
                      label: doctor.NameAndSpecialty || doctor.Name || `Doctor ${doctor.Id}`,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="PreparedById" label="Prepared by (Psychometrician)" rules={[{ required: true, message: 'Select a psychometrician.' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Select psychometrician"
                    options={(psychometricians.data ?? []).map((staff) => ({
                      value: staff.Id,
                      label: staff.Name || `Psychometrician ${staff.Id}`,
                    }))}
                  />
                </Form.Item>
              </div>

              {formType === 'LOCAL' && (
                <>
                  <Form.Item
                    name="PsychologicalScreeningPurpose"
                    label="Purpose of Psychological Screening"
                    rules={[{ required: true, message: 'Select a screening purpose.' }]}
                  >
                    <Select options={[
                      { value: 'EMPLOYMENT', label: 'For Employment' },
                      { value: 'INTERNSHIP', label: 'For Internship' },
                      { value: 'PERSONAL_USE', label: 'For Personal Use' },
                      { value: 'OTHER', label: 'Other' },
                    ]} />
                  </Form.Item>
                  {screeningPurpose === 'OTHER' && (
                    <Form.Item
                      name="PsychologicalScreeningPurposeOther"
                      label="Other Purpose"
                      rules={[{ required: true, message: 'Enter the other screening purpose.' }]}
                    >
                      <Input maxLength={200} />
                    </Form.Item>
                  )}
                  <Divider orientation="left">A. Intelligence Test (RSPM)</Divider>
                  <Form.Item name="IntellectualLevel" label="Intellectual Level" rules={[{ required: true, message: 'Select an intellectual level.' }]}>
                    <Select options={[...localIntellectualLevels]} placeholder="Select intellectual level" />
                  </Form.Item>
                  <Divider orientation="left">B. Personality Test (BPI)</Divider>
                  <p className="mb-3 text-sm text-slate-600">Enter scores from 10 to 100. The printed bars follow these values.</p>
                  {localScoreGroups.map((group) => (
                    <div key={group.title} className="mb-4 rounded border border-slate-200 p-3">
                      <h3 className="mb-2 font-semibold">{group.title}</h3>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {group.scores.map((score) => (
                          <label key={score.code} className="flex flex-col gap-1 text-sm">
                            {score.label}
                            <InputNumber
                              min={10}
                              max={100}
                              precision={0}
                              className="w-full"
                              value={localScores[score.code]}
                              onChange={(value) => {
                                setLocalScores((current) => {
                                  const next = { ...current };
                                  if (value === null) delete next[score.code];
                                  else next[score.code] = value;
                                  return next;
                                });
                                setDirty(true);
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Divider orientation="left">Narrative Report</Divider>
                  <Form.Item name="NarrativeReport" rules={[{ required: true, whitespace: true, message: 'Enter the narrative report.' }]}>
                    <Input.TextArea rows={5} />
                  </Form.Item>
                </>
              )}

              {formType === 'OFW' && (
                <>
              <Divider orientation="left">Tests Administered</Divider>
              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
                <Form.Item name="IntelligenceTest" label="Intelligence Test (IQ)">
                  <Input maxLength={200} placeholder="e.g. RSPM" />
                </Form.Item>
                <Form.Item name="PersonalityTest" label="Personality Test">
                  <Input maxLength={200} placeholder="e.g. BPI" />
                </Form.Item>
                <Form.Item name="OtherTests" label="Other Tests">
                  <Input maxLength={200} placeholder="e.g. MMSE" />
                </Form.Item>
              </div>

              <Divider orientation="left">I. Intellectual Level</Divider>
              <Form.Item name="IntellectualLevel" rules={[{ required: true, message: 'Select an intellectual level.' }]}>
                <Radio.Group className="flex flex-wrap gap-x-5 gap-y-2">
                  {intellectualLevels.map((level) => (
                    <Radio key={level.value} value={level.value}>{level.label}</Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Divider orientation="left">II. Personality Traits and Characteristics</Divider>
              <p className="mb-3 text-sm text-slate-600">
                Rating: 1 Very Low · 2 Low · 3 Low Average · 4 Average ·
                5 High Average · 6 High · 7 Very High
              </p>
              {psychologyTraitGroups.map((group) => (
                <div key={group.title} className="mb-5 overflow-x-auto">
                  <table className="w-full min-w-[650px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="w-2/5 border border-slate-300 px-2 py-2 text-left">{group.title}</th>
                        {ratingScale.map((rating) => (
                          <th key={rating} className="border border-slate-300 px-2 py-2 text-center">{rating}</th>
                        ))}
                        <th className="border border-slate-300 px-2 py-2">Clear</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.traits.map((trait) => (
                        <tr key={trait.code}>
                          <td className="border border-slate-300 px-2 py-1">{trait.label}</td>
                          {ratingScale.map((rating) => (
                            <td key={rating} className="border border-slate-300 text-center">
                              <input
                                type="radio"
                                name={`psychology-${trait.code}`}
                                aria-label={`${trait.label}: ${rating}`}
                                checked={ratings[trait.code] === rating}
                                onChange={() => {
                                  setRatings((current) => ({ ...current, [trait.code]: rating }));
                                  setDirty(true);
                                }}
                              />
                            </td>
                          ))}
                          <td className="border border-slate-300 text-center">
                            <Button
                              type="link"
                              size="small"
                              aria-label={`Clear ${trait.label}`}
                              disabled={!ratings[trait.code]}
                              onClick={() => {
                                setRatings((current) => {
                                  const next = { ...current };
                                  delete next[trait.code];
                                  return next;
                                });
                                setDirty(true);
                              }}
                            >
                              Clear
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <Divider orientation="left">Narrative Report</Divider>
              <Form.Item name="NarrativeReport" rules={[{ required: true, whitespace: true, message: 'Enter the narrative report.' }]}>
                <Input.TextArea rows={5} />
              </Form.Item>
                </>
              )}
              <Divider orientation="left">{formType === 'LOCAL' ? 'C.' : 'III.'} Conclusion / Remarks</Divider>
              <Form.Item
                name="Recommendation"
                label="Decision"
                rules={[{ required: true, message: 'Select a recommendation decision.' }]}
              >
                <Radio.Group>
                  <Space wrap>
                    <Radio value="RECOMMENDED">Recommended</Radio>
                    <Radio value="FURTHER_EVALUATION">For further evaluation</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
              <div className={`mb-4 rounded border-2 p-4 ${recommendation === 'RECOMMENDED' ? 'border-slate-700' : 'border-slate-300'}`}>
                <h3 className="mb-3 font-semibold">
                  ({recommendation === 'RECOMMENDED' ? '✓' : ' '}) RECOMMENDED
                </h3>
                <Form.Item
                  name="RecommendationType"
                  label="Recommendation"
                  rules={[{
                    required: recommendation === 'RECOMMENDED',
                    message: 'Select a recommendation type.',
                  }]}
                >
                  <Select
                    placeholder="Select a recommendation"
                    options={[...recommendationTypes]}
                    disabled={recommendation !== 'RECOMMENDED'}
                  />
                </Form.Item>
                {recommendation === 'RECOMMENDED' && recommendedConclusionText && (
                  <p className="mb-4 text-sm text-slate-700">
                    {recommendedConclusionText}
                  </p>
                )}
                <Form.Item name="RecommendationDetails" label="Recommendation details">
                  <Input.TextArea
                    rows={3}
                    disabled={recommendation !== 'RECOMMENDED'}
                    placeholder="Enter any additional recommendation details."
                  />
                </Form.Item>
              </div>
              <div className={`mb-5 rounded border-2 p-4 ${recommendation === 'FURTHER_EVALUATION' ? 'border-slate-700' : 'border-slate-300'}`}>
                <h3 className="mb-3 font-semibold">
                  ({recommendation === 'FURTHER_EVALUATION' ? '✓' : ' '}) FOR FURTHER EVALUATION
                </h3>
                <Form.Item
                  name="FurtherEvaluationDetails"
                  label="Recommended further tests or consultation"
                >
                  <Input.TextArea
                    rows={3}
                    disabled={recommendation !== 'FURTHER_EVALUATION'}
                    placeholder="Enter the psychologist's recommendation for further testing or consultation."
                  />
                </Form.Item>
              </div>
              {resultId > 0 && onlineResultStatus.isError && (
                <div className="mt-3 text-right text-sm text-red-600" role="alert">
                  Unable to check online result status.
                  <Button type="link" htmlType="button" onClick={() => void onlineResultStatus.refetch()}>
                    Retry
                  </Button>
                </div>
              )}
              <div className="mt-3 flex w-full flex-wrap justify-end gap-2 print:hidden">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  disabled={
                    isOnlineResultShown ||
                    onlineStatusUnavailable ||
                    finalizing ||
                    deleting ||
                    printing ||
                    isResultBlockedStatus(activeCharge?.Status)
                  }
                >
                  Submit
                </Button>
                <Button
                  type="primary"
                  htmlType="button"
                  loading={finalizing}
                  disabled={!resultId || onlineStatusUnavailable || saving || deleting || printing}
                  onClick={() => {
                    if (dirty && !isOnlineResultShown) {
                      notification.warning({ message: 'Submit your changes before showing the online result.' });
                      return;
                    }
                    setShowFinalize(true);
                  }}
                >
                  {isOnlineResultShown ? 'Unshow Online Result' : 'Show to Online Results'}
                </Button>
                <Button
                  type="primary"
                  htmlType="button"
                  loading={printing}
                  disabled={!resultId || saving || finalizing || deleting}
                  onClick={printSavedResult}
                >
                  Print
                </Button>
                <Popconfirm
                  title="Delete this Psychology result?"
                  description="The saved result and its online PDF will be removed."
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                  onConfirm={deleteResult}
                >
                  <Button
                    danger
                    type="primary"
                    htmlType="button"
                    loading={deleting}
                    disabled={!resultId || saving || finalizing || printing}
                  >
                    Delete Result
                  </Button>
                </Popconfirm>
              </div>
            </Form>
          )}
        </main>
      </div>
      <Modal
        open={showFinalize}
        destroyOnClose
        footer={false}
        onCancel={() => setShowFinalize(false)}
      >
        <FinalizeForm
          handleFinalizeResult={handleOnlineResult}
          title={isOnlineResultShown ? 'Unshow Online Result' : 'Show to Online Results'}
          submitText={isOnlineResultShown ? 'Unshow' : 'Show'}
        />
      </Modal>
    </div>
  );
}
