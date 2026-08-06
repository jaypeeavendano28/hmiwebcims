import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { Helmet } from 'react-helmet';
import {
  AutoComplete,
  Avatar,
  Button,
  Collapse,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Popover,
  Radio,
  Select,
  Space,
  Tag,
  Tooltip,
  notification,
} from 'antd';
import { PostData } from '../../helpers';
import { PDFDocument } from 'pdf-lib';
import { Link } from '@tanstack/react-router';
import {
  TAppointmentType,
  TAppointmentVitalSigns,
  TAppointments,
  TCharges,
  THmoCompany,
  TPatientInformation,
  TQNo,
  TSettings,
} from '../../types';
import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import useAppStore from '../../store';
import ListOfPatients from '../../components/ListOfPatients';
import Loading from '../../components/loading';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MdOutlineDelete, MdOutlineNotes } from 'react-icons/md';
import Webcam from 'react-webcam';
import axios, { AxiosError } from 'axios';
import AddCharge from '../../components/AddCharge';
import { FaRegEdit } from 'react-icons/fa';
import { FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import ResultStatus from '../../components/ResultStatus';
export const Route = createFileRoute('/_authenticated/appointmentdetails/$Id')({
  component: AppointmentDetailsRoute,
});

function AppointmentDetailsRoute() {
  const { Id } = Route.useParams();

  return <AppointmentDetails initialAppointmentId={Id} />;
}

type AppointmentDetailsProps = {
  initialAppointmentId: string;
  initialPatientId?: number;
  createOnly?: boolean;
};

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
import { isNullOrUndefinedOrBlank } from './../../helpers/index';

const ApiUrl = isDev ? devApi : prodApi;

const formatChargeAmount = (value?: number | null) =>
  Number(value ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type SaveAppointmentArgs = {
  values: TAppointments;
  appointmentId: string | number;
  patientId: number;
  branchCode?: string;
  qNoId?: number;
};

export const saveAppointment = ({
  values,
  appointmentId,
  patientId,
  branchCode,
  qNoId = 0,
}: SaveAppointmentArgs) =>
  PostData('SaveAppointment', {
    ...values,
    Id: appointmentId,
    Date: dayjs(values.Date).format('YYYY-MM-DD'),
    BranchCode: branchCode,
    fk_PatientInformation_Id: patientId,
    fk_QNo_Id: qNoId,
    HmoCompany: values.HmoCompany ?? 0,
    PositionAppliedFor: values.PositionAppliedFor,
  });

const positionOnBoardOpt = [
  {
    value: 'deck',
    label: 'Deck',
  },
  {
    value: 'catering',
    label: 'Catering',
  },
  {
    value: 'engine',
    label: 'Engine',
  },
];

export const AppointmentDetails = ({
  initialAppointmentId,
  initialPatientId = 0,
  createOnly = false,
}: AppointmentDetailsProps) => {
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const [packageId, setPackageId] = useState<number | undefined>(undefined);
  const [isMobileTph, setIsMobileTph] = useState(false);
  const [title, setTitle] = useState('');
  const [appType, setAppType] = useState('');
  const router = useRouter();
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();
  const q = useQueryClient();
  // const [qCounters, setQCounters] = useState<MenuProps['items']>([]);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [showWebCam, setShowWebCam] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const videoConstraints = {
    width: 400,
    height: 400,
    facingMode: 'user',
  };
  const [picture, setPicture] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const store = useAppStore();
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [vitalSignsForm] = Form.useForm<TAppointmentVitalSigns>();
  const [isSavingVitalSigns, setIsSavingVitalSigns] = useState(false);
  const [showPatients, setShowPatient] = useState(false);
  const [Id, setId] = useState(initialAppointmentId);
  const [PatientId, setPatientId] = useState<number>(initialPatientId);
  const [selectedRecord, setSelectedRecord] = useState<TCharges | undefined>();
  // const [showDelete, setShowDelete] = useState(false);
  const [charges, setCharges] = useState<TCharges[] | undefined>([]);
  // const [chargesAll, setChargesAll] = useState<TCharges[] | undefined>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gender, setGender] = useState('');
  const [showStickyAppointment, setShowStickyAppointment] = useState(false);
  const [showFullAppointmentForm, setShowFullAppointmentForm] = useState(false);
  const appointmentInformationRef = useRef<HTMLElement | null>(null);

  useQuery({
    queryKey: ['patientDetails'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPatientInformationById',
        parameters: {
          Id: PatientId,
        },
      });
      if (res) {
        const x: TPatientInformation = res.parameters.lst[0];
        form.setFieldsValue({
          PatientNo: x.PatientNo,
          Name: x.Name,
          fk_PatientInformation_Id: PatientId,
        });

        setGender(x.Sex!);
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const packageDetails = useQuery({
    queryKey: ['packageDetails', packageId],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPackageDetails',
        parameters: {
          Id: packageId,
        },
      });
      const data = res.parameters.lst;
      return data;
    },
    enabled: !!packageId,
  });

  const checklistDeptOpt = useQuery({
    queryKey: ['checklistDeptOpt', Id],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChecklistDeptOnly',
        parameters: {
          AppointmentId: Id,
        },
      });
      const data = res.parameters.lst;
      return data.map((d: any) => ({
        label: d.DepartmentDescription,
        key: d.DepartmentId,
      }));
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: !!Id,
  });

  // const PositionAppliedFor = useQuery({
  //   queryKey: ['PositionAppliedFor'],
  //   queryFn: async () => {
  //     const res = await PostData('GetRecords', {
  //       sp: 'udp_GetSettings',
  //       parameters: {
  //         Code: 'POSITIONAPPLIEDFOR',
  //       },
  //     });
  //     if (res) {
  //       return res.parameters.lst;
  //     }
  //   },
  //   refetchOnWindowFocus: false,
  //   staleTime: 0,
  // });

  const appointmentType = useQuery({
    queryKey: ['appointmentType'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentType',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const company = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetCompany',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const hmo = useQuery({
    queryKey: ['hmo'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetHmo',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const referredBy = useQuery({
    queryKey: ['referredBy'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: { Code: 'REFERREDBY' },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

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

  const appointmentVitalSigns = useQuery({
    queryKey: ['appointmentVitalSigns', Id],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentVitalSigns',
        parameters: {
          AppointmentId: Id,
        },
      });
      const vitalSigns = res?.parameters?.lst?.[0] as
        | TAppointmentVitalSigns
        | undefined;

      vitalSignsForm.setFieldsValue({
        HeightCm: vitalSigns?.HeightCm ?? null,
        WeightKg: vitalSigns?.WeightKg ?? null,
        Bsa: vitalSigns?.Bsa ?? null,
        Bp: vitalSigns?.Bp ?? '',
        Hr: vitalSigns?.Hr ?? '',
      });

      return vitalSigns;
    },
    enabled: Id !== '0',
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const CountryOfDestination = useQuery({
    queryKey: ['CountryOfDestination'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'COUNTRYOFDESTINATION',
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const printBlob = (blob: Blob) => {
    return new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');

      document.body.appendChild(iframe);

      let finished = false;
      let sawPrintDialogBlur = false;
      let printWindowForCleanup: Window | null = null;

      const cleanup = () => {
        window.removeEventListener('blur', handleParentBlur, true);
        window.removeEventListener('focus', handleParentFocus, true);
        printWindowForCleanup?.removeEventListener('afterprint', finish);

        URL.revokeObjectURL(url);

        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };

      const finish = () => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve();
      };

      const fail = (message: string, error?: unknown) => {
        if (finished) return;
        finished = true;
        cleanup();
        console.error(error ?? message);
        reject(error instanceof Error ? error : new Error(message));
      };

      function handleParentBlur() {
        sawPrintDialogBlur = true;
      }

      function handleParentFocus() {
        if (!sawPrintDialogBlur) return;

        finish();
      }

      iframe.onerror = () => {
        fail('Unable to load checklist PDF for printing.');
      };

      iframe.onload = () => {
        try {
          const printWindow = iframe.contentWindow;

          if (!printWindow) {
            fail('Unable to open checklist print frame.');
            return;
          }

          printWindow.addEventListener('afterprint', finish, {
            once: true,
          });
          printWindowForCleanup = printWindow;
          window.addEventListener('blur', handleParentBlur, true);
          window.addEventListener('focus', handleParentFocus, true);

          printWindow.focus();
          printWindow.print();
        } catch (error) {
          fail('Unable to open checklist print dialog.', error);
        }
      };

      iframe.src = url;
    });
  };

  const handlePrintCheckList = async (dept: string) => {
    if (isMobileTph === false && charges!.length <= 0) {
      notification.error({
        message: 'Please add charges first!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (isMobileTph === false && chargeTotals.net > 0) {
      notification.error({
        message: 'Please pay first the balance at the cashier!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setIsLoading(true);
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = ApiUrl + '/api/GenerateReport?ReportName=checklistdept.rdl';

    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'blob',
        params: {
          BranchCode: store.branchCode,
          AppointmentId: Id,
          Dept: dept,
        },
      });

      const pdfBytes = await response.data.arrayBuffer();

      const sourcePdf = await PDFDocument.load(pdfBytes);
      const pageCount = sourcePdf.getPageCount();

      const pageBlobs = await Promise.all(
        Array.from({ length: pageCount }, async (_, index) => {
          const singlePdf = await PDFDocument.create();
          const [page] = await singlePdf.copyPages(sourcePdf, [index]);
          singlePdf.addPage(page);

          const singlePdfBytes = await singlePdf.save();
          const singlePdfBuffer = singlePdfBytes.buffer.slice(
            singlePdfBytes.byteOffset,
            singlePdfBytes.byteOffset + singlePdfBytes.byteLength,
          ) as ArrayBuffer;

          return new Blob([singlePdfBuffer], {
            type: 'application/pdf',
          });
        }),
      );

      for (const blob of pageBlobs) {
        await printBlob(blob);
      }
    } catch (error: any) {
      let message = 'Unable to print checklist.';

      if (axios.isAxiosError(error) && error.response?.data) {
        try {
          const responseData = error.response.data;
          const responseText =
            responseData instanceof Blob
              ? await responseData.text()
              : typeof responseData === 'string'
                ? responseData
                : JSON.stringify(responseData);

          message = JSON.parse(responseText).Message ?? responseText;
        } catch {
          message = error.message || message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      notification.error({
        message,
        placement: 'topRight',
        duration: 3,
      });

      return {
        Status: 0,
        Message: message,
      };
    } finally {
      setIsLoading(false);
    }
  };
  // const handlePrintCs = async () => {
  //   setIsLoading(true);
  //   axios.defaults.headers.common['Authorization'] =
  //     'Bearer ' + store.tokenIdWebCims;
  //   const url = ApiUrl + '/api/GenerateReport?ReportName=cs.rdl';

  //   try {
  //     await axios({
  //       url: url, //your url
  //       method: 'GET',
  //       responseType: 'blob',
  //       params: {
  //         AppointmentId: Id,
  //         BranchCode: store.branchCode,
  //       },
  //     }).then((response) => {
  //       setIsLoading(false);
  //       let newBlob;
  //       newBlob = new Blob([response.data], {
  //         type: 'application/pdf',
  //       });

  //       const data = window.URL.createObjectURL(newBlob);

  //       const a = document.createElement('a');

  //       a.setAttribute('href', data);
  //       a.setAttribute('target', '_blank');

  //       a.click();
  //     });
  //   } catch (error: any) {
  //     setIsLoading(false);
  //     let errorString = error.response.data;
  //     errorString = JSON.parse(await error.response.data.text());
  //     return { Status: 0, Message: errorString.Message };
  //   }
  // };

  const handlePrintSoa = async () => {
    if (isMobileTph === false && charges!.length <= 0) {
      notification.error({
        message: 'Please add charges first!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    } else if (isMobileTph === false && chargeTotals.net > 0) {
      notification.error({
        message: 'Please pay first the balance at the cashier!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    setIsLoading(true);
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;
    const url =
      ApiUrl +
      '/api/GenerateReport?ReportName=soa.rdl&AppointmentId=' +
      Id +
      '&BranchCode=' +
      store.branchCode;

    try {
      await axios({
        url: url, //your url
        method: 'GET',
        responseType: 'blob',
        params: {},
      }).then((response) => {
        setIsLoading(false);
        let newBlob;
        newBlob = new Blob([response.data], {
          type: 'application/pdf',
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement('a');

        a.setAttribute('href', data);
        a.setAttribute('target', '_blank');

        a.click();
      });
    } catch (error: any) {
      setIsLoading(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };

  const handleGetCharges = async () => {
    try {
      if (Id !== '0') {
        setIsLoading(true);
        const res = await PostData('GetRecords', {
          sp: 'udp_GetChargesByAppointmentId',
          parameters: {
            AppointmentId: Id,
          },
        });
        if (res) {
          const isMobile = res.parameters.lst.filter(
            (d: TCharges) => d.PaymentType === 'MOB' || d.PaymentType === 'TMP',
          );

          setIsMobileTph(false);
          if (isMobile.length > 0) {
            setIsMobileTph(true);
          }
          setCharges(res.parameters.lst);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // const handleGetChargesAll = async () => {
  //   try {
  //     setIsLoading(true);
  //     const res = await PostData('GetRecords', {
  //       sp: 'udp_GetChargesByAppointmentIdAll',
  //       parameters: {
  //         AppointmentId: Id,
  //       },
  //     });
  //     if (res) {
  //       const isMobile = res.parameters.lst.filter(
  //         (d: TCharges) => d.PaymentType === 'MOB' || d.PaymentType === 'TMP',
  //       );

  //       setIsMobileTph(false);
  //       if (isMobile.length > 0) {
  //         setIsMobileTph(true);
  //       }
  //       setChargesAll(res.parameters.lst);
  //       setIsLoading(false);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const handleGetAppointmentDetails = async () => {
    if (Id === '0') {
      let appointmentType = localStorage.getItem('code');

      if (appointmentType === 'ape') {
        appointmentType = 'APE';
      } else if (appointmentType === 'amb') {
        appointmentType = 'AMB';
      } else if (appointmentType === 'hemo') {
        appointmentType = 'HEM';
      } else if (appointmentType === 'consultation') {
        appointmentType = 'CON';
      } else if (appointmentType === 'diag') {
        appointmentType = 'DIA';
      } else if (appointmentType === 'ofw') {
        appointmentType = 'OFW';
      } else if (appointmentType === 'ofw') {
        appointmentType = 'OFW';
      } else if (appointmentType === 'sc') {
        appointmentType = 'DIA';
      }

      form.setFieldsValue({
        Date: dayjs(),
        IsSeniorOrPwd: 'N',
        AppointmentType: appointmentType,
      });
    } else {
      sessionStorage.setItem('Id', Id);
      let res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentDetails',
        parameters: {
          Id: Id,
        },
      });
      if (res) {
        const x: TAppointments = res.parameters.lst[0];
        setAppointmentDetails(x);
        setPatientId(x.fk_PatientInformation_Id!);
        setTitle('Appointment for-' + x.Name?.toString());
        setAppType(x.AppointmentType!);
        form.setFieldsValue({
          PatientNo: x.PatientNo,
          Name: x.Name,
          Date: dayjs(x.Date),
          AppountmentType: x.AppointmentType,
          CivilStatus: x.CivilStatus,
          ReferredBy: x.ReferredBy,
          QueueNo: x.QueueNo,
          HmoCompany: x.HmoCompany,
          ChiefComplaint: x.ChiefComplaint,
          Diastolic: x.Diastolic,
          Systolic: x.Systolic,
          Rr: x.Rr,
          Hr: x.Hr,
          Pr: x.Pr,
          AppointmentNo: x.AppointmentNo,
          AppointmentType: x.AppointmentType,
          IsSeniorOrPwd: x.IsSeniorOrPwd,
          Occupation: x.Occupation,
          LoaApprovedBy: x.LoaApprovedBy,
          fk_HmoCompany_Id: x.fk_HmoCompany_Id,
          CountryOfDestination: x.CountryOfDestination,
          PositionAppliedFor: x.PositionAppliedFor,
          Employer: x.Employer,
          PassportNo: x.PassportNo,
        });
      }

      res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentImage',
        parameters: {
          AppointmentId: Id,
        },
      });
      if (res) {
        setPicture(res.parameters.lst[0].Image);
      }
    }
  };
  const handleGetLastImage = async (patientId: number) => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetLastPatientImage',
        parameters: {
          PatientId: patientId,
        },
      });
      if (res) {
        console.log(res);
        setPicture(res.parameters.lst[0].Image);
      }
    } catch (error) {
      console.log(error);
    }
  };
  function blobToBase64(blob: any) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
  const handleSubmitForm = async (v: TAppointments) => {
    const QNo: TQNo = !isNullOrUndefinedOrBlank(
      sessionStorage.getItem('selectedInReception'),
    )
      ? JSON.parse(sessionStorage.getItem('selectedInReception')!)
      : undefined;

    const res = await saveAppointment({
      values: v,
      appointmentId: Id,
      patientId: PatientId,
      branchCode: store.branchCode,
      qNoId: QNo?.Id,
    });
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: 'Appointment successfully saved!',
          placement: 'topRight',
          duration: 3,
        });

        setId(res.parameters.AppointmentId);
        sessionStorage.setItem('Id', res.parameters.AppointmentId);
        form.setFieldsValue({
          AppointmentNo: res.parameters.AppointmentNo,
          QueueNo: res.parameters.QueueNo,
        });
        handleUploadPatientPicture(picture);
        router.navigate({
          to: '/appointmentdetails/$Id',
          params: {
            Id: res.parameters.AppointmentId,
          },
        });
        handleGetAppointmentDetails();
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };

  const getVitalSignsParameterValue = (value: unknown) =>
    value === null || value === undefined ? '' : String(value);

  const handleSaveVitalSigns = async (values: TAppointmentVitalSigns) => {
    if (Id === '0') {
      notification.error({
        message: 'Please save the appointment first.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setIsSavingVitalSigns(true);

    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_SaveAppointmentVitalSigns',
        parameters: {
          AppointmentId: Id,
          HeightCm: getVitalSignsParameterValue(values.HeightCm),
          WeightKg: getVitalSignsParameterValue(values.WeightKg),
          Bsa: getVitalSignsParameterValue(values.Bsa),
          Bp: values.Bp ?? '',
          Hr: values.Hr ?? '',
          AddedUpdatedBy: store.username ?? '',
        },
      });

      if (res?.status === 1) {
        notification.success({
          message: 'Vital signs successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
        await appointmentVitalSigns.refetch();
      } else {
        notification.error({
          message: res?.message ?? 'Unable to save vital signs.',
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save vital signs.';

      notification.error({
        message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsSavingVitalSigns(false);
    }
  };

  const handleUploadPatientPicture = async (image: any) => {
    try {
      const fd = new FormData();

      fd.append('image', image);
      fd.append('AppointmentId', sessionStorage.getItem('Id') as string);
      axios.defaults.headers.common['Authorization'] =
        'Bearer ' + store.tokenIdWebCims;
      const url = ApiUrl + '/api/' + 'UploadApppointmentPicture';

      await axios({
        method: 'post',
        url: url,
        data: fd,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then((res: any) => {
          if (res.data.status === 1) {
            notification.success({
              message: 'Image successfully uploaded!',
              placement: 'topRight',
              duration: 3,
            });
          } else {
            notification.error({
              message: res.data.message,
              placement: 'topRight',
              duration: 3,
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  };
  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (imageSrc) {
      setPicture(imageSrc);
    }

    setShowWebCam(false);

    // handleUploadPatientPicture(imageSrc);
  }, [webcamRef]);
  const onFilePicked = async (files: any) => {
    if (files[0] === undefined) return false;

    let filename = files[0].name;
    if (filename.lastIndexOf('.') <= 0) {
      notification.error({
        message: 'Invalid image file!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (files[0].size >= 2000000) {
      notification.error({
        message: 'File must not be greater than 2MB!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    setPicture(URL.createObjectURL(files?.[0]));

    const p = await blobToBase64(files?.[0]);
    if (p) {
      handleUploadPatientPicture(p);
    }
  };

  const GetLastAppointmentChargeFollowUp = async (
    patientId: number,
  ): Promise<any[]> => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPatientChargesFollowUp',
        parameters: {
          patientId,
        },
      });

      return res?.parameters?.lst ?? [];
    } catch (error: any) {
      notification.error({
        message: error.response?.data ?? 'An error occurred.',
        placement: 'topRight',
        duration: 3,
      });

      return [];
    }
  };

  const navigate = useNavigate();

  const [confirmationModal, setConfirmationModal] = useState(false);
  const [followUpExam, setFollowUpExam] = useState<TCharges[]>([]);

  const handleContinueAppointment = async (appointmentId: number) => {
    const QNo: TQNo = !isNullOrUndefinedOrBlank(
      sessionStorage.getItem('selectedInReception'),
    )
      ? JSON.parse(sessionStorage.getItem('selectedInReception')!)
      : undefined;
    await PostData('GetRecords', {
      sp: 'udp_FollowUpAppointmwents',
      parameters: {
        Id: appointmentId,
        QnoId: QNo.Id,
      },
    });

    navigate({
      to: '/appointmentdetails/$Id',
      params: {
        Id: appointmentId.toString(),
      },
    });
    setId(appointmentId.toString());
    setConfirmationModal(false);
  };
  const handleNewAppointment = async (patientId: number) => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetPatientInformationById',
      parameters: {
        Id: patientId,
      },
    });
    if (res) {
      const patientDetails: TPatientInformation = res.parameters.lst[0];

      form.setFieldsValue({
        PatientNo: patientDetails.PatientNo,
        Name: patientDetails.Name,
        HmoCompany:
          patientDetails.Company == 0 ? undefined : patientDetails.Company,
        CivilStatus: patientDetails.CivilStatus,
      });
      handleGetLastImage(patientDetails.Id);
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetLastAppointmentDetails',
      parameters: {
        PatientId: patientId,
      },
    });
    if (res) {
      const app: TAppointments = res.parameters.lst[0];
      form.setFieldsValue({
        fk_HmoCompany_Id: app.fk_HmoCompany_Id,
        //CivilStatus: app.CivilStatus,
        // AppointmentType: app.AppointmentType,
        HmoCompany: app.HmoCompany,
        IsSeniorOrPwd: app.IsSeniorOrPwd,
      });
    }
    setConfirmationModal(false);
  };

  const handleSelect = async (patientId: number) => {
    setShowPatient(false);
    setPatientId(patientId);

    // check if theres a to follow charges
    var lastAppointmentsChargeFollowUp =
      await GetLastAppointmentChargeFollowUp(patientId);

    if (lastAppointmentsChargeFollowUp.length > 0) {
      setFollowUpExam(lastAppointmentsChargeFollowUp);
      // modal.info({
      //   width: 700,
      //   title: 'Existing Follow-Up Items Found',
      //   content: (
      //     <div>
      //       <p className="mb-2">
      //         This patient has pending follow-up examinations from a previous
      //         appointment:
      //       </p>

      //       <ul className="list-disc pl-5">
      //         {lastAppointmentsChargeFollowUp.map((item: TCharges) => (
      //           <li key={item.Id}>{item.Description}</li>
      //         ))}
      //       </ul>
      //     </div>
      //   ),
      //   centered: true,
      //   footer: (
      //     <div className="flex justify-end gap-3">
      //       <Button
      //         onClick={() => {
      //           handleNewAppointment(patientId);
      //         }}
      //       >
      //         Create New Appointment
      //       </Button>

      //       <Button type="primary">Continue Previous Appointment</Button>
      //     </div>
      //   ),
      // });
      // return;
      setConfirmationModal(true);
    } else {
      handleNewAppointment(patientId);
      return;
    }
  };

  const normalizeChargeItemId = (data: TCharges): TCharges => {
    const charge = data as TCharges & { ItemId?: number };

    return {
      ...data,
      fk_Items_Id: charge.fk_Items_Id ?? charge.ItemId,
    };
  };

  const handleEdit = (data: TCharges) => {
    setSelectedRecord(normalizeChargeItemId(data));
    requestAnimationFrame(() => {
      document
        .getElementById('charge-editor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };
  const actionBodyTemplate = (data: TCharges) => {
    return (
      <Space size={4}>
        {data.Editable && (
          <Tooltip title="Edit">
            <FaRegEdit
              onClick={(event) => {
                event.stopPropagation();
                handleEdit(data);
                // setShowDelete(true);
              }}
              color="green"
              size="20"
              className="cursor-pointer"
            />
          </Tooltip>
        )}
        {data.Editable && (
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this record?"
              okText="Yes"
              cancelText="No"
              onConfirm={(event) => {
                event?.stopPropagation();
                handleDelete(data);
              }}
              onCancel={(event) => event?.stopPropagation()}
            >
              {/* <Button
              type="primary"
              icon={<MdOutlineDelete />}
              onClick={() => {
                setSelectedRecord(data);
                // setShowDelete(true);
              }}
              danger
            /> */}
              <MdOutlineDelete
                onClick={(event) => {
                  event.stopPropagation();
                  // setShowDelete(true);
                }}
                color="red"
                size="20"
                className="cursor-pointer"
              />
            </Popconfirm>
          </Tooltip>
        )}

        {data.IsPackage === 'Y' && (
          <Tooltip title="Details">
            <MdOutlineNotes
              onClick={(event) => {
                event.stopPropagation();
                setPackageId(data.fk_Items_Id);
                setShowPackageDetails(true);
              }}
              size="20"
              className="cursor-pointer"
            />
          </Tooltip>
        )}
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TCharges) => {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-2 text-xs">
        <div>Doctor</div>
        <div>
          <strong>{data.DoctorName}</strong>
        </div>
        <div>Hmo/Company</div>
        <div>
          <strong>{data.HmoCompany}</strong>
        </div>
        <div>Added By</div>
        <div>
          <strong>{data.AddedBy}</strong>
        </div>
        <div>Date Added</div>
        <div>
          <strong>{data.DateAdded}</strong>
        </div>
        <div>Updated By</div>
      </div>
    );
  };
  const handleDelete = async (data: TCharges) => {
    const charge = normalizeChargeItemId(data);
    const isPackage = charge.IsPackage ? charge.IsPackage : 'N';
    const res = await PostData(
      `DeleteCharge2?IsPackage=${isPackage}&BranchCode=${store.branchCode}`,
      {
        Id: charge.Id,
        fk_Appointments_Id: charge.fk_Appointments_Id,
        Qty: charge.Qty,
        fk_Items_Id: charge.fk_Items_Id,
      },
    );
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: 'Successfully deleted!',
          placement: 'topRight',
          duration: 3,
        });
        // setShowDelete(false);

        if (selectedRecord?.Id === charge.Id) {
          setSelectedRecord(undefined);
        }
        form2.resetFields();
        handleGetCharges();
        q.invalidateQueries({
          queryKey: ['resultStatus', appointmentDetails?.Id],
        });
        q.invalidateQueries({ queryKey: ['checklistDeptOpt'] });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };
  const handleGetQCounters = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_CheckListQCounters',
      parameters: {
        AppointmentId: Id,
      },
    });
    if (res) {
      // let q: MenuProps['items'] = [] as MenuProps['items'];
      // x.forEach((e: MenuProps['items']) => {
      //   q.push({
      //     key: e.key!,
      //     label: e.label,
      //   });
      // });
      // setQCounters(res.parameters.lst);
    }
  };

  // const onMenuClick: MenuProps['onClick'] = (data) => {
  //   // const f: any = qCounters?.filter((f: any) => f.key == key)[0];

  //   // handlePrintCheckList(f.value);
  //   console.log(data);
  // };

  const chargeTotals = (charges ?? []).reduce(
    (totals, charge) => ({
      gross: totals.gross + Number(charge.Gross ?? 0),
      hmo: totals.hmo + Number(charge.HmoAmount ?? 0),
      cash: totals.cash + Number(charge.CashPayment ?? 0),
      net: totals.net + Number(charge.Net ?? 0),
    }),
    { gross: 0, hmo: 0, cash: 0, net: 0 },
  );

  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={3}
          footerStyle={{
            textAlign: 'right',
            fontWeight: 'bold',
          }}
        />
        <Column footer="" />
        <Column footer="" />
        <Column
          footer={formatChargeAmount(chargeTotals.gross)}
          footerStyle={{ textAlign: 'right', fontWeight: 'bold' }}
        />
        <Column
          footer={formatChargeAmount(chargeTotals.hmo)}
          footerStyle={{ textAlign: 'right', fontWeight: 'bold' }}
        />
        <Column
          footer={formatChargeAmount(chargeTotals.cash)}
          footerStyle={{ textAlign: 'right', fontWeight: 'bold' }}
        />
        <Column
          footer={
            <span
              className={
                chargeTotals.net > 0
                  ? 'text-base font-bold text-red-600'
                  : 'font-bold text-slate-700'
              }
            >
              {formatChargeAmount(chargeTotals.net)}
            </span>
          }
          footerStyle={{ textAlign: 'right' }}
        />
        <Column footer="" />
        <Column footer="" />
      </Row>
    </ColumnGroup>
  );

  const content = () => {
    const [formCompany] = Form.useForm();
    const handleSubmitForm = async () => {
      try {
        setIsLoading(true);
        const res = await PostData('SaveHmoCompany', {
          Name: formCompany.getFieldValue('Name'),
          Type: formCompany.getFieldValue('Type'),
          Balance: 0,
        });
        if (res) {
          if (res.status === 1) {
            notification.success({
              message: 'Successfully saved!',
              placement: 'topRight',
              duration: 3,
            });
            formCompany.resetFields();
            q.invalidateQueries({ queryKey: ['company'] });
            q.invalidateQueries({ queryKey: ['hmo'] });
            setIsLoading(false);
          } else {
            notification.error({
              message: res.message,
              placement: 'topRight',
              duration: 3,
            });
            setIsLoading(false);
          }
        }
      } catch (error: AxiosError | any) {
        notification.error({
          message: error.response?.data,
          placement: 'topRight',
          duration: 3,
        });
      }
    };
    return (
      <div>
        <Form
          form={formCompany}
          layout="vertical"
          onFinish={() => handleSubmitForm()}
        >
          <Form.Item name="Company" label="Company" className="col-span-5">
            <Select
              showSearch
              allowClear
              filterOption={(input, option) =>
                String(option?.title ?? '')
                  .toLocaleLowerCase()
                  .includes(input.toLocaleLowerCase())
              }
            >
              {company.data &&
                company.data.map((d: THmoCompany) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                    {d.Name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <div className="flex flex-col justify-center">
            <Popover content={content} title="New Company" trigger="click">
              <Button type="primary">New</Button>
            </Popover>
          </div>

          <Form.Item
            name="Type"
            label="Type"
            rules={[
              {
                required: true,
                message: 'Type is required!',
              },
            ]}
          >
            <Select>
              <Select.Option key="C" value="C" title="Company ">
                Company
              </Select.Option>
              <Select.Option key="H" value="H" title="HMO">
                HMO
              </Select.Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form>
      </div>
    );
  };

  useEffect(() => {
    handleGetAppointmentDetails();
    handleGetCharges();
    handleGetQCounters();

    // handleGetDoctors();
  }, [Id]);

  useEffect(() => {
    if (Id === '0' && initialPatientId > 0) {
      setPatientId(initialPatientId);
      handleNewAppointment(initialPatientId);
    }
  }, [initialPatientId]);

  useEffect(() => {
    const element = appointmentInformationRef.current;
    if (!element) return;

    let animationFrame = 0;

    const updateStickyAppointment = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const sectionBottom = element.getBoundingClientRect().bottom;

        setShowStickyAppointment((isVisible) =>
          isVisible ? sectionBottom < 24 : sectionBottom < -12,
        );
      });
    };

    updateStickyAppointment();
    document.addEventListener('scroll', updateStickyAppointment, true);
    window.addEventListener('resize', updateStickyAppointment);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('scroll', updateStickyAppointment, true);
      window.removeEventListener('resize', updateStickyAppointment);
    };
  }, []);

  const patientNoWatch = Form.useWatch('PatientNo', form);
  const patientNameWatch = Form.useWatch('Name', form);
  const appointmentTypeWatch = Form.useWatch('AppointmentType', form);
  const appointmentTypeLabel =
    appointmentType.data?.find(
      (type: TAppointmentType) => type.Code === appointmentTypeWatch,
    )?.Description ??
    appointmentDetails?.AppointmentTypeDesc ??
    appointmentTypeWatch ??
    '-';

  return (
    <div className="min-h-full bg-slate-100 p-3">
      <Helmet>
        <meta charSet="utf-8" />
        <title>{title}</title>
      </Helmet>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Button onClick={() => router.history.back()}>Back</Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            {createOnly ? 'New Appointment' : 'Update Appointment Detail'}
          </h1>
          <p className="text-xs text-slate-500">
            Appointment No. {appointmentDetails?.AppointmentNo ?? '-'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-3">
          <section className="border-t-2 border-emerald-500 bg-white p-4 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <Avatar size={112} src={picture as string} />
              <h2 className="mt-3 text-lg font-medium uppercase text-slate-700">
                {appointmentDetails?.Name ?? patientNameWatch ?? 'Patient'}
              </h2>
              <div className="mt-2 space-y-1 text-xs">
                <p>
                  <span className="text-slate-500">Patient ID:</span>{' '}
                  <strong>{PatientId || '-'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Patient No:</span>{' '}
                  <strong className="text-blue-600">
                    {appointmentDetails?.PatientNo ?? patientNoWatch ?? '-'}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Member No:</span>{' '}
                  <strong className="text-blue-600">
                    {appointmentDetails?.MemberNo ?? '-'}
                  </strong>
                </p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="primary" onClick={() => setShowWebCam(true)}>
                  Capture Photo
                </Button>
                {!createOnly && (
                  <Button onClick={() => setShowPatient(true)}>
                    Change Patient
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 divide-y text-sm">
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-600">Age</span>
                <span>{appointmentDetails?.AgeYears ?? '-'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-600">Gender</span>
                <span>
                  {appointmentDetails?.Sex === 'M'
                    ? 'Male'
                    : appointmentDetails?.Sex === 'F'
                      ? 'Female'
                      : appointmentDetails?.Sex ?? '-'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-600">Civil Status</span>
                <span>{appointmentDetails?.CivilStatus ?? '-'}</span>
              </div>
            </div>
          </section>

          {!createOnly && (
            <section className="border-t-2 border-sky-500 bg-white p-4 text-center shadow-sm">
              <div className="mt-3 grid gap-2">
                <Link
                  to="/mer/$AppointmentId"
                  params={{ AppointmentId: Id.toString() }}
                >
                  <Button block>Open MER</Button>
                </Link>
                {(appType === 'HEM' || appType === 'AMB') && (
                  <Button
                    block
                    type="primary"
                    onClick={() =>
                      router.navigate({
                        to: '/billing/$AppointmentId',
                        params: { AppointmentId: Id },
                      })
                    }
                  >
                    Billing
                  </Button>
                )}
              </div>
            </section>
          )}
        </aside>

        <main className="space-y-4 lg:col-span-9">
          {showStickyAppointment && (
            <div className="fixed left-1/2 top-3 z-50 flex w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 flex-wrap items-center justify-between gap-2 border-l-4 border-emerald-500 bg-white px-4 py-3 shadow-lg">
              <div className="min-w-0">
                <div className="truncate font-semibold uppercase text-slate-800">
                  {appointmentDetails?.Name ?? patientNameWatch ?? 'Patient'}
                </div>
                <div className="text-xs text-slate-500">Appointment Type</div>
              </div>
              <div className="rounded bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                {appointmentTypeLabel}
              </div>
            </div>
          )}

          <section
            ref={appointmentInformationRef}
            className="border-t-2 border-emerald-500 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <h2 className="font-semibold text-slate-700">
                Appointment Information
              </h2>
              <Button
                onClick={() =>
                  setShowFullAppointmentForm((isVisible) => !isVisible)
                }
              >
                {showFullAppointmentForm
                  ? 'Hide Full Appointment Form'
                  : 'Show Full Appointment Form'}
              </Button>
            </div>
            <div className="p-5">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmitForm}
                scrollToFirstError
              >
                <Form.Item name="PatientNo" hidden rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="Name" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="AppointmentNo" hidden>
                  <Input />
                </Form.Item>
                {!showFullAppointmentForm && (
                  <>
                    <Form.Item name="CivilStatus" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="ReferredBy" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="Occupation" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="QueueNo" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="LoaApprovedBy" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="CountryOfDestination" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="PositionAppliedFor" hidden>
                      <Input />
                    </Form.Item>
                  </>
                )}
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-12">
                  <Form.Item
                    name="Date"
                    label="Date"
                    className="!mb-0 md:col-span-4"
                  >
                    <DatePicker format="MM/DD/YYYY" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label="Appointment Type"
                    name="AppointmentType"
                    className="!mb-0 md:col-span-5"
                    rules={[
                      {
                        required: true,
                        message: 'Appointment type is required!',
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      allowClear
                      filterOption={(input, option) =>
                        String(option?.title ?? '')
                          .toLocaleLowerCase()
                          .includes(input.toLocaleLowerCase())
                      }
                    >
                      {appointmentType.data?.map((d: TAppointmentType) => (
                        <Select.Option
                          key={d.Code}
                          value={d.Code}
                          title={d.Description}
                        >
                          {d.Description}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Senior/PWD?"
                    name="IsSeniorOrPwd"
                    className="!mb-0 md:col-span-3"
                    rules={[
                      {
                        required: true,
                        message: 'This field is required!',
                      },
                    ]}
                  >
                    <Radio.Group className="flex h-8 items-center">
                      <Radio value="Y">Yes</Radio>
                      <Radio value="N">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item label="HMO" className="!mb-0 md:col-span-6">
                    <div className="flex gap-2">
                      <Form.Item name="fk_HmoCompany_Id" noStyle>
                        <Select
                          className="flex-1"
                          showSearch
                          allowClear
                          filterOption={(input, option) =>
                            String(option?.title ?? '')
                              .toLocaleLowerCase()
                              .includes(input.toLocaleLowerCase())
                          }
                        >
                          {hmo.data?.map((d: THmoCompany) => (
                            <Select.Option
                              key={d.Id}
                              value={d.Id}
                              title={d.Name}
                            >
                              {d.Name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Popover
                        content={content}
                        title="New Company/HMO"
                        trigger="click"
                      >
                        <Button type="primary">New</Button>
                      </Popover>
                    </div>
                  </Form.Item>

                  <Form.Item label="Company" className="!mb-0 md:col-span-6">
                    <div className="flex gap-2">
                      <Form.Item name="HmoCompany" noStyle>
                        <Select
                          className="flex-1"
                          showSearch
                          allowClear
                          filterOption={(input, option) =>
                            String(option?.title ?? '')
                              .toLocaleLowerCase()
                              .includes(input.toLocaleLowerCase())
                          }
                        >
                          {company.data?.map((d: THmoCompany) => (
                            <Select.Option
                              key={d.Id}
                              value={d.Id}
                              title={d.Name}
                            >
                              {d.Name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Popover
                        content={content}
                        title="New Company/HMO"
                        trigger="click"
                      >
                        <Button type="primary">New</Button>
                      </Popover>
                    </div>
                  </Form.Item>
                </div>

                {showFullAppointmentForm && (
                  <div className="mt-5 rounded-md border bg-slate-50 p-4">
                    <div className="mb-3 font-semibold text-slate-700">
                      Full Appointment Details
                    </div>
                    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-12">
                      <Form.Item
                        label="Civil Status"
                        name="CivilStatus"
                        className="!mb-0 md:col-span-4"
                      >
                        <Select showSearch allowClear>
                          <Select.Option key="D" value="D" title="Divorced">
                            Divorced
                          </Select.Option>
                          <Select.Option
                            key="L"
                            value="L"
                            title="Legally Separated"
                          >
                            Legally Separated
                          </Select.Option>
                          <Select.Option key="M" value="M" title="Married">
                            Married
                          </Select.Option>
                          <Select.Option key="S" value="S" title="Single">
                            Single
                          </Select.Option>
                          <Select.Option key="W" value="W" title="Widowed">
                            Widowed
                          </Select.Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name="ReferredBy"
                        label="Referred By"
                        className="!mb-0 md:col-span-4"
                        normalize={(v) => v.toUpperCase()}
                      >
                        <AutoComplete
                          filterOption={(inputValue, option) =>
                            option!
                              .value!.toString()
                              .toUpperCase()
                              .indexOf(inputValue.toUpperCase()) !== -1
                          }
                        >
                          {referredBy.data?.map((v: TSettings) => (
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

                      <Form.Item
                        name="Occupation"
                        label="Occupation"
                        className="!mb-0 md:col-span-4"
                        normalize={(v) => v.toUpperCase()}
                      >
                        <AutoComplete
                          filterOption={(inputValue, option) =>
                            option!
                              .value!.toString()
                              .toUpperCase()
                              .indexOf(inputValue.toUpperCase()) !== -1
                          }
                        >
                          {occupation.data?.map((v: any) => (
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

                      <Form.Item
                        name="QueueNo"
                        label="Queue No."
                        className="!mb-0 md:col-span-3"
                      >
                        <Input readOnly className="font-bold" />
                      </Form.Item>

                      <Form.Item
                        name="LoaApprovedBy"
                        label="LOA Approved By"
                        className="!mb-0 md:col-span-5"
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        name="CountryOfDestination"
                        label="Country Of Destination"
                        className="!mb-0 md:col-span-4"
                      >
                        <AutoComplete
                          filterOption={(inputValue, option) =>
                            option!
                              .value!.toString()
                              .toUpperCase()
                              .indexOf(inputValue.toUpperCase()) !== -1
                          }
                        >
                          {CountryOfDestination.data?.map((v: TSettings) => (
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

                      <Form.Item
                        name="PositionAppliedFor"
                        label="Position Applied For"
                        className="!mb-0 md:col-span-4"
                        normalize={(v) => v.toUpperCase()}
                      >
                        <AutoComplete
                          options={positionOnBoardOpt.map((opt) => ({
                            value: opt.label,
                          }))}
                          filterOption={(inputValue, option) =>
                            option!
                              .value!.toString()
                              .toUpperCase()
                              .indexOf(inputValue.toUpperCase()) !== -1
                          }
                        />
                      </Form.Item>

                      {/* <Form.Item
                        name="Employer"
                        label="Employer"
                        className="!mb-0 md:col-span-4"
                      >
                        <Input />
                      </Form.Item> */}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex justify-end border-t pt-4">
                  <Button type="primary" htmlType="submit">
                    Update Appointment
                  </Button>
                </div>
              </Form>
            </div>
          </section>

          <section className="border-t-2 border-emerald-500 bg-white shadow-sm">
            <Collapse
              bordered={false}
              defaultActiveKey={['vital-signs']}
              items={[
                {
                  key: 'vital-signs',
                  label: (
                    <span className="font-semibold text-slate-700">
                      Vital Signs
                    </span>
                  ),
                  children: (
                    <Form
                      form={vitalSignsForm}
                      layout="vertical"
                      onFinish={handleSaveVitalSigns}
                    >
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-5">
                        <Form.Item
                          label="Height (cm)"
                          name="HeightCm"
                          className="!mb-0"
                        >
                          <InputNumber
                            className="w-full"
                            min={0}
                            precision={2}
                          />
                        </Form.Item>

                        <Form.Item
                          label="Weight (kg)"
                          name="WeightKg"
                          className="!mb-0"
                        >
                          <InputNumber
                            className="w-full"
                            min={0}
                            precision={2}
                          />
                        </Form.Item>

                        <Form.Item label="BSA" name="Bsa" className="!mb-0">
                          <InputNumber
                            className="w-full"
                            min={0}
                            precision={2}
                          />
                        </Form.Item>

                        <Form.Item label="BP" name="Bp" className="!mb-0">
                          <Input maxLength={50} />
                        </Form.Item>

                        <Form.Item label="HR" name="Hr" className="!mb-0">
                          <Input maxLength={50} />
                        </Form.Item>
                      </div>

                      <div className="mt-4 flex justify-end border-t pt-4">
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isSavingVitalSigns}
                          disabled={
                            Id === '0' || appointmentVitalSigns.isFetching
                          }
                        >
                          Save Vital Signs
                        </Button>
                      </div>
                    </Form>
                  ),
                },
              ]}
            />
          </section>

          {!createOnly && (
            <>
              <section
                id="charge-editor"
                className="border-t-2 border-sky-500 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="font-semibold">
                    {selectedRecord ? 'Edit Charge' : 'Add Charge'}
                  </div>
                  {selectedRecord && (
                    <Button onClick={() => setSelectedRecord(undefined)}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
                <div className="p-4">
                  {Id !== '0' ? (
                    <AddCharge
                      key={selectedRecord?.Id ?? 'new-charge'}
                      Id={Id}
                      ChargeDetails={selectedRecord}
                      Gender={gender}
                      AppointmentDetails={appointmentDetails}
                      onSaved={async () => {
                        setSelectedRecord(undefined);
                        await handleGetCharges();
                        q.invalidateQueries({ queryKey: ['qcounters'] });
                        q.invalidateQueries({ queryKey: ['checklistDeptOpt'] });
                        q.invalidateQueries({
                          queryKey: ['resultStatus', appointmentDetails?.Id],
                        });
                      }}
                    />
                  ) : (
                    <div className="text-gray-500">
                      Save the appointment before adding charges.
                    </div>
                  )}
                </div>
              </section>

              <section className="border-t-2 border-sky-500 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-semibold text-slate-700">Charges</h2>
                    <span className="text-xs text-slate-500">
                      {charges?.length ?? 0} item(s)
                    </span>
                  </div>

                  <Button
                    loading={isLoading}
                    onClick={handleGetCharges}
                    type="text"
                  >
                    <div className="flex items-center gap-x-2">
                      <FiRefreshCw />
                      <div>Refresh</div>
                    </div>
                  </Button>
                </div>
                <div className="p-2">
                  {isLoading ? (
                    <Loading size={64} />
                  ) : (
                    <DataTable
                      value={charges}
                      // paginator
                      // rows={10}
                      // rowsPerPageOptions={[10, 25, 50]}
                      emptyMessage="No Records!"
                      stripedRows
                      size="small"
                      className="text-xs [&_.p-datatable-tbody>tr>td]:!px-2 [&_.p-datatable-tbody>tr>td]:!py-1.5 [&_.p-datatable-tfoot>tr>td]:!px-2 [&_.p-datatable-tfoot>tr>td]:!py-1.5 [&_.p-datatable-thead>tr>th]:!px-2 [&_.p-datatable-thead>tr>th]:!py-1.5"
                      rowExpansionTemplate={rowExpansionTemplate}
                      expandedRows={expandedRows as any}
                      onRowToggle={(e) => setExpandedRows(e.data as any)}
                      footerColumnGroup={footerGroup}
                    >
                      <Column
                        expander={(charges?.length ?? 0) > 0}
                        style={{ width: '1.75rem' }}
                      />
                      <Column
                        field="action"
                        header="Action"
                        body={(data: any) => actionBodyTemplate(data)}
                        style={{ width: '4.5rem' }}
                      ></Column>
                      <Column field="Description" header="Description"></Column>
                      <Column
                        field="Qty"
                        header="Qty"
                        body={(data: TCharges) =>
                          Number(data.Qty ?? 0).toLocaleString('en-PH')
                        }
                        bodyStyle={{ textAlign: 'right' }}
                        headerStyle={{ textAlign: 'right', width: '4rem' }}
                        headerClassName="[&_.p-column-header-content]:!justify-end"
                      ></Column>
                      <Column
                        field="Price"
                        header="Item Price"
                        body={(data: TCharges) =>
                          formatChargeAmount(data.Price)
                        }
                        bodyStyle={{ textAlign: 'right' }}
                        headerStyle={{ textAlign: 'right', width: '6.5rem' }}
                        headerClassName="[&_.p-column-header-content]:!justify-end"
                      ></Column>
                      <Column
                        field="Gross"
                        header="Total"
                        body={(data: TCharges) =>
                          formatChargeAmount(data.Gross)
                        }
                        bodyStyle={{ textAlign: 'right' }}
                        headerStyle={{ textAlign: 'right', width: '6.5rem' }}
                        headerClassName="[&_.p-column-header-content]:!justify-end"
                      ></Column>
                      <Column
                        field="HmoAmount"
                        header="HMO"
                        body={(data: TCharges) =>
                          formatChargeAmount(data.HmoAmount)
                        }
                        bodyStyle={{ textAlign: 'right' }}
                        headerStyle={{ textAlign: 'right', width: '6.5rem' }}
                        headerClassName="[&_.p-column-header-content]:!justify-end"
                      ></Column>
                      <Column
                        field="CashPayment"
                        header="Cash"
                        body={(data: TCharges) =>
                          formatChargeAmount(data.CashPayment)
                        }
                        bodyStyle={{ textAlign: 'right' }}
                        headerStyle={{ textAlign: 'right', width: '6.5rem' }}
                        headerClassName="[&_.p-column-header-content]:!justify-end"
                      ></Column>
                      <Column
                        field="Net"
                        header="Net"
                        body={(data: TCharges) => {
                          const balance = Number(data.Net ?? 0);

                          return (
                            <span
                              className={
                                balance > 0
                                  ? 'text-sm font-bold text-red-600'
                                  : 'font-medium text-slate-700'
                              }
                            >
                              {formatChargeAmount(balance)}
                            </span>
                          );
                        }}
                        bodyStyle={{ textAlign: 'right' }}
                        headerStyle={{ textAlign: 'right', width: '6.5rem' }}
                        headerClassName="[&_.p-column-header-content]:!justify-end"
                      ></Column>
                      <Column
                        header="Payment"
                        body={(data: TCharges) => {
                          const isSettled = Number(data.Net ?? 0) <= 0;

                          return (
                            <Tag
                              color={isSettled ? 'success' : 'error'}
                              className="!m-0 !inline-flex !items-center !justify-center !gap-1 !whitespace-nowrap !px-2 !py-0.5 !text-xs !font-semibold !leading-5"
                            >
                              {isSettled ? (
                                <FiCheckCircle className="shrink-0" />
                              ) : (
                                <FiAlertCircle className="shrink-0" />
                              )}
                              <span>{isSettled ? 'Settled' : 'Unsettled'}</span>
                            </Tag>
                          );
                        }}
                        bodyStyle={{ textAlign: 'center' }}
                        headerStyle={{ textAlign: 'center', width: '7.25rem' }}
                        headerClassName="[&_.p-column-header-content]:!justify-center"
                      ></Column>
                      <Column
                        field="PaymentType"
                        header="Type"
                        style={{ width: '5rem' }}
                      ></Column>
                    </DataTable>
                  )}

                  <div className="mt-4 flex justify-end">
                    <Space>
                      {/* <Button
                  disabled={charges!.length <= 0}
                  type="primary"
                  onClick={handlePrintCs}
                  loading={isLoading}
                >
                  Print Charge Slip
                </Button> */}
                      {/* <Button
                  disabled={charges!.length <= 0}
                  type="primary"
                  onClick={handlePrintCheckList}
                >
                  Print Check List
                </Button> */}

                      <Button
                        type="primary"
                        onClick={handlePrintSoa}
                        loading={isLoading}
                      >
                        Print SOA
                      </Button>
                      {/* <Dropdown menu={{ items: qCounters, onClick: onMenuClick }}>
                  <Button loading={isLoading} type="primary">
                    Print Checklist
                  </Button>
                </Dropdown> */}
                      <Dropdown
                        disabled={Id === '0'}
                        menu={{
                          items: [
                            {
                              label: 'All',
                              key: '0',
                            },
                            ...(checklistDeptOpt.data ?? []),
                          ],
                          onClick: ({ key }) => {
                            handlePrintCheckList(key);
                          },
                        }}
                      >
                        <Button loading={isLoading} type="primary">
                          Print Checklist
                        </Button>
                      </Dropdown>
                      {/* <Button
                  loading={isLoading}
                  type="primary"
                  onClick={() => handlePrintCheckList('*ALL*')}
                >
                  Print Checklist
                </Button> */}
                    </Space>
                  </div>
                </div>
              </section>

              <section className="border-t-2 border-amber-500 bg-white shadow-sm">
                <div className="border-b px-4 py-3">
                  <h2 className="font-semibold text-slate-700">
                    Result Status
                  </h2>
                </div>
                <div className="p-4">
                  <ResultStatus AppointmentId={appointmentDetails?.Id} />
                </div>
              </section>
            </>
          )}
        </main>
      </div>
      {!createOnly && (
        <Modal
          open={showPatients}
          onCancel={() => setShowPatient(false)}
          width={1200}
          footer={false}
          destroyOnClose
        >
          <ListOfPatients handleSelect={handleSelect} />
        </Modal>
      )}
      {/* <Modal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        okText="Yes"
        cancelText="No"
        onOk={handleDelete}
        title=<p className="font-bold">{selectedRecord?.Description}</p>
      >
        Delete this item?
      </Modal> */}
      <Modal
        open={showWebCam}
        footer={false}
        onCancel={() => setShowWebCam(false)}
      >
        <Webcam
          audio={false}
          height={400}
          ref={webcamRef}
          width={400}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
        />
        <Button type="primary" onClick={() => handleCapture()} className="mt-2">
          Capture
        </Button>
      </Modal>
      <input
        style={{ display: 'none' }}
        ref={fileInput}
        type="file"
        accept=".jpg"
        onChange={(e) => onFilePicked(e.target.files)}
      />
      <Modal
        open={showPackageDetails}
        onCancel={() => {
          setShowPackageDetails(false);
          setPackageId(undefined);
        }}
        title="Package Details"
        footer={false}
        width={screen.width - 500}
        destroyOnClose
      >
        <DataTable
          value={packageDetails.data}
          emptyMessage="No Records!"
          stripedRows
          size="small"
        >
          <Column field="Description" header="Description"></Column>
        </DataTable>
      </Modal>

      <Modal
        open={confirmationModal}
        onCancel={() => setConfirmationModal(false)}
        width={700}
        centered
        footer={[
          <Button key="new" onClick={() => handleNewAppointment(PatientId)}>
            Create New Appointment
          </Button>,
          <Button
            key="continue"
            type="primary"
            onClick={() => {
              if (followUpExam && followUpExam[0].fk_Appointments_Id) {
                handleContinueAppointment(followUpExam[0].fk_Appointments_Id);
              }
            }}
          >
            Continue Previous Appointment
          </Button>,
        ]}
      >
        <div>
          <p className="mb-2">
            This patient has pending follow-up examinations from a previous
            appointment:
          </p>

          <ul className="list-disc pl-5">
            {followUpExam.map((item: TCharges) => (
              <li key={item.Id}>{item.Description}</li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
};
