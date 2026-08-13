import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  PostData,
  blobToDataUrl,
  isNullOrUndefinedOrBlank,
} from '../../helpers';
import { useForm } from 'antd/es/form/Form';
import {
  TAppointments,
  TCharges,
  TDoctors,
  TMer,
  TMerOtherTests,
  TMerOthers,
  TSettings,
} from '../../types';
import {
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  notification,
} from 'antd';
import dayjs from 'dayjs';
import { FaBars } from 'react-icons/fa6';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import axios from 'axios';
import useAppStore from '../../store';
import { useAuth } from '../../hooks/userAuth';
import { useQuery } from '@tanstack/react-query';
import FinalizeForm from '../../components/FinalizeForm';

export const Route = createFileRoute('/_authenticated/mer/$AppointmentId')({
  component: () => <Mer />,
});
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;
const onlineResultType = 'MER';
const onlineResultDescription = 'Medical Evaluation Report';
const fecalysisClassificationRemark =
  'Classification may change once fecalysis is facilitated if still required by company.';
const otherMedicalHistory: TMerOthers[] = [
  { Id: 1, Description: 'Smoker' },
  { Id: 2, Description: 'Non-Smoker' },
  { Id: 3, Description: 'Alcohol beverage drinker' },
  { Id: 4, Description: 'Non-Alcoholic beverage drinker' },
  { Id: 5, Description: 'Occasional alcoholic beverage drinker' },
  { Id: 6, Description: 'Covid-19 Vaccinated' },
];
const reactiveOtherTests: {
  checkName: keyof TMerOtherTests;
  valueName: keyof TMerOtherTests;
  label: string;
}[] = [
  { checkName: 'StoolCs', valueName: 'StoolCsValue', label: 'Stool c/s' },
  { checkName: 'AntiHbs', valueName: 'AntiHbsValue', label: 'ANTI - HBS' },
  { checkName: 'HbSag', valueName: 'HbSagValue', label: 'HBsAg' },
  { checkName: 'HepaAIgG', valueName: 'HepaAIgGValue', label: 'Hepa A - IgG' },
  { checkName: 'HepaAIgM', valueName: 'HepaAIgMValue', label: 'Hepa A - IgM' },
  { checkName: 'Rpr', valueName: 'RprValue', label: 'RPR' },
  {
    checkName: 'AntiHav',
    valueName: 'AntiHavValue',
    label: 'Anti - HAV - IgG',
  },
  {
    checkName: 'AntiHavIgM',
    valueName: 'AntiHavIgMValue',
    label: 'Anti - HAV - IgM',
  },
];
const normalOtherTests: {
  checkName: keyof TMerOtherTests;
  resultName: keyof TMerOtherTests;
  unitName: keyof TMerOtherTests;
  label: string;
  unit: string;
}[] = [
  {
    checkName: 'Glucose',
    resultName: 'GlucoseValue',
    unitName: 'GlucoseValue2',
    label: 'Glucose',
    unit: 'mmol/l',
  },
  {
    checkName: 'Urea',
    resultName: 'UreaValue',
    unitName: 'UreaValue2',
    label: 'Urea',
    unit: 'mmol/l',
  },
  {
    checkName: 'Creatinine',
    resultName: 'CreatinineValue',
    unitName: 'CreatinineValue2',
    label: 'Creatinine',
    unit: 'umol/l',
  },
  {
    checkName: 'UricAcid',
    resultName: 'UricAcidValue',
    unitName: 'UricAcidValue2',
    label: 'Uric Acid',
    unit: 'umol/l',
  },
  {
    checkName: 'Cholesterol',
    resultName: 'CholesterolValue',
    unitName: 'CholesterolValue2',
    label: 'Cholesterol',
    unit: 'mmol/l',
  },
  {
    checkName: 'Triglycerides',
    resultName: 'TriglyceridesValue',
    unitName: 'TriglyceridesValue2',
    label: 'Triglycerides',
    unit: 'mmol/l',
  },
  {
    checkName: 'Hdl',
    resultName: 'HdlValue',
    unitName: 'HdlValue2',
    label: 'HDL',
    unit: 'mmol/l',
  },
  {
    checkName: 'Ldl',
    resultName: 'LdlValue',
    unitName: 'LdlValue2',
    label: 'LDL',
    unit: 'mmol/l',
  },
  {
    checkName: 'Sgpt',
    resultName: 'SgptValue',
    unitName: 'SgptValue2',
    label: 'SGPT',
    unit: 'U/L',
  },
  {
    checkName: 'Sgot',
    resultName: 'SgotValue',
    unitName: 'SgotValue2',
    label: 'SGOT',
    unit: 'U/L',
  },
  {
    checkName: 'Globulin',
    resultName: 'GlobulinValue',
    unitName: 'GlobulinValue2',
    label: 'Globulin',
    unit: 'g/l',
  },
  {
    checkName: 'HbA1c',
    resultName: 'HbA1cValue',
    unitName: 'HbA1cValue2',
    label: 'HbA1c',
    unit: '%',
  },
  {
    checkName: 'Tsh',
    resultName: 'TshValue',
    unitName: 'TshValue2',
    label: 'TSH',
    unit: 'uIU/ml',
  },
  {
    checkName: 'Ft3',
    resultName: 'Ft3Value',
    unitName: 'Ft3Value2',
    label: 'FT3',
    unit: 'pmol/L',
  },
  {
    checkName: 'Ft4',
    resultName: 'Ft4Value',
    unitName: 'Ft4Value2',
    label: 'FT4',
    unit: 'pmol/L',
  },

  {
    checkName: 'Potassium',
    resultName: 'PotassiumValue',
    unitName: 'PotassiumValue2',
    label: 'Potassium',
    unit: 'mmol/L',
  },
  {
    checkName: 'Sodium',
    resultName: 'SodiumValue',
    unitName: 'SodiumValue2',
    label: 'Sodium',
    unit: 'mmol/L',
  },
];
const encodeReportLineBreaks = (value?: string) =>
  value?.replace(/\r?\n/g, '\\n');
const decodeReportLineBreaks = (value?: string) => value?.replace(/\\n/g, '\n');
const getPositiveNumber = (value: unknown) => {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};
const Mer = () => {
  const [peStatus, setPeStatus] = useState([]);
  const [chestXrayStatus, setChestXrayStatus] = useState<
    TCharges | undefined
  >();
  const [urinalysisStatus, setUrinalysisStatus] = useState<
    TCharges | undefined
  >();
  const [ecgStatus, setEcgStatus] = useState<TCharges | undefined>();
  const [cbcStatus, setCbcStatus] = useState<TCharges | undefined>();
  const [fecalysisStatus, setFecalysisStatus] = useState<
    TCharges | undefined
  >();
  const [drugTestStatus, setDrugTestStatus] = useState<TCharges | undefined>();
  const [treadmillStatus, setTreadmillStatus] = useState<
    TCharges | undefined
  >();
  const [echoStatus, setEchoStatus] = useState<TCharges | undefined>();
  const [ultrasoundStatus, setultrasoundStatus] = useState<
    TCharges | undefined
  >();
  const [formOtherServices] = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [isOnlineResultShown, setIsOnlineResultShown] = useState(false);
  const [showOtherServices, setShowOtherServices] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const store = useAppStore();
  const [selectedFamMed, setSelectedFamMed] = useState<TMerOthers[]>([]);
  const [selectedOthers, setSelectedOthers] = useState<TMerOthers[]>([]);
  const [showFamilyMedHistory, setShowFamilyMedHistory] = useState(false);
  const [showOthersHistory, setShowOthersHistory] = useState(false);
  const [familyMedicalHistory, setFamilyMedicalHistory] = useState<
    TMerOthers[]
  >([]);

  const [doctors, setDoctors] = useState<TDoctors[] | undefined>([]);
  const { AppointmentId } = Route.useParams();
  const [form] = useForm();
  const merNo = Form.useWatch('MerNo', form);
  const evaluationRemarks = Form.useWatch('Remarks', form);
  const merResultId = getPositiveNumber(AppointmentId);

  const handleFecalysisClassificationRemarkChange = (checked: boolean) => {
    const currentRemarks = String(form.getFieldValue('Remarks') ?? '').trim();

    if (checked) {
      if (!currentRemarks.includes(fecalysisClassificationRemark)) {
        form.setFieldValue(
          'Remarks',
          [currentRemarks, fecalysisClassificationRemark]
            .filter(Boolean)
            .join('\n'),
        );
      }
      return;
    }

    form.setFieldValue(
      'Remarks',
      currentRemarks
        .replace(fecalysisClassificationRemark, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    );
  };

  const refreshOnlineResultStatus = async () => {
    if (merResultId <= 0) {
      setIsOnlineResultShown(false);
      return;
    }

    const res = await PostData('GetPdfFileStatus', {
      ResultId: merResultId,
      ResultType: onlineResultType,
    });

    setIsOnlineResultShown(Boolean(res?.parameters?.Shown));
  };

  const occupation = useQuery({
    queryKey: ['occupation'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetOccupation',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const city = useQuery({
    queryKey: ['city'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'CITY',
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const barangay = useQuery({
    queryKey: ['barangay'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'BARANGAY',
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleInitialize = async () => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetFamilyMedicalHistory',
      parameters: {},
    });
    if (res) {
      setFamilyMedicalHistory(res.parameters.lst);
    }
    res = await PostData('GetRecords', {
      sp: 'udp_GetSettings',
      parameters: {
        Code: 'PESTATUS',
      },
    });
    if (res) {
      setPeStatus(res.parameters.lst);
    }
  };
  const handleGetAppointmentDetails = async () => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetAppointmentDetails',
      parameters: {
        Id: AppointmentId,
      },
    });
    if (res) {
      const x: TAppointments = res.parameters.lst[0];
      form.setFieldsValue({
        Name: x.Name,
        MemberNo: x.MemberNo,
        DateOfBirthStr: x.DateOfBirthStr,
        Age: x.AgeYears,
        ContactNos: x.ContactNos,
        AppointmentId: AppointmentId,
        Street: x.Street,
        City: x.City,
        Barangay: x.Barangay,
        Sex: x.Sex,
        NatureOfExamination: x.AppointmentTypeDesc,
        Occupation: x.Occupation,
      });
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetDoctors',
      parameters: {},
    });
    if (res) {
      setDoctors(res.parameters.lst);
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetMerDetails',
      parameters: {
        AppointmentId: AppointmentId,
        Type: 'R',
      },
    });
    if (res) {
      if (res.parameters.lst.length > 0) {
        const x: TMer = res.parameters.lst[0];
        console.log(x);
        form.setFieldsValue({
          MerNo: x.MerNo,
          MerDate: dayjs(x.MerDate),
          NatureOfExamination: x.NatureOfExamination,
          FamilyHistory: x.FamilyHistory,
          Allergy: x.Allergy,
          PastDisease: x.PastDisease,
          Others: x.Others,
          Accidents: x.Accidents,
          PresentSymptoms: x.PresentSymptoms,
          Bp: x.Bp,
          Pr: x.Pr,
          Temp: x.Temp,
          Height: x.Height,
          Rr: x.Rr,
          Weight: x.Weight,
          VaLeft: x.VaLeft,
          VaRight: x.VaRight,
          WithCorrectionLeft: x.WithCorrectionLeft,
          WithCorrectionRight: x.WithCorrectionRight,
          Ishihara: x.Ishihara,
          EentStatus: x.EentStatus,
          EentRemarls: x.EentRemarls,
          ChestStatus: x.ChestStatus,
          ChestRemarks: x.ChestRemarks,
          HeartStatus: x.HeartStatus,
          HeartRemarks: x.HeartRemarks,
          AbdomenStatus: x.AbdomenStatus,
          AbdomenRemarks: x.AbdomenRemarks,
          ExtremitiesStatus: x.ExtremitiesStatus,
          ExtremitiesRemarks: x.ExtremitiesRemarks,
          OthersStatus: x.OthersStatus,
          OthersRemarks: decodeReportLineBreaks(x.OthersRemarks),
          AttendingPhysician: x.AttendingPhysician,
          ChestXrayDate: isNullOrUndefinedOrBlank(x.ChestXrayDate)
            ? undefined
            : dayjs(x.ChestXrayDate),
          Lmp: isNullOrUndefinedOrBlank(x.Lmp) ? undefined : dayjs(x.Lmp),
          ChestXrayStudyNo: x.ChestXrayStudyNo,
          ChestXrayView: x.ChestXrayView,
          ChestXrayResult: decodeReportLineBreaks(x.ChestXrayResult),
          UrinalysisDate: isNullOrUndefinedOrBlank(x.UrinalysisDate)
            ? undefined
            : dayjs(x.UrinalysisDate),
          UrinalysisResult: decodeReportLineBreaks(x.UrinalysisResult),
          EcgDate: isNullOrUndefinedOrBlank(x.EcgDate)
            ? undefined
            : dayjs(x.EcgDate),
          EcgResult: decodeReportLineBreaks(x.EcgResult),
          CbcDate: isNullOrUndefinedOrBlank(x.CbcDate)
            ? undefined
            : dayjs(x.CbcDate),
          CbcResult: decodeReportLineBreaks(x.CbcResult),
          FecalysisDate: isNullOrUndefinedOrBlank(x.FecalysisDate)
            ? undefined
            : dayjs(x.FecalysisDate),
          FecalysisResult: decodeReportLineBreaks(x.FecalysisResult),
          DrugTestDate: isNullOrUndefinedOrBlank(x.DrugTestDate)
            ? undefined
            : dayjs(x.DrugTestDate),
          DrugTestResult: decodeReportLineBreaks(x.DrugTestResult),
          TreadmillDate: isNullOrUndefinedOrBlank(x.TreadmillDate)
            ? undefined
            : dayjs(x.TreadmillDate),
          TreadmillResult: decodeReportLineBreaks(x.TreadmillResult),
          EchoDate: isNullOrUndefinedOrBlank(x.EchoDate)
            ? undefined
            : dayjs(x.EchoDate),
          EchoResult: decodeReportLineBreaks(x.EchoResult),
          UltrasoundDate: isNullOrUndefinedOrBlank(x.UltrasoundDate)
            ? undefined
            : dayjs(x.UltrasoundDate),
          UltrasoundResult: decodeReportLineBreaks(x.UltrasoundResult),
          ClassA: x.ClassA,
          ClassB: x.ClassB,
          ClassC: x.ClassC,
          ClassC1: x.ClassC1,
          ClassC2: x.ClassC2,
          ClassD: x.ClassD,
          ClassO: x.ClassO,
          Remarks: decodeReportLineBreaks(x.Remarks),
          EvaluatedBy: x.EvaluatedBy,
          Occupation: x.Occupation,
          Street: x.Street,
          City: x.City,
          Barangay: x.Barangay,
          ClassALabel: x.ClassALabel,
          ClassBLabel: x.ClassBLabel,
          ClassCLabel: x.ClassCLabel,
          ClassC1Label: x.ClassC1Label,
          ClassC2Label: x.ClassC2Label,
          ClassDLabel: x.ClassDLabel,
          ClassOLabel: x.ClassOLabel,
          OthersResult: x.OthersResult,
          Appointment: x.Appointment,
          AppointmentRemarks: x.AppointmentRemarks,
          DisplaySignatureIfAny: x.DisplaySignatureIfAny,
          LmpRemarks: x.LmpRemarks,
        });
        await refreshOnlineResultStatus();
      } else {
        form.setFieldsValue({
          MerDate: dayjs(),
          EentStatus: 'Normal',
          ChestStatus: 'Normal',
          HeartStatus: 'Normal',
          AbdomenStatus: 'Normal',
          ExtremitiesStatus: 'Normal',
          OthersStatus: 'Normal',
        });
        // if (form.getFieldValue('Sex') === 'M') {
        //   form.setFieldsValue({
        //     VaLeft: '20/20',
        //     VaRight: '20/20',
        //   });
        // } else {
        //   form.setFieldsValue({
        //     VaLeft: '20/20',
        //     VaRight: '20/20',
        //   });
        // }
        setIsOnlineResultShown(false);
      }
    }
  };

  const setProcedureDateFromDoneStatus = (
    chargeStatus: TCharges | undefined,
    fieldName: string,
  ) => {
    const isDone =
      String(chargeStatus?.Status ?? '')
        .trim()
        .toUpperCase() === 'DONE';
    const statusDate = dayjs(chargeStatus?.StatusDate);

    if (isDone && statusDate.isValid()) {
      form.setFieldValue(fieldName, statusDate);
    }
  };

  const formatProcedureDoneDate = (chargeStatus?: TCharges) => {
    const isDone =
      String(chargeStatus?.Status ?? '')
        .trim()
        .toUpperCase() === 'DONE';

    if (!isDone) {
      return '';
    }

    const date = dayjs(chargeStatus?.StatusDate);

    return date.isValid() ? date.format('MM/DD/YYYY') : '';
  };

  const handleGetProcedureStatus = async () => {
    try {
      ///chest xray
      let res = await PostData('GetRecords', {
        sp: 'udp_GetChestXRayStatus',
        parameters: {
          AppointmentId: AppointmentId,
        },
      });
      const chestXray = res.parameters.lst[0];
      setChestXrayStatus(chestXray);
      setProcedureDateFromDoneStatus(chestXray, 'ChestXrayDate');
      if (
        res &&
        res.parameters.lst.length > 0 &&
        res.parameters.lst[0].ResultId
      ) {
        var studyno = await PostData('GetRecords', {
          sp: 'udp_GetRadiologyResult',
          parameters: {
            Id: res.parameters.lst[0].ResultId,
          },
        });
        console.log(studyno);
        if (studyno) {
          form.setFieldsValue({
            ChestXrayStudyNo: studyno.parameters.lst[0].StudyNo,
          });
        }
      }
      res = await PostData('GetRecords', {
        sp: 'udp_GetMerProcedureStatus',
        parameters: {
          AppointmentId: AppointmentId,
          ItemId: 2019,
        },
      });
      if (res) {
        const urinalysis = res.parameters.lst[0];
        setUrinalysisStatus(urinalysis);
        setProcedureDateFromDoneStatus(urinalysis, 'UrinalysisDate');
      }

      res = await PostData('GetRecords', {
        sp: 'udp_GetMerProcedureStatus',
        parameters: {
          AppointmentId: AppointmentId,
          ItemId: 2003,
        },
      });
      if (res) {
        const cbc = res.parameters.lst[0];
        setCbcStatus(cbc);
        setProcedureDateFromDoneStatus(cbc, 'CbcDate');
      }
      res = await PostData('GetRecords', {
        sp: 'udp_GetMerProcedureStatus',
        parameters: {
          AppointmentId: AppointmentId,
          ItemId: 2043,
        },
      });
      if (res) {
        const fecalysis = res.parameters.lst[0];
        setFecalysisStatus(fecalysis);
        setProcedureDateFromDoneStatus(fecalysis, 'FecalysisDate');
      }
      res = await PostData('GetRecords', {
        sp: 'udp_GetMerProcedureStatus',
        parameters: {
          AppointmentId: AppointmentId,
          ItemId: 2187,
        },
      });
      if (res) {
        const drugTest = res.parameters.lst[0];
        setDrugTestStatus(drugTest);
        setProcedureDateFromDoneStatus(drugTest, 'DrugTestDate');
      }
      res = await PostData('GetRecords', {
        sp: 'udp_GetMerProcedureStatus',
        parameters: {
          AppointmentId: AppointmentId,
          ItemId: 2284,
        },
      });
      if (res) {
        const treadmill = res.parameters.lst[0];
        setTreadmillStatus(treadmill);
        setProcedureDateFromDoneStatus(treadmill, 'TreadmillDate');
      }
      res = await PostData('GetRecords', {
        sp: 'udp_GetMerProcedureStatus',
        parameters: {
          AppointmentId: AppointmentId,
          ItemId: 2283,
        },
      });
      if (res) {
        const ecg = res.parameters.lst[0];
        setEcgStatus(ecg);
        setProcedureDateFromDoneStatus(ecg, 'EcgDate');
      }

      res = await PostData('GetRecords', {
        sp: 'udp_GetMerProcedureStatus',
        parameters: {
          AppointmentId: AppointmentId,
          ItemId: 2285,
        },
      });
      if (res) {
        const echo = res.parameters.lst[0];
        setEchoStatus(echo);
        setProcedureDateFromDoneStatus(echo, 'EchoDate');
      }
      res = await PostData('GetRecords', {
        sp: 'udp_GetMerProcedureUltrasoundStatus',
        parameters: {
          AppointmentId: AppointmentId,
        },
      });
      if (res) {
        const ultrasound = res.parameters.lst[0];
        setultrasoundStatus(ultrasound);
        setProcedureDateFromDoneStatus(ultrasound, 'UltrasoundDate');
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'bottomRight',
        duration: 3,
      });
    }
  };
  const fetchMerPdf = async () => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport';
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'blob',
      params: {
        ReportName: 'mer.rdl',
        AppointmentId: AppointmentId,
        BranchCode: store.branchCode,
      },
    });

    return new Blob([response.data], {
      type: 'application/pdf',
    });
  };

  const handlePrint = async () => {
    try {
      setIsSubmitting(true);
      const data = window.URL.createObjectURL(await fetchMerPdf());

      const a = document.createElement('a');

      a.setAttribute('href', data);
      a.setAttribute('target', '_blank');

      a.click();
      setIsSubmitting(false);
    } catch (error: any) {
      setIsSubmitting(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };

  const handleOnlineResult = async (v: any) => {
    setShowFinalize(false);
    if (merResultId <= 0 || isNullOrUndefinedOrBlank(merNo)) {
      notification.error({
        message: 'Please save the MER first.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
      if (isOnlineResultShown) {
        res = await PostData('UnshowPdfFile', {
          ResultId: merResultId,
          ResultType: onlineResultType,
          Username: v.Username,
          Password: v.Password,
        });
      } else {
        const pdf = await blobToDataUrl(await fetchMerPdf());
        res = await PostData('UploadPdfFile', {
          ResultId: merResultId,
          ResultType: onlineResultType,
          fk_Appointments_Id: merResultId,
          Description: onlineResultDescription,
          ShowInCompanyPortal: 'Y',
          Pdf: pdf,
          Username: v.Username,
          Password: v.Password,
        });
      }

      if (res) {
        setIsSubmitting(false);
        if (res.status === 1) {
          notification.success({
            message: isOnlineResultShown
              ? 'Result hidden from online results.'
              : 'Result shown to online results.',
            placement: 'topRight',
            duration: 3,
          });
          await refreshOnlineResultStatus();
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
      setIsSubmitting(false);
    } catch (error: any) {
      setIsSubmitting(false);
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const handleSetFamilyMed = (
    selectedFamilyMedicalHistory = selectedFamMed,
  ) => {
    let s: string = '';
    selectedFamilyMedicalHistory.forEach((v: TMerOthers) => {
      if (isNullOrUndefinedOrBlank(v.Description)) {
        return;
      }

      if (s === '') {
        s = v.Description!;
      } else {
        s = s + ',' + v.Description!;
      }
    });
    form.setFieldValue('FamilyHistory', s);
  };
  const handleShowFamilyMedHistory = () => {
    const familyHistory = form.getFieldValue('FamilyHistory');
    const descriptions = isNullOrUndefinedOrBlank(familyHistory)
      ? []
      : familyHistory
          .split(',')
          .map((description: string) => description.trim())
          .filter(Boolean);

    setSelectedFamMed(
      familyMedicalHistory.filter(
        (v) => v.Description && descriptions.includes(v.Description),
      ),
    );
    setShowFamilyMedHistory(true);
  };
  const handleFamMedCheckChange = (rowData: TMerOthers, checked: boolean) => {
    const value = checked
      ? [...selectedFamMed, rowData]
      : selectedFamMed.filter((v) => v.Id !== rowData.Id);

    setSelectedFamMed(value);
    handleSetFamilyMed(value);
  };
  const handleSetOthers = (selectedOtherHistory = selectedOthers) => {
    form.setFieldValue(
      'Others',
      selectedOtherHistory
        .map((v) => v.Description)
        .filter((description) => !isNullOrUndefinedOrBlank(description))
        .join(', '),
    );
  };
  const handleShowOthersHistory = () => {
    const others = form.getFieldValue('Others');
    const descriptions = isNullOrUndefinedOrBlank(others)
      ? []
      : others
          .split(',')
          .map((description: string) => description.trim())
          .filter(Boolean);

    setSelectedOthers(
      otherMedicalHistory.filter(
        (v) => v.Description && descriptions.includes(v.Description),
      ),
    );
    setShowOthersHistory(true);
  };
  const handleOthersCheckChange = (rowData: TMerOthers, checked: boolean) => {
    const value = checked
      ? [...selectedOthers, rowData]
      : selectedOthers.filter((v) => v.Id !== rowData.Id);

    setSelectedOthers(value);
    handleSetOthers(value);
  };
  const handleSubmitForm = async (v: TMer) => {
    setIsSubmitting(true);
    try {
      const valuesToSave = {
        ...v,

        MerDate: isNullOrUndefinedOrBlank(v.MerDate)
          ? undefined
          : dayjs(v.MerDate).format('YYYY-MM-DD'),
        ChestXrayDate: isNullOrUndefinedOrBlank(v.ChestXrayDate)
          ? undefined
          : dayjs(v.ChestXrayDate).format('YYYY-MM-DD'),
        UrinalysisDate: isNullOrUndefinedOrBlank(v.UrinalysisDate)
          ? undefined
          : dayjs(v.UrinalysisDate).format('YYYY-MM-DD'),
        EcgDate: isNullOrUndefinedOrBlank(v.EcgDate)
          ? undefined
          : dayjs(v.EcgDate).format('YYYY-MM-DD'),
        CbcDate: isNullOrUndefinedOrBlank(v.CbcDate)
          ? undefined
          : dayjs(v.CbcDate).format('YYYY-MM-DD'),
        FecalysisDate: isNullOrUndefinedOrBlank(v.FecalysisDate)
          ? undefined
          : dayjs(v.FecalysisDate).format('YYYY-MM-DD'),
        DrugTestDate: isNullOrUndefinedOrBlank(v.DrugTestDate)
          ? undefined
          : dayjs(v.DrugTestDate).format('YYYY-MM-DD'),
        TreadmillDate: isNullOrUndefinedOrBlank(v.TreadmillDate)
          ? undefined
          : dayjs(v.TreadmillDate).format('YYYY-MM-DD'),
        EchoDate: isNullOrUndefinedOrBlank(v.EchoDate)
          ? undefined
          : dayjs(v.EchoDate).format('YYYY-MM-DD'),
        UltrasoundDate: isNullOrUndefinedOrBlank(v.UltrasoundDate)
          ? undefined
          : dayjs(v.UltrasoundDate).format('YYYY-MM-DD'),
        ChestXrayResult: encodeReportLineBreaks(v.ChestXrayResult),
        UrinalysisResult: encodeReportLineBreaks(v.UrinalysisResult),
        EcgResult: encodeReportLineBreaks(v.EcgResult),
        CbcResult: encodeReportLineBreaks(v.CbcResult),
        FecalysisResult: encodeReportLineBreaks(v.FecalysisResult),
        DrugTestResult: encodeReportLineBreaks(v.DrugTestResult),
        TreadmillResult: encodeReportLineBreaks(v.TreadmillResult),
        EchoResult: encodeReportLineBreaks(v.EchoResult),
        UltrasoundResult: encodeReportLineBreaks(v.UltrasoundResult),
        OthersRemarks: encodeReportLineBreaks(v.OthersRemarks),
        Remarks: encodeReportLineBreaks(v.Remarks),
        Type: 'R',
      };

      // console.log(valuesToSave);
      const res = await PostData('SaveMer', valuesToSave);

      if (res) {
        setIsSubmitting(false);
        if (res.status === 1) {
          form.setFieldsValue({
            MerNo: res.parameters.MerNo,
          });
          await refreshOnlineResultStatus();

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
      }
    } catch (error: any) {
      setIsSubmitting(false);
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const handleWithAccess = async () => {
    const res = await auth.isWithAccess(24);
    if (res === false) {
      notification.error({
        message: 'Access denied-MER',
        placement: 'topRight',
        duration: 3,
      });
      router.navigate({
        to: '/',
      });
    }
  };
  const handleChangeOtherResult = () => {
    const v: TMerOtherTests = formOtherServices.getFieldsValue();
    let otherResult: string = '';

    if (v.StoolCs === true) {
      otherResult = 'Stool c/s-' + v.StoolCsValue;
    }

    if (v.HbSag === true) {
      if (otherResult === '') {
        otherResult = 'HBsAg-' + v.HbSagValue;
      } else {
        otherResult = otherResult + ',' + 'HBsAg-' + v.HbSagValue;
      }
    }
    if (v.HepaAIgM === true) {
      if (otherResult === '') {
        otherResult = 'Hepa A-IgM-' + v.HepaAIgMValue;
      } else {
        otherResult = otherResult + ',' + 'Hepa A-IgM-' + v.HepaAIgMValue;
      }
    }
    if (v.AntiHav === true) {
      if (otherResult === '') {
        otherResult = 'Anti-HAV-IgG-' + v.AntiHavValue;
      } else {
        otherResult = otherResult + ',' + 'Anti-HAV-IgG -' + v.AntiHavValue;
      }
    }

    if (v.AntiHbs === true) {
      if (otherResult === '') {
        otherResult = 'ANTI-HBS-' + v.AntiHbsValue;
      } else {
        otherResult = otherResult + ',' + 'ANTI-HBS-' + v.AntiHbsValue;
      }
    }
    if (v.HepaAIgG === true) {
      if (otherResult === '') {
        otherResult = 'Hepa A-IgG-' + v.HepaAIgGValue;
      } else {
        otherResult = otherResult + ',' + 'Hepa A-IgG-' + v.HepaAIgGValue;
      }
    }
    if (v.Rpr === true) {
      if (otherResult === '') {
        otherResult = 'RPR-' + v.RprValue;
      } else {
        otherResult = otherResult + ',' + 'RPR-' + v.RprValue;
      }
    }
    if (v.AntiHavIgM === true) {
      if (otherResult === '') {
        otherResult = 'Anti-Hav-IgM-' + v.AntiHavIgMValue;
      } else {
        otherResult = otherResult + ',' + 'Anti-Hav-IgM-' + v.AntiHavIgMValue;
      }
    }

    if (v.Glucose === true) {
      if (otherResult === '') {
        otherResult = 'Glucose-' + v.GlucoseValue2 + '-' + v.GlucoseValue;
      } else {
        otherResult =
          otherResult + ',Glucose-' + v.GlucoseValue2 + '-' + v.GlucoseValue;
      }
    }
    if (v.Creatinine === true) {
      if (otherResult === '') {
        otherResult =
          'Creatinine-' + v.CreatinineValue2 + '-' + v.CreatinineValue;
      } else {
        otherResult =
          otherResult +
          ',Creatinine-' +
          v.CreatinineValue2 +
          '-' +
          v.CreatinineValue;
      }
    }

    if (v.Urea === true) {
      if (otherResult === '') {
        otherResult = 'Urea-' + v.UreaValue2 + '-' + v.UreaValue;
      } else {
        otherResult =
          otherResult + ',Creatinine-' + v.UreaValue2 + '-' + v.UreaValue;
      }
    }

    if (v.UricAcid === true) {
      if (otherResult === '') {
        otherResult = 'Uric Acid-' + v.UricAcidValue2 + '-' + v.UricAcidValue;
      } else {
        otherResult =
          otherResult +
          ',Uric Acid-' +
          v.UricAcidValue2 +
          '-' +
          v.UricAcidValue;
      }
    }
    if (v.Cholesterol === true) {
      if (otherResult === '') {
        otherResult =
          'Cholesterol-' + v.CholesterolValue2 + '-' + v.CholesterolValue;
      } else {
        otherResult =
          otherResult +
          ',Cholesterol-' +
          v.CholesterolValue2 +
          '-' +
          v.CholesterolValue;
      }
    }
    if (v.Hdl === true) {
      if (otherResult === '') {
        otherResult = 'HDL-' + v.HdlValue2 + '-' + v.HdlValue;
      } else {
        otherResult = otherResult + ',HDL-' + v.HdlValue2 + '-' + v.HdlValue;
      }
    }

    if (v.Sgpt === true) {
      if (otherResult === '') {
        otherResult = 'Sgpt-' + v.SgptValue2 + '-' + v.SgptValue;
      } else {
        otherResult = otherResult + ',Sgpt-' + v.SgptValue2 + '-' + v.SgptValue;
      }
    }
    if (v.Globulin === true) {
      if (otherResult === '') {
        otherResult = 'Globulin-' + v.GlobulinValue2 + '-' + v.GlobulinValue;
      } else {
        otherResult =
          otherResult + ',Globulin-' + v.GlobulinValue2 + '-' + v.GlobulinValue;
      }
    }
    if (v.Tsh === true) {
      if (otherResult === '') {
        otherResult = 'Tsh-' + v.TshValue2 + '-' + v.TshValue;
      } else {
        otherResult = otherResult + ',Tsh-' + v.TshValue2 + '-' + v.TshValue;
      }
    }

    if (v.Ft4 === true) {
      if (otherResult === '') {
        otherResult = 'Ft4-' + v.Ft4Value2 + '-' + v.Ft4Value;
      } else {
        otherResult = otherResult + ',Ft4-' + v.Ft4Value2 + '-' + v.Ft4Value;
      }
    }

    if (v.Sodium === true) {
      if (otherResult === '') {
        otherResult = 'Sodium-' + v.SodiumValue2 + '-' + v.SodiumValue;
      } else {
        otherResult =
          otherResult + ',Sodium-' + v.SodiumValue2 + '-' + v.SodiumValue;
      }
    }

    if (v.Triglycerides === true) {
      if (otherResult === '') {
        otherResult =
          'Triglycerides-' + v.TriglyceridesValue2 + '-' + v.TriglyceridesValue;
      } else {
        otherResult =
          otherResult +
          ',Triglycerides-' +
          v.TriglyceridesValue2 +
          '-' +
          v.TriglyceridesValue;
      }
    }

    if (v.Ldl === true) {
      if (otherResult === '') {
        otherResult = 'Ldl-' + v.LdlValue2 + '-' + v.LdlValue;
      } else {
        otherResult = otherResult + ',Ldl-' + v.LdlValue2 + '-' + v.LdlValue;
      }
    }

    if (v.Sgot === true) {
      if (otherResult === '') {
        otherResult = 'Sgot-' + v.SgotValue2 + '-' + v.SgotValue;
      } else {
        otherResult = otherResult + ',Sgot-' + v.SgotValue2 + '-' + v.SgotValue;
      }
    }

    if (v.HbA1c === true) {
      if (otherResult === '') {
        otherResult = 'HbA1c-' + v.HbA1cValue2 + '-' + v.HbA1cValue;
      } else {
        otherResult =
          otherResult + ',HbA1c-' + v.HbA1cValue2 + '-' + v.HbA1cValue;
      }
    }

    if (v.Ft3 === true) {
      if (otherResult === '') {
        otherResult = 'Ft3-' + v.Ft3Value2 + '-' + v.Ft3Value;
      } else {
        otherResult = otherResult + ',Ft3-' + v.Ft3Value2 + '-' + v.Ft3Value;
      }
    }

    formOtherServices.setFieldValue('OtherResult', otherResult);
    form.setFieldValue('OthersResult', otherResult);
  };
  useEffect(() => {
    handleWithAccess();
    handleInitialize();
    handleGetAppointmentDetails();
    handleGetProcedureStatus();
  }, []);

  const evaluatedBy = Form.useWatch('EvaluatedBy', form);

  const renderReactiveOtherTest = (
    test: (typeof reactiveOtherTests)[number],
  ) => (
    <div
      key={String(test.checkName)}
      className="min-h-[76px] rounded border border-slate-200 bg-white px-3 py-2"
    >
      <Form.Item name={test.checkName} valuePropName="checked" noStyle>
        <Checkbox className="font-medium">{test.label}</Checkbox>
      </Form.Item>
      <Form.Item name={test.valueName} noStyle>
        <Radio.Group className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <Radio value="Reactive">Reactive</Radio>
          <Radio value="Non Reactive">Non Reactive</Radio>
        </Radio.Group>
      </Form.Item>
    </div>
  );

  const renderNormalOtherTest = (test: (typeof normalOtherTests)[number]) => (
    <div
      key={String(test.checkName)}
      className="min-h-[84px] rounded border border-slate-200 bg-white px-3 py-2"
    >
      <Form.Item name={test.checkName} valuePropName="checked" noStyle>
        <Checkbox className="font-medium">{test.label}</Checkbox>
      </Form.Item>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_112px] items-center gap-2">
        <Form.Item name={test.resultName} noStyle>
          <Radio.Group className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
            <Radio value="Normal">Normal</Radio>
            <Radio value="Not Normal">Not Normal</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={test.unitName} initialValue={test.unit} noStyle>
          <Input size="small" />
        </Form.Item>
      </div>
    </div>
  );

  return (
    <div className="cardBackGround">
      <Divider>MEDICAL EVALUATION REPORT</Divider>
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
        onFinish={handleSubmitForm}
        initialValues={{ DisplaySignatureIfAny: 'Y' }}
      >
        <div className="font-bold text-xl text-center">
          PATIENT'S INFORMATION
        </div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="Name" label="Name" className="col-span-2">
            <Input readOnly className="font-bold" />
          </Form.Item>
          <Form.Item name="MerNo" label="MER No." className="col-span-2">
            <Input readOnly className="font-bold" />
          </Form.Item>
          <Form.Item
            name="MerDate"
            label="MER Date"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <DatePicker disabled format="MM/DD/YYYY" />
          </Form.Item>
          <Form.Item name="AppointmentId" label="Appointment Id">
            <Input readOnly className="font-bold" />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="NatureOfExamination" label="Nature Of Examination">
            <Input />
          </Form.Item>
          <Form.Item name="MemberNo" label="Member No.">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="DateOfBirthStr" label="Birthday">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="Age" label="Age">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="Occupation" label="Occupation">
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
            >
              {occupation.data &&
                occupation.data!.map((v: any) => (
                  <AutoComplete.Option
                    key={v.Value}
                    value={v.Value}
                    title={v.Value}
                  >
                    {v.Value}
                  </AutoComplete.Option>
                ))}
            </AutoComplete>
          </Form.Item>
          <Form.Item name="ContactNos" label="Contact Nos.">
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-5 gap-4">
          <Form.Item name="Sex" label="Sex">
            <Select allowClear>
              <Select.Option value="Male">Male</Select.Option>
              <Select.Option value="Female">Female</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="Street"
            label="Street"
            className="col-span-2"
            normalize={(v) => (v ? String(v).toUpperCase() : v)}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="City"
            label="City/Municipality"
            normalize={(v) => (v ? String(v).toUpperCase() : v)}
          >
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
            >
              {city.data &&
                city.data!.map((v: TSettings) => (
                  <AutoComplete.Option
                    key={v.Id}
                    value={v.Value}
                    title={v.Value}
                  >
                    {v.Value}
                  </AutoComplete.Option>
                ))}
            </AutoComplete>
          </Form.Item>
          <Form.Item name="Barangay" label="Barangay">
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
            >
              {barangay.data &&
                barangay.data!.map((v: TSettings) => (
                  <AutoComplete.Option
                    key={v.Id}
                    value={v.Value}
                    title={v.Value}
                  >
                    {v.Value}
                  </AutoComplete.Option>
                ))}
            </AutoComplete>
          </Form.Item>
        </div>
        <div className="font-bold text-xl text-center mb-2">
          SIGNIFICANT MEDICAL HISTORY
        </div>
        <div className="grid lg:grid-cols-12 gap-4">
          <Form.Item
            name="FamilyHistory"
            label="Family History"
            className="col-span-5"
          >
            <Input />
          </Form.Item>
          <div className="flex justify-start items-center">
            <Button
              icon={<FaBars />}
              type="primary"
              onClick={handleShowFamilyMedHistory}
            />
          </div>
          <Form.Item name="Allergy" label="Allergy" className="col-span-6">
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-12 gap-4">
          <Form.Item
            name="PastDisease"
            label="Past Disease"
            className="col-span-6"
          >
            <Input />
          </Form.Item>

          <Form.Item name="Others" label="Others" className="col-span-5">
            <Input />
          </Form.Item>
          <div className="flex justify-start items-center">
            <Button
              icon={<FaBars />}
              type="primary"
              onClick={handleShowOthersHistory}
            />
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Form.Item name="Accidents" label="Accident’s/Operations">
            <Input />
          </Form.Item>

          <Form.Item name="PresentSymptoms" label="Present Symptoms">
            <Input />
          </Form.Item>
        </div>
        <div className="font-bold text-xl mb-2">VITAL SIGNS</div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="Bp" label="Blood Pressure">
            <Input />
          </Form.Item>
          <Form.Item name="Pr" label="Pulse Rate">
            <Input />
          </Form.Item>
          <Form.Item name="Temp" label="Temperature">
            <Input />
          </Form.Item>
          <Form.Item name="Rr" label="Respiratory Rate">
            <Input />
          </Form.Item>
          <Form.Item name="Height" label="Height">
            <Input />
          </Form.Item>
          <Form.Item name="Weight" label="Weight">
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-6 gap-4">
          {form.getFieldValue('Sex') === 'Female' && (
            <>
              <Form.Item name="Lmp" label="Last menstrual period (LMP)">
                <DatePicker />
              </Form.Item>
              <Form.Item name="LmpRemarks" label="LMP Remarks">
                <Input />
              </Form.Item>
            </>
          )}
        </div>

        <div className="font-bold text-xl mb-2">VISUAL EXAMINATION</div>
        <div className="grid lg:grid-cols-6 gap-4">
          <Form.Item name="VaLeft" label="Visual Acuity (Left)">
            <Input />
          </Form.Item>
          <Form.Item name="VaRight" label="Visual Acuity (Right)">
            <Input />
          </Form.Item>
          <Form.Item name="WithCorrectionLeft" label="With Correction (Left)">
            <Input />
          </Form.Item>
          <Form.Item name="WithCorrectionRight" label="With Correction (Right)">
            <Input />
          </Form.Item>
          <Form.Item name="Ishihara" label="Ishihara">
            <Input />
          </Form.Item>
        </div>
        <div className="font-bold text-xl mb-2 text-center">FINDINGS</div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="font-bold text-xl mb-2">PHYSICAL EXAMINATION</div>
          <div className="font-bold text-xl mb-2">STATUS</div>
          <div className="font-bold text-xl mb-2">REMARKS</div>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">EENT</div>
          <Form.Item name="EentStatus" noStyle>
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
              style={{ width: '100%' }}
            >
              {peStatus!.map((v: any) => (
                <AutoComplete.Option key={v.Id} value={v.Value} title={v.Value}>
                  {v.Value}
                </AutoComplete.Option>
              ))}
            </AutoComplete>
          </Form.Item>
          <Form.Item name="EentRemarls" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">CHEST/LUNGS</div>
          <Form.Item name="ChestStatus" noStyle>
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
              style={{ width: '100%' }}
            >
              {peStatus!.map((v: any) => (
                <AutoComplete.Option key={v.Id} value={v.Value} title={v.Value}>
                  {v.Value}
                </AutoComplete.Option>
              ))}
            </AutoComplete>
          </Form.Item>
          <Form.Item name="ChestRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">HEART</div>
          <Form.Item name="HeartStatus" noStyle>
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
              style={{ width: '100%' }}
            >
              {peStatus!.map((v: any) => (
                <AutoComplete.Option key={v.Id} value={v.Value} title={v.Value}>
                  {v.Value}
                </AutoComplete.Option>
              ))}
            </AutoComplete>
          </Form.Item>
          <Form.Item name="HeartRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">ABDOMEN</div>
          <Form.Item name="AbdomenStatus" noStyle>
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
              style={{ width: '100%' }}
            >
              {peStatus!.map((v: any) => (
                <AutoComplete.Option key={v.Id} value={v.Value} title={v.Value}>
                  {v.Value}
                </AutoComplete.Option>
              ))}
            </AutoComplete>
          </Form.Item>
          <Form.Item name="AbdomenRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">EXTREMITIES</div>
          <Form.Item name="ExtremitiesStatus" noStyle>
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
              style={{ width: '100%' }}
            >
              {peStatus!.map((v: any) => (
                <AutoComplete.Option key={v.Id} value={v.Value} title={v.Value}>
                  {v.Value}
                </AutoComplete.Option>
              ))}
            </AutoComplete>
          </Form.Item>
          <Form.Item name="ExtremitiesRemarks" noStyle>
            <Input />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="font-bold">OTHERS</div>
          <Form.Item name="OthersStatus" noStyle>
            <AutoComplete
              filterOption={(inputValue, option) =>
                option!
                  .value!.toString()
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
              style={{ width: '100%' }}
            >
              {peStatus!.map((v: any) => (
                <AutoComplete.Option key={v.Id} value={v.Value} title={v.Value}>
                  {v.Value}
                </AutoComplete.Option>
              ))}
            </AutoComplete>
          </Form.Item>
          <Form.Item name="OthersRemarks" noStyle>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <Form.Item label="Attending Physician" name="AttendingPhysician">
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
              {doctors &&
                doctors.map((d: TDoctors) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                    {d.Name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">CHEST-XRAY</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{chestXrayStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{chestXrayStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(chestXrayStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{chestXrayStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="ChestXrayDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="ChestXrayStudyNo" label="Study No.">
                <Input />
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="ChestXrayView" label="View">
                <Input />
              </Form.Item>
              <Form.Item name="ChestXrayResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">URINALYSIS</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{urinalysisStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{urinalysisStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(urinalysisStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{urinalysisStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="UrinalysisDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="UrinalysisResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">ECG</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{ecgStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{ecgStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(ecgStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{ecgStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="EcgDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="EcgResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">CBC</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{cbcStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{cbcStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(cbcStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{cbcStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="CbcDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="CbcResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">FECALYSIS</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{fecalysisStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{fecalysisStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(fecalysisStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{fecalysisStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="FecalysisDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="FecalysisResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">DRUG TEST</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{drugTestStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{drugTestStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(drugTestStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{drugTestStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="DrugTestDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="DrugTestResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">TREADMILL</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{treadmillStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{treadmillStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(treadmillStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{treadmillStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="TreadmillDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="TreadmillResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">2D ECHO</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{echoStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{echoStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(echoStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{echoStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="EchoDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="EchoResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <div className="cardBackGround">
            <div className="font-bold">ULTRASOUND</div>
            <div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Status</p>
                  <p className="font-bold">{ultrasoundStatus?.Status}</p>
                </div>
                <div>
                  <p>Set By</p>
                  <p className="font-bold">{ultrasoundStatus?.StatusSetBy}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p>Date Done</p>
                  <p className="font-bold">
                    {formatProcedureDoneDate(ultrasoundStatus)}
                  </p>
                </div>
                <div>
                  <p>Remarks</p>
                  <p className="font-bold">{ultrasoundStatus?.StatusRemarks}</p>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Form.Item name="UltrasoundDate" label="Date">
                <DatePicker format="MM/DD/YYYY" />
              </Form.Item>
              <Form.Item name="UltrasoundResult" label="Result">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
          </div>
          <div className="cardBackGround">
            <div className="font-bold">OTHERS</div>

            <Form.Item name="OthersResult" label="Result">
              <Input.TextArea rows={6} />
            </Form.Item>
            <Button type="primary" onClick={() => setShowOtherServices(true)}>
              Other Services
            </Button>
          </div>
        </div>
        <div className="font-bold text-xl text-center">EVALUATION</div>
        <div className="font-bold">
          I certify that I have examined and found the examinee to be:
        </div>
        <div className="flex flex-row">
          <Form.Item
            name="ClassA"
            label="Class A"
            noStyle
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            name="ClassALabel"
            noStyle
            initialValue={'Class A - Medically fit for employment'}
          >
            <Input />
          </Form.Item>
        </div>
        <div className="flex flex-row">
          <Form.Item
            name="ClassB"
            label="Class B"
            noStyle
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            name="ClassBLabel"
            noStyle
            initialValue={
              'Class B – Medically fit for employment with manageable findings:'
            }
          >
            <Input />
          </Form.Item>
        </div>
        <div className="flex flex-row">
          <Form.Item
            name="ClassC"
            label="Class C"
            noStyle
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            name="ClassCLabel"
            noStyle
            initialValue={'Class C – Employable but requires:'}
          >
            <Input />
          </Form.Item>
        </div>
        <div className="flex flex-row ml-4">
          <Form.Item
            name="ClassC1"
            label="Class C"
            noStyle
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            name="ClassC1Label"
            initialValue={'Regular follow-up treatment/periodic evaluation.'}
            className="w-full"
          >
            <Input />
          </Form.Item>
        </div>
        <div className="flex flex-row ml-4">
          <Form.Item
            name="ClassC2"
            label="Class C"
            noStyle
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            name="ClassC2Label"
            noStyle
            initialValue={
              'Special placement at work or limited duty in a special assignment'
            }
          >
            <Input />
          </Form.Item>
        </div>
        <div className="flex flex-row ml-4">
          <Form.Item
            name="ClassD"
            label="Class D"
            noStyle
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            name="ClassDLabel"
            noStyle
            initialValue={'Class D- Medically unfit for employment'}
          >
            <Input />
          </Form.Item>
        </div>
        <div className="flex flex-row ml-4">
          <Form.Item
            name="ClassO"
            label="Class O"
            noStyle
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            name="ClassOLabel"
            noStyle
            initialValue={'Class O – Pending due to:'}
          >
            <Input />
          </Form.Item>
        </div>

        <div className="py-5">
          <Form.Item className="!mb-1" name="Remarks" label="Remarks">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} />
          </Form.Item>
          <Checkbox
            className="mb-4 font-bold"
            checked={String(evaluationRemarks ?? '').includes(
              fecalysisClassificationRemark,
            )}
            onChange={(e) =>
              handleFecalysisClassificationRemarkChange(e.target.checked)
            }
          >
            {fecalysisClassificationRemark}
          </Checkbox>
        </div>
        <div className="grid grid-cols-6 gap-2">
          <Form.Item name="Appointment" label="Appointment">
            <Select allowClear>
              <Select.Option key="F" value="Follow-Up">
                Follow-Up
              </Select.Option>
              <Select.Option key="O" value="Others">
                Others
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="AppointmentRemarks"
            label="Remarks"
            className="col-span-3"
          >
            <Input />
          </Form.Item>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Form.Item
            label="Evaluated By"
            name="EvaluatedBy"
            // rules={[
            //   {
            //     required: true,
            //   },
            // ]}
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
              {doctors &&
                doctors.map((d: TDoctors) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                    {d.Name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <div>
            <Form.Item
              name="DisplaySignatureIfAny"
              label="Display signature if any."
            >
              <Select>
                <Select.Option key="Y" value="Y">
                  Yes
                </Select.Option>
                <Select.Option key="N" value="N">
                  No
                </Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="flex justify-start items-center">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                disabled={isOnlineResultShown}
              >
                Submit
              </Button>
              <Button
                type="primary"
                onClick={handlePrint}
                loading={isSubmitting}
                disabled={
                  isNullOrUndefinedOrBlank(merNo) ||
                  isNullOrUndefinedOrBlank(evaluatedBy)
                }
              >
                Print
              </Button>
              <Button
                type="primary"
                onClick={() => setShowFinalize(true)}
                loading={isSubmitting}
                disabled={isNullOrUndefinedOrBlank(merNo)}
              >
                {isOnlineResultShown
                  ? 'Unshow Online Result'
                  : 'Show to Online Results'}
              </Button>
            </Space>
          </div>
        </div>
      </Form>

      <Modal
        open={showFamilyMedHistory}
        onCancel={() => setShowFamilyMedHistory(false)}
        footer={false}
        width={400}
      >
        <DataTable
          dataKey="Id"
          value={familyMedicalHistory}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          selectionMode="multiple"
          selection={selectedFamMed}
          onSelectionChange={(e: any) => {
            const value = e.value as TMerOthers[];
            setSelectedFamMed(value);
            handleSetFamilyMed(value);
          }}
        >
          <Column
            body={(rowData: TMerOthers) => (
              <Checkbox
                checked={selectedFamMed.some((v) => v.Id === rowData.Id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  handleFamMedCheckChange(rowData, e.target.checked)
                }
              />
            )}
            headerStyle={{ width: '3rem' }}
          ></Column>
          <Column
            field="Description"
            header="Description"
            style={{ minWidth: '12rem' }}
          ></Column>
        </DataTable>
      </Modal>
      <Modal
        open={showOthersHistory}
        onCancel={() => setShowOthersHistory(false)}
        footer={false}
        width={400}
      >
        <DataTable
          dataKey="Id"
          value={otherMedicalHistory}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          selectionMode="multiple"
          selection={selectedOthers}
          onSelectionChange={(e: any) => {
            const value = e.value as TMerOthers[];
            setSelectedOthers(value);
            handleSetOthers(value);
          }}
        >
          <Column
            body={(rowData: TMerOthers) => (
              <Checkbox
                checked={selectedOthers.some((v) => v.Id === rowData.Id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  handleOthersCheckChange(rowData, e.target.checked)
                }
              />
            )}
            headerStyle={{ width: '3rem' }}
          ></Column>
          <Column
            field="Description"
            header="Description"
            style={{ minWidth: '12rem' }}
          ></Column>
        </DataTable>
      </Modal>
      <Modal
        open={showOtherServices}
        onCancel={() => setShowOtherServices(false)}
        footer={false}
        width={1200}
        destroyOnClose
      >
        <Form
          form={formOtherServices}
          layout="vertical"
          onChange={handleChangeOtherResult}
        >
          <Divider>Other Tests</Divider>
          <div className="space-y-4">
            <section>
              {/* <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Serology / Immunology
              </div> */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {reactiveOtherTests.map(renderReactiveOtherTest)}
              </div>
            </section>

            <section>
              {/* <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Chemistry / Other Tests
              </div> */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {normalOtherTests.map(renderNormalOtherTest)}
              </div>
            </section>

            <Form.Item name="OtherResult" label="Other Result">
              <Input.TextArea rows={4} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
      <Modal
        open={showFinalize}
        destroyOnClose
        onCancel={() => setShowFinalize(false)}
        footer={false}
      >
        <FinalizeForm
          handleFinalizeResult={handleOnlineResult}
          title={
            isOnlineResultShown
              ? 'Unshow Online Result'
              : 'Show to Online Results'
          }
          submitText={isOnlineResultShown ? 'Unshow' : 'Show'}
        />
      </Modal>
    </div>
  );
};
