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
  DatePicker,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Radio,
  Select,
  Space,
  Tooltip,
  notification,
} from 'antd';
import { PostData } from '../../helpers';
import { PDFDocument } from 'pdf-lib';
import { Link } from '@tanstack/react-router';
import {
  TAppointmentType,
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
import { BiNote, BiSearch } from 'react-icons/bi';
import Loading from '../../components/loading';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MdOutlineDelete, MdOutlineNotes } from 'react-icons/md';
import Webcam from 'react-webcam';
import axios, { AxiosError } from 'axios';
import AddCharge from '../../components/AddCharge';
import { FaRegEdit } from 'react-icons/fa';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import ResultStatus from '../../components/ResultStatus';
export const Route = createFileRoute('/_authenticated/appointmentdetails/$Id')({
  component: () => <AppointmentDetails />,
});
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
import { isNullOrUndefinedOrBlank } from './../../helpers/index';

const ApiUrl = isDev ? devApi : prodApi;

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
  {
    value: 'other',
    label: 'Other',
  },
];

const positionOnBord = ['engine', 'deck', 'catering'];

const AppointmentDetails = () => {
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const [isMobileTph, setIsMobileTph] = useState(false);
  const [title, setTitle] = useState('');
  const [appType, setAppType] = useState('');
  const router = useRouter();
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();
  const q = useQueryClient();
  const [Net, setNet] = useState<number>(0);
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
  const [showPatients, setShowPatient] = useState(false);
  const [Id, setId] = useState(Route.useParams().Id);
  const [PatientId, setPatientId] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<TCharges | undefined>();
  const [showDelete, setShowDelete] = useState(false);
  const [charges, setCharges] = useState<TCharges[] | undefined>([]);
  const [chargesAll, setChargesAll] = useState<TCharges[] | undefined>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gender, setGender] = useState('');

  console.log(Id);
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
  const printBlob = (blob: Blob) => {
    return new Promise<void>((resolve) => {
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        let cleaned = false;

        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;

          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
          resolve();
        };

        iframe.contentWindow?.addEventListener('afterprint', cleanup);

        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        setTimeout(cleanup, 10000); // fallback
      };
    });
  };

  const handlePrintCheckList = async (dept: string) => {
    setIsLoading(true);
    if (isMobileTph === false && charges!.length <= 0) {
      notification.error({
        message: 'Please add charges first!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (isMobileTph === false && Number(Net) > 0) {
      notification.error({
        message: 'Please pay first the balance at the cashier!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

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

      for (let i = 0; i < pageCount; i++) {
        const singlePdf = await PDFDocument.create();
        const [page] = await singlePdf.copyPages(sourcePdf, [i]);
        singlePdf.addPage(page);

        const singlePdfBytes = await singlePdf.save();

        const blob = new Blob([singlePdfBytes.buffer as ArrayBuffer], {
          type: 'application/pdf',
        });

        await printBlob(blob);
      }
    } catch (error: any) {
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());

      return {
        Status: 0,
        Message: errorString.Message,
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
    } else if (isMobileTph === false && Number(Net) > 0) {
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

  const handleGetChargesAll = async () => {
    try {
      setIsLoading(true);
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentIdAll',
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
        setChargesAll(res.parameters.lst);
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

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
          PositionAppliedFor:
            x.PositionAppliedFor === null || x.PositionAppliedFor === undefined
              ? undefined
              : positionOnBord.includes(x.PositionAppliedFor!)
                ? x.PositionAppliedFor
                : 'other',
          PositionAppliedForOthers: x.PositionAppliedFor,
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

    const res = await PostData('SaveAppointment', {
      ...v,
      Id: Id,
      Date: dayjs(v.Date).format('YYYY-MM-DD'),
      BranchCode: store.branchCode,
      fk_PatientInformation_Id: PatientId,
      fk_QNo_Id: QNo === undefined ? 0 : QNo.Id,
      HmoCompany: v.HmoCompany ?? 0,
      PositionAppliedFor:
        v.PositionAppliedFor === 'other' || v.PositionAppliedFor === undefined
          ? v.PositionAppliedForOthers
          : v.PositionAppliedFor,
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

  const handleEdit = (data: TCharges) => {
    setSelectedRecord(data);
    requestAnimationFrame(() => {
      document
        .getElementById('charge-editor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };
  const actionBodyTemplate = (data: TCharges) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <FaRegEdit
            onClick={() => {
              handleEdit(data);
              // setShowDelete(true);
            }}
            color="green"
            size="20"
            className="cursor-pointer"
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Popconfirm
            title="Delete this record?"
            okText="Yes"
            cancelText="No"
            onConfirm={handleDelete}
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
              onClick={() => {
                setSelectedRecord(data);
                // setShowDelete(true);
              }}
              color="red"
              size="20"
              className="cursor-pointer"
            />
          </Popconfirm>
        </Tooltip>

        <Tooltip title="Details">
          <MdOutlineNotes
            onClick={() => {
              handleGetChargesAll();
              setShowPackageDetails(true);
            }}
            size="20"
            className="cursor-pointer"
          />
        </Tooltip>
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TCharges) => {
    return (
      <div className="p-3">
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
  const handleDelete = async () => {
    const res = await PostData('DeleteCharge', {
      Id: selectedRecord!.Id,
      fk_Appointments_Id: selectedRecord?.fk_Appointments_Id,
      Qty: selectedRecord?.Qty,
      fk_Items_Id: selectedRecord?.fk_Items_Id,
    });
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: 'Successfully deleted!',
          placement: 'topRight',
          duration: 3,
        });
        setShowDelete(false);

        form2.resetFields();
        handleGetCharges();
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

  const net = () => {
    let total = 0;

    for (let sale of charges!) {
      total += sale.Net!;
    }
    setNet(total);
    //// return formatCurrency(total);
    return (
      <p className="font-bold text-lg">
        {total.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
      </p>
    );
  };
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
        <Column footer="" />
        <Column footer={net} />
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
                (
                  option!.children
                    ?.toString()
                    .toLocaleLowerCase() as unknown as string
                ).includes(input.toLocaleLowerCase())
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

  const positionOnBOardWatch = Form.useWatch('PositionAppliedFor', form);

  return (
    <div className="cardBackGround">
      <Helmet>
        <meta charSet="utf-8" />
        <title>{title}</title>
      </Helmet>
      <Divider>Appointment Details</Divider>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            scrollToFirstError
          >
            <div className="grid place-items-center">
              <Avatar size={128} src={picture as string} />
              <Space className="mt-2" direction="vertical">
                <Button
                  type="primary"
                  onClick={() => {
                    setShowWebCam(true);
                  }}
                  // disabled={Id === "0"}
                >
                  Capture from Webcam
                </Button>
              </Space>
            </div>
            <div className="flex gap-x-3 items-center">
              <div className="grid md:grid-cols-2 gap-2">
                <Form.Item
                  name="PatientNo"
                  label="Patient No."
                  // className="md:w-[120px]"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <Input readOnly />
                </Form.Item>
                <div className="flex justify-start items-center">
                  <Tooltip title="Search Patient">
                    <Button
                      type="primary"
                      icon={<BiSearch />}
                      onClick={() => setShowPatient(true)}
                    />
                  </Tooltip>
                </div>
              </div>
              <Tooltip title="Mer">
                <Link
                  to="/mer/$AppointmentId"
                  params={{
                    AppointmentId: Id!.toString(),
                  }}
                >
                  <Button icon={<BiNote />}>MER</Button>
                </Link>
              </Tooltip>
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <Form.Item name="Name" label="Name" className="col-span-2">
                <Input readOnly />
              </Form.Item>
              <Form.Item
                label="Senior/PWD?"
                name="IsSeniorOrPwd"
                rules={[
                  {
                    required: true,
                    message: 'This field is required!',
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <Form.Item name="AppointmentNo" label="Appointment No.">
                <Input readOnly className="font-bold" />
              </Form.Item>

              <Form.Item name="Date" label="Date">
                <DatePicker format="MM/DD/YYYY" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="Appointment Type"
                name="AppointmentType"
                rules={[
                  {
                    required: true,
                    message: 'Appointment type is required!',
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
                  {appointmentType.data &&
                    appointmentType.data.map((d: TAppointmentType) => (
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
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Form.Item label="Civil Status" name="CivilStatus">
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
                  <Select.Option key="D" value="D" title="Divorced">
                    Divorced
                  </Select.Option>
                  <Select.Option key="L" value="L" title="Legally Separated">
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
                  {referredBy.data &&
                    referredBy.data!.map((v: TSettings) => (
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
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                name="fk_HmoCompany_Id"
                label="HMO"
                className="col-span-2"
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
                  {hmo.data &&
                    hmo.data.map((d: THmoCompany) => (
                      <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                        {d.Name}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
              <div className="flex justify-start items-center">
                <Popover
                  content={content}
                  title="New Company/HMO"
                  trigger="click"
                >
                  <Button type="primary">New</Button>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                name="HmoCompany"
                label="Company"
                className="col-span-2"
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
                  {company.data &&
                    company.data.map((d: THmoCompany) => (
                      <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                        {d.Name}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
              <div className="flex justify-start items-center">
                <Popover
                  content={content}
                  title="New Company/HMO"
                  trigger="click"
                >
                  <Button type="primary">New</Button>
                </Popover>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Form.Item name="QueueNo" label="Queue No.">
                <Input readOnly className="font-bold" />
              </Form.Item>
              <Form.Item name="LoaApprovedBy" label="LOA Approved By">
                <Input />
              </Form.Item>
            </div>

            <div className="flex items-start gap-x-3 flex-wrap">
              {/* <Form.Item name="PassportNo" label="Passport No.">
                <Input />
              </Form.Item>
              <Form.Item name="SeamanBookNo" label="Seaman's Book No.">
                <Input />
              </Form.Item> */}
              <Form.Item
                name="CountryOfDestination"
                label="Country Of Destination"
              >
                <AutoComplete
                  filterOption={(inputValue, option) =>
                    option!
                      .value!.toString()
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                >
                  {CountryOfDestination.data &&
                    CountryOfDestination.data!.map((v: TSettings) => (
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
              {/* <Form.Item name="PositionAppliedFor" label="Position Applied For">
                <AutoComplete
                  filterOption={(inputValue, option) =>
                    option!
                      .value!.toString()
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                >
                  {PositionAppliedFor.data &&
                    PositionAppliedFor.data!.map((v: TSettings) => (
                      <AutoComplete.Option
                        key={v.Id}
                        value={v.Value}
                        title={v.Value}
                      >
                        {v.Value}
                      </AutoComplete.Option>
                    ))}
                </AutoComplete>
              </Form.Item> */}
              <Form.Item name="PositionAppliedFor" label="Position Applied For">
                <Select
                  options={positionOnBoardOpt.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />
              </Form.Item>
              {positionOnBOardWatch !== undefined &&
                !positionOnBord.includes(positionOnBOardWatch) && (
                  <Form.Item name="PositionAppliedForOthers" label="Specify">
                    <Input />
                  </Form.Item>
                )}
              <Form.Item name="Employer" label="Employer">
                <Input />
              </Form.Item>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex justify-start items-center">
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </div>
            </div>
          </Form>
        </div>
        <div>
          <div id="charge-editor" className="mb-4 rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold">
                {selectedRecord ? 'Edit Charge' : 'Add Charge'}
              </div>
              {selectedRecord && (
                <Button onClick={() => setSelectedRecord(undefined)}>
                  Cancel Edit
                </Button>
              )}
            </div>
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
                }}
              />
            ) : (
              <div className="text-gray-500">
                Save the appointment before adding charges.
              </div>
            )}
          </div>

          <Space>
            {(appType === 'HEM' || appType === 'AMB') && (
              <>
                <Button
                  type="primary"
                  disabled={Id === '0'}
                  onClick={() => {
                    router.navigate({
                      to: '/billing/$AppointmentId',
                      params: {
                        AppointmentId: Id,
                      },
                    });
                  }}
                >
                  Billing
                </Button>
              </>
            )}
          </Space>

          <div className="mt-2">
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
                filterDisplay="row"
                rowExpansionTemplate={rowExpansionTemplate}
                expandedRows={expandedRows as any}
                onRowToggle={(e) => setExpandedRows(e.data as any)}
                footerColumnGroup={footerGroup}
              >
                <Column
                  expander={charges!.length > 0}
                  style={{ width: '2rem' }}
                />
                <Column
                  field="action"
                  header="Action"
                  body={(data: any) => actionBodyTemplate(data)}
                ></Column>
                <Column field="Description" header="Description"></Column>
                <Column field="Gross" header="Gross"></Column>
                <Column field="HmoAmount" header="Hmo"></Column>
                <Column field="CashPayment" header="Cash Payment"></Column>
                <Column field="Net" header="Net"></Column>
                <Column field="PaymentType" header="Payment Type"></Column>
              </DataTable>
            )}

            <div className="flex justify-end">
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
            <div className="mt-2">
              <Divider>Result Status</Divider>

              <ResultStatus
                AppointmentId={appointmentDetails?.Id}
                AppointmentType={appointmentDetails?.AppointmentType}
                QueueNo={appointmentDetails?.QueueNo}
              />
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={showPatients}
        onCancel={() => setShowPatient(false)}
        width={1200}
        footer={false}
        destroyOnClose
      >
        <ListOfPatients handleSelect={handleSelect} />
      </Modal>
      <Modal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        okText="Yes"
        cancelText="No"
        onOk={handleDelete}
        title=<p className="font-bold">{selectedRecord?.Description}</p>
      >
        Delete this item?
      </Modal>
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
        }}
        title="Package Details"
        footer={false}
        width={screen.width - 500}
        destroyOnClose
      >
        <DataTable
          value={chargesAll}
          emptyMessage="No Records!"
          stripedRows
          size="small"
        >
          <Column field="Description" header="Description"></Column>
          <Column field="Gross" header="Gross"></Column>
          <Column field="HmoAmount" header="Hmo"></Column>
          <Column field="CashPayment" header="Cash Payment"></Column>
          <Column field="Net" header="Net"></Column>
          <Column field="PaymentType" header="Payment Type"></Column>
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
