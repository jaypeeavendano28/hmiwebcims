import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  AutoComplete,
  Card,
  Checkbox,
  DatePicker,
  FloatButton,
  Form,
  Input,
  Radio,
  Select,
  Spin,
} from 'antd';
import { PostData } from '../helpers';
import { TDoctors, TMedicalExamLandBased } from '../types';
import { FaPrint, FaRegSave } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import axios from 'axios';
import useAppStore from '../store';
import dayjs from 'dayjs';

type Props = {
  AppointmentId: number;
  Sex: string;
};

const formatDatePayload = (value: any) =>
  value ? dayjs(value).format('YYYY-MM-DD') : null;

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

const bmiResultOptions = [
  { value: 'UNDERWEIGHT' },
  { value: 'NORMAL' },
  { value: 'OVERWEIGHT' },
  { value: 'OBESE CLASS I' },
  { value: 'OBESE CLASS II' },
  { value: 'OBESE CLASS III' },
];

type SummaryResultValue = 'P' | 'W' | undefined;

function SummaryResultCheckboxes({
  value,
  onChange,
}: {
  value?: SummaryResultValue;
  onChange?: (value: SummaryResultValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      <Checkbox
        checked={value === 'P'}
        onChange={(event) => onChange?.(event.target.checked ? 'P' : undefined)}
      >
        PASSED
      </Checkbox>
      <Checkbox
        checked={value === 'W'}
        onChange={(event) => onChange?.(event.target.checked ? 'W' : undefined)}
      >
        WITH SIGNIFICANT FINDINGS
      </Checkbox>
    </div>
  );
}

export default function MedicalExaminationLandBased({
  AppointmentId,
  Sex,
}: Props) {
  const { notification } = App.useApp();
  const [isProcessing, setIsProccessing] = useState(false);
  const [form] = Form.useForm();
  const store = useAppStore();
  const [hasSavedData, setHasSavedData] = useState(false);

  const doctors = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const queryClient = useQueryClient();

  const examData = useQuery({
    queryKey: ['medicalExaminationLandBased', AppointmentId],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetMedicalExaminationLandBased',
        parameters: { Id: AppointmentId },
      });
      if (res) {
        const x = res.parameters.lst[0];
        console.log();
        if (x) {
          setHasSavedData(true);
        }
        form.setFieldsValue({
          ...x,
          MedicalExpirationDate: x.MedicalExpirationDate
            ? dayjs(x.MedicalExpirationDate)
            : undefined,
          DateOfSigning: x.DateOfSigning ? dayjs(x.DateOfSigning) : undefined,
          DateOfExamination: x.DateOfExamination
            ? dayjs(x.DateOfExamination)
            : undefined,
        });
        return x;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const ishiharaWatch = Form.useWatch('Ishihara', form);
  const earRightWatch = Form.useWatch('EarRight', form);
  const earLeftWatch = Form.useWatch('EarLeft', form);

  useEffect(() => {
    if (!examData.isFetched) return;

    if (ishiharaWatch === 'D') {
      if (
        examData.data?.IshiharaRem == null ||
        examData.data?.IshiharaRem == ''
      ) {
        form.setFieldValue('IshiharaRem', 'CLEARED');
      } else {
        form.setFieldValue('IshiharaRem', examData.data.IshiharaRem);
      }
      return;
    }
    form.setFieldValue('IshiharaRem', undefined);
  }, [examData.data, examData.isFetched, form, ishiharaWatch]);

  useEffect(() => {
    if (!examData.isFetched) return;

    if (earRightWatch === 'I') {
      if (
        examData.data?.EarRightRemarks == null ||
        examData.data?.EarRightRemarks == ''
      ) {
        form.setFieldValue('EarRightRemarks', 'CLEARED');
      } else {
        form.setFieldValue('EarRightRemarks', examData.data.EarRightRemarks);
      }
      return;
    }
    form.setFieldValue('EarRightRemarks', undefined);
  }, [earRightWatch, examData.data, examData.isFetched, form]);

  useEffect(() => {
    if (!examData.isFetched) return;

    if (earLeftWatch === 'I') {
      if (
        examData.data?.EarLeftRemarks == null ||
        examData.data?.EarLeftRemarks == ''
      ) {
        form.setFieldValue('EarLeftRemarks', 'CLEARED');
      } else {
        form.setFieldValue('EarLeftRemarks', examData.data.EarLeftRemarks);
      }
      return;
    }
    form.setFieldValue('EarLeftRemarks', undefined);
  }, [earLeftWatch, examData.data, examData.isFetched, form]);

  async function handleSubmit(data: TMedicalExamLandBased) {
    try {
      setIsProccessing(true);

      const res = await PostData('SaveMedicalExaminationLandBased', {
        ...data,
        fk_Appointments_Id: AppointmentId,
        MedicalExpirationDate: formatDatePayload(
          form.getFieldValue('MedicalExpirationDate'),
        ),
        DateOfSigning: formatDatePayload(form.getFieldValue('DateOfSigning')),
        DateOfExamination: formatDatePayload(
          form.getFieldValue('DateOfExamination'),
        ),
      });
      setIsProccessing(false);
      queryClient.invalidateQueries({
        queryKey: ['medicalExaminationLandBased', AppointmentId],
      });
      setHasSavedData(true);
      if (res.status === 1) {
        notification.success({
          message: 'Successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error) {
      setIsProccessing(false);
      console.log(error);
    }
  }
  function handleSubmitFailed(error: any) {
    notification.error({
      message: 'Please complete the required fields.',
      placement: 'topRight',
      duration: 3,
    });
    if (error.errorFields?.[0]?.name) {
      form.scrollToField(error.errorFields[0].name, {
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  const handlePrint = async () => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport';
    try {
      setIsProccessing(true);
      await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'MedExamLandBasedWRemarks.rdl',
          AppointmentId: AppointmentId,
        },
      }).then((response) => {
        let newBlob;
        newBlob = new Blob([response.data], {
          type: 'application/pdf',
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement('a');

        a.setAttribute('href', data);
        a.setAttribute('target', '_blank');

        a.click();
        // setIsSubmitting(false);
      });
    } catch (error: any) {
      // setIsSubmitting(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    } finally {
      setIsProccessing(false);
    }
  };

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (!isProcessing) handleSubmit();
  //   }, 60000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        onFinishFailed={handleSubmitFailed}
        initialValues={{
          Head: 'N',
          FreqHeadache: 'N',
          FreqDizziness: 'N',
          Depression: 'N',
          Fainting: 'N',
          Insomia: 'N',
          Eye: 'N',
          Deafness: 'N',
          Nose: 'N',
          Tuberculosis: 'N',
          Lung: 'N',
          HighBlood: 'N',
          Cardio: 'N',
          RheumaticFever: 'N',
          Diabetes: 'N',
          Endocrine: 'N',
          Cancer: 'N',
          Blood: 'N',
          Stomach: 'N',
          Abdominal: 'N',
          Gyne: 'N',
          LastMenstrual: 'N',
          Kidney: 'N',
          BackInjury: 'N',
          Genetic: 'N',
          Std: 'N',
          Tropical: 'N',
          Asthma: 'N',
          Allergies: 'N',
          Operations: 'N',
          SickOrRepatriated: 'N',
          Hospitalized: 'N',
          UnfitForWork: 'N',
          Restricted: 'N',
          MedicalProblem: 'N',
          FeelHealthy: 'Y',
          AllergicToAnyMedication: 'N',
          NonPrescription: 'N',
          Ishihara: 'A',
          IshiharaRem: undefined,
          EarRight: 'A',
          EarRightRemarks: undefined,
          EarLeft: 'A',
          EarLeftRemarks: undefined,
          ClartityOfSpeech: 'A',
          Skin: 'Y',
          HeadNeckScalp: 'Y',
          EyesExternal: 'Y',
          Pupils: 'Y',
          Ears: 'Y',
          NoseSinuses: 'Y',
          MouthThroat: 'Y',
          Neck: 'Y',
          Chest: 'Y',
          Lungs: 'Y',
          Heart: 'Y',
          Abdomen: 'Y',
          Back: 'Y',
          Anus: 'Y',
          Genito: 'Y',
          Inguinals: 'Y',
          Extremities: 'Y',
          Reflexes: 'Y',
          Dental: 'Y',
          ChestXray: 'N',
          Ecg: 'N',
          Cbc: 'N',
          Urinalysis: 'N',
          Stool: 'N',
          Hepa: 'N',
          Hiv: 'N',
          Rpr: 'N',
          PsychoTest: 'N',
          BasicDoh: 'P',
          AdditionalLabTest: 'P',
          HostCountry: 'P',
          Assessment: 'F',
          WithDateOfExpiration: 'Y',
          DateOfExamination: dayjs(),
          MedicalExpirationDate: dayjs().add(3, 'month'),
          DateOfSigning: dayjs(),
        }}
      >
        <Card title="I. MEDICAL HISTORY">
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Head" label="Head or Neck Injury">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="HeadRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="FreqHeadache" label="Frequent Headache">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="FreqHeadacheRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="FreqDizziness" label="Frequent Dizziness">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="FreqDizzinessRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Fainting" label="Fainting Spells">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="FaintingRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Insomia" label="Insomia">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="InsomiaRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Depression" label="Depression">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="DepressionRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Eye" label="Eye Problems">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="EyeRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Deafness" label="Deafness">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="DeafnessRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Nose" label="Nose or Throat Problems">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="NoseRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Tuberculosis" label="Tuberculosis">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="TuberculosisRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Lung" label="Other Lung Disorders">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="LungRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="HighBlood" label="High Blood Pressures">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="HighBloodRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Cardio" label="Cardiovascula/Chest Pain">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="CardioRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="RheumaticFever" label="Rheumatic Fever">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="RheumaticFeverRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Diabetes" label="Diabetes Mellitus">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="DiabetesRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Endocrine" label="Other Endocrine Disorders">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="EndocrineRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Cancer" label="Cancer or Tumor">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="CancerRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Blood" label="Blood Disorders">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="BloodRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Stomach" label="Stomach Pain, Gastritis">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="StomachRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Abdominal" label="Other Abdominal Disorders">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="AbdominalRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Gyne" label="Gynecological Disorders">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                  <Radio value="F">N/A</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="GyneRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="LastMenstrual" label="Last Menstrual Period">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                  <Radio value="F">N/A</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="LastMenstrualRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Kidney" label="Kidney of Bladder Disorder">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="KidneyRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="BackInjury" label="Back Injury">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="BackInjuryRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="Genetic"
                label="Genetic,Hereditary Fam. Disorders"
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="GeneticRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Std" label="STD">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="StdRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Tropical" label="Tropical Diseases">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="TropicalRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Asthma" label="Asthma(childhood)">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="AsthmaRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Allergies" label="Allergies">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="AllergiesRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="Operations" label="Operations">
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="OperationsRem" label="Remarks">
                <Input />
              </Form.Item>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="SickOrRepatriated"
              label="Have you ever been signed off or repatriated from a jobsite overseas?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="SickOrRepatriatedRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="Hospitalized"
              label="Have you ever been hospitalized?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="HospitalizedRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="UnfitForWork"
              label="Have you ever been declared unfit for work overseas?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="UnfitForWorkRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="Restricted"
              label="Has your medical certificate ever been restricted or revoked?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="RestrictedRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="MedicalProblem"
              label="Are you aware that you have any medical problem, disease or illness?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="MedicalProblemRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="FeelHealthy"
              label="Do you feel healthy and fit to perform the duties of your designated position/occupation?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="FeelHealthyRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="AllergicToAnyMedication"
              label="Are you allergic to any medication?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="AllergicToAnyMedicationRem" label="Comments">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="NonPrescription"
              label="Are you taking any non-prescription medication?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="NonPrescriptionRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
        </Card>
        <div className="mt-4" />
        <Card title="II. MEDICAL EXAMINATION">
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Height" label="Height">
              <Input />
            </Form.Item>
            <Form.Item name="Weight" label="Weight">
              <Input />
            </Form.Item>
            <Form.Item name="BPSystolic" label="BP (Systolic)">
              <Input />
            </Form.Item>
            <Form.Item name="BPDiastolic" label="BP (Diastolic)">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="PR" label="PR">
              <Input />
            </Form.Item>
            <Form.Item name="Rhythm" label="Rhythm">
              <Input />
            </Form.Item>
            <Form.Item name="Respiration" label="Respiration">
              <Input />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="BMI" label="BMI">
                <Input />
              </Form.Item>
              <Form.Item name="BMIResult" label="BMI Result">
                <AutoComplete options={bmiResultOptions} />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item
              name="VAUncorrectedFarVisIonOU"
              label="FAR VISION UNCORRECTED OD"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="VAUncorrectedFarVisionOS"
              label="FAR VISION UNCORRECTED OS"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="VACorrectedFarVisionOD"
              label="FAR VISION CORRECTED OD"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="VACorrectedFarVisionOU"
              label="FAR VISION CORRECTED OS"
            >
              <Input />
            </Form.Item>

            {/* <Form.Item name="NearVision" label="Near Vision">
              <Input />
            </Form.Item> */}
            <Form.Item
              name="NearVisionUncorrectedODJ"
              label="NEAR VISION UNCORRECTED OD"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="NearVisionCorrectedOSJ"
              label="NEAR VISION UNCORRECTED OS
"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="NearVisionCorrectedODJ"
              label="NEAR VISION CORRECTED OS"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="NearVisionUncorrectedOSJ"
              label="NEAR VISION CORRECTED OD
"
            >
              <Input />
            </Form.Item>
            <div>
              <Form.Item name="Ishihara" label="Ishihara Color Vision">
                <Radio.Group>
                  <Radio value="A">Adequuate</Radio>
                  <Radio value="D">Defective</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="IshiharaRem"
                label="Ishihara Remarks"
                rules={[
                  {
                    required: ishiharaWatch === 'D',
                  },
                ]}
              >
                <Input disabled={ishiharaWatch !== 'D'} />
              </Form.Item>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Form.Item name="EarRight" label="Ear Right">
                <Radio.Group>
                  <Radio value="A">Adequuate</Radio>
                  <Radio value="I">Inadequate</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="EarRightRemarks"
                label="Ear Right Inadequate Remarks"
                rules={[
                  {
                    required: earRightWatch === 'I',
                  },
                ]}
              >
                <Input disabled={earRightWatch !== 'I'} />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="EarLeft" label="Ear Left">
                <Radio.Group>
                  <Radio value="A">Adequuate</Radio>
                  <Radio value="I">Inadequate</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="EarLeftRemarks"
                label="Ear Left Inadequate Remarks"
                rules={[
                  {
                    required: earLeftWatch === 'I',
                  },
                ]}
              >
                <Input disabled={earLeftWatch !== 'I'} />
              </Form.Item>
            </div>
            <Form.Item name="ClartityOfSpeech" label="Clarity of speech">
              <Radio.Group>
                <Radio value="A">Adequuate</Radio>
                <Radio value="D">Defective</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Skin" label="Skin">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="SkinRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="HeadNeckScalp" label="Head, Neck, Scalp">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="HeadNeckScalpRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="EyesExternal" label="Eyes, external">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="EyesExternalRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="Pupils" label="Pupils Ophthalmoscopic">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="PupilsRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Ears" label="Ears">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="EarsRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="NoseSinuses" label="Nose,Sinuses">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="NoseSinusesRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="MouthThroat" label="Mouth, Throat">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="MouthThroatRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="Neck" label="Neck,Lymph Nodes, Thyroid">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="NeckRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Chest" label="Chest-Brest-Axilla">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="ChestRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="Lungs" label="Lungs">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="LungsRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Heart" label="Heart">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="HeartRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="Abdomen" label="Abdomen">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="AbdomenRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Back" label="Back">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="BackRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="Anus" label="Anus-Rectum">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="AnusRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Genito" label="Genito-urinary System">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="GenitoRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="Inguinals" label="Inguinals, Genitals">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="InguinalsRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Extremities" label="Extremities">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="ExtremitiesRem" label="Remarks">
              <Input />
            </Form.Item>
            <Form.Item name="Reflexes" label="Reflexes">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="ReflexesRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Dental" label="Dental (Teeth/Gums)">
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="DentalRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
        </Card>
        <div className="mt-4" />
        <Card title="III. RESULTS OF ANCILLARY EXAMINATIONS">
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="ChestXray" label="A. CHEST-X-RAY">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="W">With Findings</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="ChestXrayRem" label="Result">
              <Input />
            </Form.Item>
            <Form.Item name="Ecg" label="B. ECG">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="W">With Findings</Radio>
                <Radio value="F">N/A</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="EcgRem" label="Result">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Cbc" label="C. CBC">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="W">With Findings</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="CbcRem" label="Result">
              <Input />
            </Form.Item>
            <Form.Item name="Urinalysis" label="D. URINALYSIS">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="W">With Findings</Radio>
              </Radio.Group>
            </Form.Item>
            <div className="grid">
              <Form.Item name="UrinalysisRem" label="Result">
                <Input />
              </Form.Item>
              {Sex === 'Female' && (
                <Form.Item
                  name="PregnancyTestResult"
                  label="Pregnancy Test Result"
                >
                  <Input />
                </Form.Item>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Stool" label="E. STOOL">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="W">With Findings</Radio>
                <Radio value="F">N/A</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="StoolRem" label="Result">
              <Input />
            </Form.Item>
            <Form.Item name="Hepa" label="F. HEPATITIS B">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="W">With Findings</Radio>
                <Radio value="F">N/A</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="HepaRem" label="Result">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="Hiv" label="G/ HIV/AIDS">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="W">With Findings</Radio>
                <Radio value="F">N/A</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="HivRem" label="Result">
              <Input />
            </Form.Item>
            <Form.Item name="Rpr" label="H. RPR and/or TPHA">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="W">With Findings</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="RprRem" label="Result">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="BloodType" label="Blood Type">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="PsychoTest" label="PSYCHOLOGICAL TEST">
              <Radio.Group>
                <Radio value="N">Normal</Radio>
                <Radio value="F">For Further Evaluation</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="PsychoTestRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
        </Card>
        <div className="mt-4" />
        <Card title="IV. SUMMARY">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="BasicDoh"
              label="Basic DOH Mandatory Medical Examination"
            >
              <SummaryResultCheckboxes />
            </Form.Item>
            <Form.Item name="BasicDohRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="AdditionalLabTest"
              label="Additional Laboratory Test"
            >
              <SummaryResultCheckboxes />
            </Form.Item>
            <Form.Item name="AdditionalLabTestRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="HostCountry"
              label="Host Country Medical and Laboratory Requirements"
            >
              <SummaryResultCheckboxes />
            </Form.Item>
            <Form.Item name="HostCountryRem" label="Remarks">
              <Input />
            </Form.Item>
          </div>
        </Card>
        <Card title="V. ASSESSMENT OF FITNESS FOR LANDBASED OVERSEAS WORK.">
          <Form.Item
            name="Assessment"
            label="On the basis of the examinee's personal declaration, my clinical examination and the diagnostic test results recorded above, 
            I declare the examinee medically"
          >
            <Radio.Group>
              <Radio value="F">
                <p className="font-bold text-xl">FIT</p>
              </Radio>
              <Radio value="U">
                <p className="font-bold text-xl">UNFIT</p>
              </Radio>
            </Radio.Group>
          </Form.Item>
          <div className="grid grid-cols-3 gap-4">
            {/* <Form.Item
              name="WithDateOfExpiration"
              label="With date of expiration?"
            >
              <Radio.Group>
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </Radio.Group>
            </Form.Item> */}
            <Form.Item
              name="DateOfExamination"
              label="Date of Medical Examination Report"
              rules={[
                {
                  required: true,
                  message: 'Date of medical examination report is required.',
                },
              ]}
            >
              <DatePicker format={'MM/DD/YYYY'} />
            </Form.Item>
            <Form.Item
              name="MedicalExpirationDate"
              label="Date of Expiration of Medical Examination Report"
              rules={[
                {
                  required: true,
                  message: 'Date of expiration is required.',
                },
              ]}
            >
              <DatePicker format={'MM/DD/YYYY'} />
            </Form.Item>
            <Form.Item
              name="MedicalExamReportNo"
              label="Medical Examination No."
            >
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              label="Examining/Authorized Physician"
              name="Doctor"
              className="col-span-1"
              rules={[
                {
                  required: true,
                  message: 'Examining/authorized physician is required.',
                },
              ]}
            >
              <Select
                style={{ width: '100%' }}
                showSearch
                allowClear
                filterOption={(input, option) =>
                  (
                    option!.children
                      ?.toString()
                      .toLocaleLowerCase() as unknown as string
                  ).includes(input.toLocaleLowerCase())
                }
              >
                {doctors.data &&
                  doctors.data.map((d: TDoctors) => (
                    <Select.Option
                      key={d.Id}
                      value={d.Id}
                      title={d.NameAndSpecialty}
                    >
                      {d.NameAndSpecialty}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="DateOfSigning"
              label="Date of Signing"
              rules={[
                {
                  required: true,
                  message: 'Date of signing is required.',
                },
              ]}
            >
              <DatePicker format={'MM/DD/YYYY'} />
            </Form.Item>
          </div>
        </Card>
        <FloatButton.Group shape="square" style={{ insetInlineEnd: 70 }}>
          <Spin spinning={isProcessing}>
            <FloatButton
              tooltip="Save"
              icon={<FaRegSave />}
              onClick={() => form.submit()}
              type="primary"
            />
          </Spin>
          {hasSavedData && (
            <Spin spinning={isProcessing}>
              <FloatButton
                onClick={handlePrint}
                tooltip="Print"
                icon={<FaPrint />}
                type="primary"
              />
            </Spin>
          )}
        </FloatButton.Group>
      </Form>
    </div>
  );
}
