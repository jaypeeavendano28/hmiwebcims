import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import {
  PostData,
  WithAccess,
  blobToDataUrl,
  isNullOrUndefinedOrBlank,
} from '../../helpers';
import {
  TAppointments,
  TBranches,
  // TDoctors,
  TLaboratoryResultMain,
  TLaboratoryResultTemplates,
  TMedtechs,
} from '../../types';
import { useEffect, useRef, useState } from 'react';
import {
  AutoComplete,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tabs,
  notification,
} from 'antd';
import useAppStore from '../../store';
import { round } from 'lodash';
import LabResult from '../../components/LabResult';
import dayjs from 'dayjs';
import axios from 'axios';
import ChargesPerPatient, {
  getResultBlockedMessage,
  isResultBlockedStatus,
} from '../../components/ChargesPerPatient';
import ExistingLabResults from '../../components/ExistingLabResults';
import FinalizeForm from '../../components/FinalizeForm';
import { BiArrowBack } from 'react-icons/bi';
import { getCompletedResultsSearch } from '../../helpers/resultNavigation';
import { useQuery } from '@tanstack/react-query';
import AddReqPhysician from '../../components/add-req-physician';
import PatientInfoHeader from '../../components/PatientInfoHeader';
import UploadDocumentButton from '../../components/UploadDocumentButton';
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + '/api/';
const devApi = import.meta.env.VITE_DEV_API + '/api/';
const apiUrl = isDev ? devApi : prodApi;
const onlineResultType = 'LAB';
const onlineResultDepartmentId = 1000;
const onlineResultDescription = 'Laboratory Result';
export const Route = createLazyFileRoute(
  '/_authenticated/laboratoryresults/$Id',
)({
  component: () => <LaboratoryResults />,
});
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 18,
      offset: 6,
    },
  },
};
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};
const DEFAULT_REQUESTING_PHYSICIAN_ID = 1567;
const DEFAULT_PATHOLOGIST_ID = 1603;
const getPositiveNumber = (value: unknown) => {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};
const isQualityControlMedtech = (value: unknown) =>
  ['1', 'TRUE', 'Y'].includes(
    String(value ?? '')
      .trim()
      .toUpperCase(),
  );
const isDrugTestDescription = (...values: unknown[]) =>
  values.some((value) => {
    const normalizedValue = String(value ?? '')
      .trim()
      .toUpperCase();

    return (
      normalizedValue.includes('DRUG TEST') ||
      normalizedValue === 'DRUGTEST.RDL'
    );
  });
const getLaboratoryDetailKey = (row: any) => {
  const analyteId = getPositiveNumber(
    row?.TestId ?? row?.fk_Analytes_Id ?? row?.AnalyteId,
  );

  if (analyteId > 0) {
    return `analyte:${analyteId}`;
  }

  const test = String(row?.Test ?? row?.Description ?? '')
    .trim()
    .toUpperCase();
  const sequence = Number(row?.Sequence ?? 0);

  return `layout:${test}:${sequence}`;
};

const mergeLaboratoryDetailsWithTemplate = (
  templateDetails: any[],
  savedDetails: any[],
) => {
  const savedByKey = new Map(
    savedDetails.map((detail) => [getLaboratoryDetailKey(detail), detail]),
  );

  return templateDetails.map((templateDetail) => {
    const savedDetail = savedByKey.get(getLaboratoryDetailKey(templateDetail));

    if (!savedDetail) {
      return templateDetail;
    }

    return {
      ...templateDetail,
      ResultSi: savedDetail.ResultSi,
      ResultConventional: savedDetail.ResultConventional,
      Flag: savedDetail.Flag,
      ShowInPrintOut: savedDetail.ShowInPrintOut,
      Interpretation: savedDetail.Interpretation,
    };
  });
};

const LaboratoryResults = () => {
  const [allowSave, setAllowSave] = useState(false);
  const [key, setKey] = useState(Math.random().toString());
  const [isFinalized, setIsFinalized] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnlineResultShown, setIsOnlineResultShown] = useState(false);
  // const [specimen, setSpecimen] = useState([]);
  const [branchDetails, setBranchDetails] = useState<Partial<TBranches>>({});
  // const [Remarks, setRemarks] = useState([]);
  const [Medtechs, setMedtechs] = useState<TMedtechs[]>([]);
  const [QualityControls, setQualityControls] = useState<TMedtechs[]>([]);
  const [Pathologist, setPathologist] = useState<any[]>([]);
  const [drugTestMsuValues, setDrugTestMsuValues] = useState<string[]>([]);
  const [RequestingPhysician, setRequestingPhysician] = useState([]);
  const [IsSaving, setIsSaving] = useState(false);
  const [ResultNo, setResultNo] = useState('');
  const [ResultId, setResultId] = useState(0);
  const [rowsCol1, setRowsCol1] = useState<any[]>([]);
  const [analyteSuffixes, setAnalyteSuffixes] = useState<
    Record<number, string>
  >({});
  const [analyteHighLowSettings, setAnalyteHighLowSettings] = useState<
    Record<number, string>
  >({});
  const [form] = Form.useForm();
  const router = useRouter();
  const store = useAppStore();
  const [templates, setTemplates] = useState<
    TLaboratoryResultTemplates[] | undefined
  >();
  const Id = Route.useParams().Id;
  const search = Route.useSearch() as {
    templateId?: string | number;
    chargeId?: string | number;
    standalone?: boolean | string;
  };
  const requestedTemplateId = Number(search.templateId ?? 0);
  const requestedChargeId = Number(search.chargeId ?? 0);
  const selectedProcedureHandledRef = useRef('');
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    number | undefined
  >(getPositiveNumber(requestedTemplateId) || undefined);
  const selectedTemplate = templates?.find(
    (template) => Number(template.Id) === Number(selectedTemplateId),
  );
  const hasSelectedTemplate = getPositiveNumber(selectedTemplateId) > 0;
  const [chargeId, setChargeId] = useState(
    getPositiveNumber(requestedChargeId),
  );
  const [activeCharge, setActiveCharge] = useState<any>();
  const [chargeDescription, setChargeDescription] = useState('');
  const isDrugTestResult = isDrugTestDescription(
    selectedTemplate?.Description,
    selectedTemplate?.ReportDisplay,
    selectedTemplate?.ReportName,
    chargeDescription,
  );
  const age = appointmentDetails
    ? `${appointmentDetails.AgeYears}Y${appointmentDetails.AgeMonths}M${appointmentDetails.AgeDays}D`
    : '';
  const isResultSubmitBlocked = isResultBlockedStatus(activeCharge?.Status);
  const resultSubmitBlockedMessage = getResultBlockedMessage(activeCharge);

  const getRowAnalyteId = (row: any) =>
    getPositiveNumber(row?.TestId ?? row?.fk_Analytes_Id ?? row?.AnalyteId);

  const getLaboratoryFlag = (row: any, resultValue = row?.ResultSi) => {
    if (
      String(row?.ShowHighLow ?? '').toUpperCase() !== 'Y' ||
      isNullOrUndefinedOrBlank(row?.IsFrom) ||
      isNullOrUndefinedOrBlank(row?.IsTo) ||
      isNullOrUndefinedOrBlank(resultValue)
    ) {
      return '';
    }

    const result = Number(resultValue);
    const low = Number(row.IsFrom);
    const high = Number(row.IsTo);

    if (
      !Number.isFinite(result) ||
      !Number.isFinite(low) ||
      !Number.isFinite(high) ||
      result <= 0
    ) {
      return '';
    }

    if (result < low) {
      return 'L';
    }

    if (result > high) {
      return 'H';
    }

    return '';
  };

  const attachAnalyteSuffixes = (
    rows: any[],
    suffixes = analyteSuffixes,
    highLowSettings = analyteHighLowSettings,
  ) =>
    rows.map((row) => {
      const analyteId = getRowAnalyteId(row);
      const suffix =
        String(row?.Suffix ?? '').trim() || suffixes[analyteId] || '';
      const showHighLow =
        String(row?.ShowHighLow ?? '').trim() ||
        highLowSettings[analyteId] ||
        '';
      const nextRow = {
        ...row,
        ...(suffix ? { Suffix: suffix } : {}),
        ...(showHighLow ? { ShowHighLow: showHighLow } : {}),
      };

      return {
        ...nextRow,
        Flag: getLaboratoryFlag(nextRow),
      };
    });

  const handleGetAnalyteSuffixes = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetTestAnalytes',
      parameters: {
        BranchCode: store.branchCode,
      },
    });

    const analytes = res?.parameters?.lst ?? [];
    const nextSuffixes = analytes.reduce(
      (map: Record<number, string>, analyte: any) => {
        const analyteId = getPositiveNumber(analyte.Id);
        const suffix = String(analyte.Suffix ?? '').trim();

        if (analyteId > 0 && suffix) {
          map[analyteId] = suffix;
        }

        return map;
      },
      {},
    );
    const nextHighLowSettings = analytes.reduce(
      (map: Record<number, string>, analyte: any) => {
        const analyteId = getPositiveNumber(analyte.Id);
        const showHighLow = String(analyte.ShowHighLow ?? '').trim();

        if (analyteId > 0 && showHighLow) {
          map[analyteId] = showHighLow;
        }

        return map;
      },
      {},
    );

    setAnalyteSuffixes(nextSuffixes);
    setAnalyteHighLowSettings(nextHighLowSettings);
  };

  const refreshOnlineResultStatus = async (nextResultId = ResultId) => {
    const id = getPositiveNumber(nextResultId);

    if (id <= 0) {
      setIsOnlineResultShown(false);
      return;
    }

    const res = await PostData('GetPdfFileStatus', {
      ResultId: id,
      ResultType: onlineResultType,
    });

    setIsOnlineResultShown(Boolean(res?.parameters?.Shown));
  };

  const resetResultWorkspace = () => {
    form.resetFields();
    setRowsCol1([]);
    setResultNo('');
    setResultId(0);
    setSelectedTemplateId(undefined);
    setChargeId(0);
    setChargeDescription('');
    setIsFinalized(false);
    setIsOnlineResultShown(false);
    setAllowSave(false);
  };

  const getLaboratoryTemplateDetails = async (
    templateId?: string | number,
    selectedChargeId?: string | number,
  ) => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetLaboratoryResultTemplate',
      parameters: {
        TemplateId: templateId,
        PatientId: appointmentDetails?.fk_PatientInformation_Id,
        Barcode: '',
        ChargeId: getPositiveNumber(selectedChargeId) || '',
        AppointmentId: appointmentDetails?.Id,
      },
    });

    return res?.parameters?.lst ?? [];
  };

  const handleOpenResult = async (
    resultId: number,
    selectedChargeId?: number,
  ) => {
    setResultId(resultId);
    const mainResult = await PostData('GetRecords', {
      sp: 'udp_GetLabResultMain',
      parameters: {
        Id: resultId,
        ChargeId: selectedChargeId || chargeId || requestedChargeId || null,
      },
    });
    const x: TLaboratoryResultMain | undefined =
      mainResult?.parameters?.lst?.[0];

    if (!x) {
      setRowsCol1([]);
      return;
    }

    const templateId = getPositiveNumber(x.fk_LaboratoryResultTemplates_Id);
    const activeChargeId =
      getPositiveNumber(selectedChargeId) ||
      getPositiveNumber(x.fk_tblChargesMain_ChargeId) ||
      getPositiveNumber(requestedChargeId);

    setSelectedTemplateId(templateId || undefined);
    setChargeId(activeChargeId);
    form.setFieldsValue({
      ReportDate: dayjs(x.ReportDate),
      DateReceived: dayjs(x.ChargeDateReceived ?? x.DateReceived),
      DateCollected: isNullOrUndefinedOrBlank(
        x.ChargeDateCollected ?? x.DateCollected,
      )
        ? undefined
        : dayjs(x.ChargeDateCollected ?? x.DateCollected),
      Pathologist: x.Pathologist,
      Pathologist2: x.Pathologist2,
      Medtech: x.Medtech,
      Qa: x.Qa,
      ResultNo: x.ResultNo,
      RequestingPhysician: x.RequestingPhysician,
      Specimen: x.Specimen,
      Msu: x.Msu,
      Remarks: x.ChargeRemarks ?? x.Remarks,
      LabNo: x.LabNo,
      FinalizedBy: x.FinalizedBy,
      DateFinalized: x.DateFinalized,
    });

    if (!isNullOrUndefinedOrBlank(x.FinalizedBy)) {
      setIsFinalized(true);
      setAllowSave(false);
    } else {
      setIsFinalized(false);
      setAllowSave(true);
    }

    const resultDetails = await PostData('GetRecords', {
      sp: 'udp_GetLabResultDetails',
      parameters: {
        Id: resultId,
      },
    });

    const savedDetails = resultDetails?.parameters?.lst ?? [];
    let details = savedDetails;

    if (templateId > 0 && activeChargeId > 0) {
      const allowedDetails = await getLaboratoryTemplateDetails(
        templateId,
        activeChargeId,
      );
      details = mergeLaboratoryDetailsWithTemplate(allowedDetails, details);
    }

    setRowsCol1(attachAnalyteSuffixes(details));
    await refreshOnlineResultStatus(resultId);
  };
  const handleGetAppointmentDetails = async () => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetAppointmentDetails',
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      setAppointmentDetails(res.parameters.lst[0]);
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetLaboratoryResultTemplates2',
      parameters: {
        BranchCode: store.branchCode,
        AppointmentId: Id,
      },
    });
    if (res) {
      setTemplates(res.parameters.lst);
    }
  };
  const getSharedLaboratoryHeader = async () => {
    const appointmentId = getPositiveNumber(appointmentDetails?.Id ?? Id);

    if (appointmentId <= 0) {
      return undefined;
    }

    const res = await PostData('GetRecords', {
      sp: 'udp_GetLaboratorySharedHeaderByAppointment',
      parameters: {
        AppointmentId: appointmentId,
      },
    });

    return res?.parameters?.lst?.[0] as
      | Partial<TLaboratoryResultMain>
      | undefined;
  };
  const handleNew = async (
    templateId?: string | number,
    selectedChargeId?: string | number,
    selectedChargeDescription?: string,
  ) => {
    const nextTemplateId = templateId ?? selectedTemplateId;
    const nextChargeId =
      getPositiveNumber(selectedChargeId) ||
      chargeId ||
      getPositiveNumber(requestedChargeId);

    if (isNullOrUndefinedOrBlank(nextTemplateId)) {
      notification.error({
        message: 'Unable to identify the laboratory template.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    setSelectedTemplateId(getPositiveNumber(nextTemplateId) || undefined);
    setChargeId(nextChargeId);
    form.resetFields();
    setRowsCol1([]);
    await handleLoadTemplate(nextTemplateId, nextChargeId);
    const sharedHeader = await getSharedLaboratoryHeader();
    const nextTemplate = templates?.find(
      (template) => Number(template.Id) === Number(nextTemplateId),
    );
    const isNextDrugTest = isDrugTestDescription(
      nextTemplate?.Description,
      nextTemplate?.ReportDisplay,
      nextTemplate?.ReportName,
      selectedChargeDescription,
      chargeDescription,
    );
    form.resetFields();
    form.setFieldsValue({
      ReportDate: dayjs(),
      DateReceived: sharedHeader?.DateReceived
        ? dayjs(sharedHeader.DateReceived)
        : dayjs(),
      DateCollected: sharedHeader?.DateCollected
        ? dayjs(sharedHeader.DateCollected)
        : dayjs(),
      TemplateId: nextTemplateId,
      LabNo: sharedHeader?.LabNo || undefined,
      RequestingPhysician:
        getPositiveNumber(sharedHeader?.RequestingPhysician) ||
        DEFAULT_REQUESTING_PHYSICIAN_ID,
      Medtech: getPositiveNumber(sharedHeader?.Medtech) || undefined,
      Qa:
        getPositiveNumber(sharedHeader?.Qa) ||
        getPositiveNumber(branchDetails.QualityControl) ||
        undefined,
      Pathologist:
        getPositiveNumber(sharedHeader?.Pathologist) || DEFAULT_PATHOLOGIST_ID,
      Pathologist2: isNextDrugTest
        ? getPositiveNumber(sharedHeader?.Pathologist2) || undefined
        : undefined,
      Msu: isNextDrugTest ? sharedHeader?.Msu || undefined : undefined,
      Remarks: sharedHeader?.Remarks || undefined,
    });
    setResultNo('');
    setResultId(0);
    setIsFinalized(false);
    setIsOnlineResultShown(false);
    setAllowSave(true);
  };
  const handleLoadTemplate = async (
    templateId?: string | number,
    selectedChargeId?: string | number,
  ) => {
    const nextTemplateId = templateId ?? selectedTemplateId;
    const nextChargeId =
      getPositiveNumber(selectedChargeId) ||
      chargeId ||
      getPositiveNumber(requestedChargeId);
    setRowsCol1([]);

    if (isNullOrUndefinedOrBlank(nextTemplateId)) {
      return;
    }

    const details = await getLaboratoryTemplateDetails(
      nextTemplateId,
      nextChargeId,
    );
    setRowsCol1(attachAnalyteSuffixes(details));
  };
  const getResultConventionalValue = (value: unknown) =>
    isNullOrUndefinedOrBlank(value) ? value : String(value);
  const isHeaderLaboratoryDetail = (detail: any) =>
    detail?.IsHeader === true ||
    String(detail?.IsHeader ?? '')
      .trim()
      .toUpperCase() === 'Y';
  const getShowInPrintOutValue = (detail: any) =>
    isHeaderLaboratoryDetail(detail)
      ? isNullOrUndefinedOrBlank(detail?.ShowInPrintOut)
        ? true
        : Boolean(detail?.ShowInPrintOut)
      : !isNullOrUndefinedOrBlank(detail?.ResultSi);

  const handleSaveResult = async (x: any, submitAfterSave = false) => {
    const data: any = [...rowsCol1];
    const index = data.findIndex((obj: any) => obj.Id === x.Id);
    if (index < 0) {
      return;
    }

    data[index].Flag = getLaboratoryFlag(data[index], x.ResultSi);

    if (
      !isNullOrUndefinedOrBlank(data[index].Conversion) &&
      !isNullOrUndefinedOrBlank(x.ResultSi)
    ) {
      const conversion = Number(data[index].Conversion);
      const resultSi = Number(x.ResultSi);

      if (conversion > 0 && Number.isFinite(resultSi)) {
        const conversionOperation = String(
          data[index].ConversionOperation ?? 'M',
        ).toUpperCase();
        const convertedResult =
          conversionOperation === 'D'
            ? resultSi / conversion
            : resultSi * conversion;
        const conversionRounding = String(
          data[index].ConversionRounding ?? 'D',
        ).toUpperCase();
        const decimalPlaces = conversionRounding === 'W' ? 0 : 2;

        data[index].ResultConventional = String(
          round(convertedResult, decimalPlaces),
        );
      }
    }
    data[index].ResultSi = x.ResultSi;
    data[index].ShowInPrintOut = getShowInPrintOutValue({
      ...data[index],
      ShowInPrintOut: x.ShowInPrintOut,
    });

    setRowsCol1(data);

    if (submitAfterSave) {
      setTimeout(() => {
        form.submit();
      }, 0);
    }
  };
  const handleSubmitForm = async (values: any) => {
    if (isResultSubmitBlocked) {
      notification.warning({
        message: resultSubmitBlockedMessage,
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    console.log(rowsCol1);
    try {
      let detailsToSave = rowsCol1;

      if (ResultId > 0 && selectedTemplateId && chargeId) {
        const resultDetails = await PostData('GetRecords', {
          sp: 'udp_GetLabResultDetails',
          parameters: {
            Id: ResultId,
          },
        });
        const savedDetails = resultDetails?.parameters?.lst ?? [];
        const currentDetailKeys = new Set(rowsCol1.map(getLaboratoryDetailKey));
        const otherProcedureDetails = savedDetails.filter(
          (detail: any) =>
            !currentDetailKeys.has(getLaboratoryDetailKey(detail)),
        );

        detailsToSave = [...rowsCol1, ...otherProcedureDetails];
      }

      const valuesToSave = {
        Main: {
          ...values,
          BranchCode: store.branchCode,
          ReportDate: dayjs(new Date()).format('YYYY-MM-DD'),
          DateReceived: dayjs(values.DateReceived).format(),
          DateCollected: dayjs(values.DateCollected).format(),
          fk_tblPatientInformation_PatientId:
            appointmentDetails?.fk_PatientInformation_Id,
          Id: ResultId,
          fk_tblChargesMain_ChargeId:
            chargeId || getPositiveNumber(requestedChargeId) || '',
          fk_LaboratoryResultTemplates_Id: selectedTemplateId,
          Username: store.username,
          ResultNo: ResultNo,
          AdmissionId: appointmentDetails?.Id,
        },
        Details: detailsToSave.map((detail: any) => ({
          ...detail,
          ShowInPrintOut: getShowInPrintOutValue(detail),
          ResultConventional: getResultConventionalValue(
            detail.ResultConventional,
          ),
        })),
      };
      setIsProcessing(true);
      const res = await PostData('SaveLaboratoryResultNew', valuesToSave);
      if (res) {
        setIsProcessing(false);
        if (res.result.status === 1) {
          notification.success({
            message: 'Successfully saved!',
            placement: 'topRight',
            duration: 3,
          });

          setIsSaving(false);
          setResultId(res.result.parameters.ResultId);
          setResultNo(res.result.parameters.ResultNo);
          await refreshOnlineResultStatus(res.result.parameters.ResultId);
          setKey(Math.random().toString());
        } else {
          setIsProcessing(false);
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setIsProcessing(false);
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  useQuery({
    queryKey: ['requesting-physicians'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });

      const requestingPhysicians = res.parameters.lst;
      setRequestingPhysician(requestingPhysicians);

      if (
        requestingPhysicians.some(
          (doctor: any) =>
            getPositiveNumber(doctor.Id) === DEFAULT_REQUESTING_PHYSICIAN_ID,
        ) &&
        isNullOrUndefinedOrBlank(form.getFieldValue('RequestingPhysician'))
      ) {
        form.setFieldValue(
          'RequestingPhysician',
          DEFAULT_REQUESTING_PHYSICIAN_ID,
        );
      }
    },
    refetchOnWindowFocus: false,
  });

  const handleInitialize = async () => {
    let res: any;
    // let res = await PostData('GetRecords', {
    //   sp: 'udp_GetDoctors',
    //   parameters: {},
    // });
    // if (res) {
    //   const requestingPhysicians = res.parameters.lst;
    //   setRequestingPhysician(requestingPhysicians);

    //   if (
    //     requestingPhysicians.some(
    //       (doctor: any) =>
    //         getPositiveNumber(doctor.Id) === DEFAULT_REQUESTING_PHYSICIAN_ID,
    //     ) &&
    //     isNullOrUndefinedOrBlank(form.getFieldValue('RequestingPhysician'))
    //   ) {
    //     form.setFieldValue(
    //       'RequestingPhysician',
    //       DEFAULT_REQUESTING_PHYSICIAN_ID,
    //     );
    //   }
    // }

    res = await PostData('GetRecords', {
      sp: 'udp_GetListOfMedtechs',
      parameters: {
        BranchCode: store.branchCode,
        Type: 'M',
      },
    });
    if (res) {
      setMedtechs(res.parameters.lst ?? []);
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetListOfMedtechs',
      parameters: {
        BranchCode: store.branchCode,
        Type: 'M',
        IsQA: true,
      },
    });
    if (res) {
      setQualityControls(
        (res.parameters.lst ?? []).filter((medtech: TMedtechs) =>
          isQualityControlMedtech(medtech.IsQA),
        ),
      );
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetListOfPathologist',
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      const pathologists = res.parameters.lst;
      setPathologist(pathologists);
      const defaultPathologist = pathologists.find(
        (d: any) => getPositiveNumber(d.Id) === DEFAULT_PATHOLOGIST_ID,
      );

      if (
        defaultPathologist &&
        isNullOrUndefinedOrBlank(form.getFieldValue('Pathologist'))
      ) {
        form.setFieldValue('Pathologist', defaultPathologist.Id);
      }
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetBranchDetails',
      parameters: {
        BranchCode: store.branchCode,
      },
    });
    if (res) {
      const currentBranch = res.parameters.lst[0] as Partial<TBranches>;
      setBranchDetails(currentBranch);

      const defaultQualityControlId = getPositiveNumber(
        currentBranch.QualityControl,
      );
      if (
        defaultQualityControlId > 0 &&
        isNullOrUndefinedOrBlank(form.getFieldValue('Qa'))
      ) {
        form.setFieldValue('Qa', defaultQualityControlId);
      }
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetSpecimen',
      parameters: {},
    });
    if (res) {
      // setSpecimen(res.parameters.lst);
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetDrugTestMsuValues',
      parameters: {},
    });
    if (res) {
      setDrugTestMsuValues(
        (res.parameters.lst ?? [])
          .map((item: any) => String(item.Value ?? '').trim())
          .filter(Boolean),
      );
    }

    ///udp_GetBranchDetails
  };
  const handleDeleteResult = async () => {
    const res = await WithAccess({
      sp: 'udp_WithAccess',
      parameters: {
        Username: store.username,
        ModuleId: 33,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: 'Access denied for module-Laboratory Result-Delete',
          placement: 'topRight',
          duration: 3,
        });
      } else {
        try {
          setIsProcessing(true);
          const res = await PostData('DeleteResult', {
            Id: ResultId,
            Table: 'LAB',
          });
          if (res) {
            setIsProcessing(false);
            if (res.status === 1) {
              notification.success({
                message: 'Result successfully deleted!',
                placement: 'topRight',
                duration: 3,
              });
              location.reload();
            } else {
              notification.error({
                message: res.message,
                placement: 'topRight',
                duration: 3,
              });
            }
          }
        } catch (error: any) {
          setIsProcessing(false);
          notification.error({
            message: error.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    }
  };
  const fetchResultPdf = async () => {
    const selectedChargeId = chargeId || getPositiveNumber(requestedChargeId);
    const url =
      apiUrl +
      'labresult/' +
      ResultId +
      '/clinicalchem.rdl/N' +
      (selectedChargeId > 0 ? `?ChargeId=${selectedChargeId}` : '');
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'blob',
    });

    return new Blob([response.data], {
      type: 'application/pdf',
    });
  };

  const getOnlineResultDescription = () =>
    String(selectedTemplate?.Description ?? '').trim() ||
    chargeDescription.trim() ||
    onlineResultDescription;

  const handlePrint = async (isPrint: boolean = false) => {
    setIsProcessing(true);
    const isDownload = false;
    try {
      const newBlob = await fetchResultPdf();
      let downloadBlob;
      if (isDownload === false) {
        const data = window.URL.createObjectURL(newBlob);
        if (isPrint === true) {
          const a = document.createElement('a');

          a.setAttribute('href', data);
          a.setAttribute('target', '_blank');

          a.click();
        }

        setIsProcessing(false);
      } else {
        downloadBlob = new Blob([newBlob], {
          type: 'application/excel',
        });
        const a = document.createElement('a');
        document.body.appendChild(a);
        const url = window.URL.createObjectURL(downloadBlob);
        a.href = url;
        a.download = 'download.xls';
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 0);

        setIsProcessing(false);
      }
    } catch (error: any) {
      setIsProcessing(false);
      const errorMessage = error.response?.data?.text
        ? JSON.parse(await error.response.data.text()).Message
        : error.message;
      notification.error({
        message: errorMessage,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const handleOnlineResult = async (v: any) => {
    setShowFinalize(false);
    if (ResultId === 0) {
      notification.error({
        message: 'Please save the result first.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setIsProcessing(true);

    try {
      let res;
      if (isOnlineResultShown) {
        res = await PostData('UnshowPdfFile', {
          ResultId: ResultId,
          ResultType: onlineResultType,
          Username: v.Username,
          Password: v.Password,
        });
      } else {
        const pdf = await blobToDataUrl(await fetchResultPdf());
        res = await PostData('UploadPdfFile', {
          ResultId: ResultId,
          ResultType: onlineResultType,
          fk_Appointments_Id: appointmentDetails?.Id,
          fk_Departments_Id: onlineResultDepartmentId,
          Description: getOnlineResultDescription(),
          ShowInCompanyPortal: 'Y',
          Pdf: pdf,
          Username: v.Username,
          Password: v.Password,
        });
      }

      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: isOnlineResultShown
              ? 'Result hidden from online results.'
              : 'Result shown to online results.',
            placement: 'topRight',
            duration: 3,
          });
          await refreshOnlineResultStatus(ResultId);
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setIsProcessing(false);
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const getTemplateIdFromCharge = (data: any) =>
    getPositiveNumber(
      data?.fk_LabResultTemplateId ??
        data?.DirectLabTemplateId ??
        data?.LabTemplateId ??
        data?.TemplateId ??
        data?.fk_LaboratoryResultTemplates_Id,
    );

  const getLabChargeResultTarget = async (selectedChargeId: number) => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetLabChargeResultTarget',
        parameters: {
          ChargeId: selectedChargeId,
        },
      });

      return res?.parameters?.lst?.[0];
    } catch (error) {
      console.log(error);
      return undefined;
    }
  };

  const navigateToLaboratoryResult = ({
    appointmentId,
    selectedChargeId,
    selectedTemplateId,
  }: {
    appointmentId: number;
    selectedChargeId: number;
    selectedTemplateId: number;
  }) => {
    router.navigate({
      to: '/laboratoryresults/$Id',
      params: {
        Id: appointmentId.toString(),
      },
      search: {
        templateId: selectedTemplateId || undefined,
        chargeId: selectedChargeId,
        standalone: search.standalone,
      },
    });
  };

  const handleNewResult = async (data: any) => {
    const appointmentId =
      getPositiveNumber(data?.fk_Appointments_Id) ||
      getPositiveNumber(data?.AppointmentId) ||
      getPositiveNumber(Id);
    const selectedChargeId =
      getPositiveNumber(data?.Id) || getPositiveNumber(data?.ChargeId);
    let nextTemplateId = getTemplateIdFromCharge(data);
    let existingResultId = getPositiveNumber(data?.ResultId);
    let nextChargeDescription = String(data?.Description ?? '');

    if (!appointmentId || !selectedChargeId) {
      notification.info({
        message: 'Unable to open selected laboratory charge.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (nextTemplateId <= 0) {
      const chargeTarget = await getLabChargeResultTarget(selectedChargeId);
      nextTemplateId = getTemplateIdFromCharge(chargeTarget);
      existingResultId =
        getPositiveNumber(chargeTarget?.ResultId) || existingResultId;
      nextChargeDescription =
        String(chargeTarget?.Description ?? '') || nextChargeDescription;
    }

    const isChangingCharge = selectedChargeId !== getPositiveNumber(chargeId);

    if (isChangingCharge || nextTemplateId <= 0) {
      form.resetFields();
      setRowsCol1([]);
      setResultNo('');
      setIsFinalized(false);
      setIsOnlineResultShown(false);
      setAllowSave(false);
    }

    setSelectedTemplateId(nextTemplateId > 0 ? nextTemplateId : undefined);
    setChargeId(selectedChargeId);
    setActiveCharge(data);
    setChargeDescription(nextChargeDescription);
    setResultId(existingResultId);
    if (existingResultId > 0) {
      void refreshOnlineResultStatus(existingResultId);
    } else {
      setIsOnlineResultShown(false);
    }

    if (nextTemplateId <= 0) {
      selectedProcedureHandledRef.current = `${appointmentId}:0:${selectedChargeId}`;
      notification.info({
        message: 'Unable to identify the laboratory template.',
        placement: 'topRight',
        duration: 3,
      });
    }

    navigateToLaboratoryResult({
      appointmentId,
      selectedChargeId,
      selectedTemplateId: nextTemplateId,
    });
  };

  useEffect(() => {
    handleGetAppointmentDetails();
    handleInitialize();
    handleGetAnalyteSuffixes();
  }, []);
  useEffect(() => {
    if (
      Object.keys(analyteSuffixes).length === 0 &&
      Object.keys(analyteHighLowSettings).length === 0
    ) {
      return;
    }

    setRowsCol1((currentRows) =>
      attachAnalyteSuffixes(
        currentRows,
        analyteSuffixes,
        analyteHighLowSettings,
      ),
    );
  }, [analyteHighLowSettings, analyteSuffixes]);
  useEffect(() => {
    const hasRequestedTemplate =
      Number.isFinite(requestedTemplateId) && requestedTemplateId > 0;
    const hasRequestedCharge =
      Number.isFinite(requestedChargeId) && requestedChargeId > 0;

    if (!appointmentDetails || (!hasRequestedTemplate && !hasRequestedCharge)) {
      return;
    }

    const procedureKey = `${Id}:${requestedTemplateId}:${requestedChargeId}`;
    if (selectedProcedureHandledRef.current === procedureKey) {
      return;
    }

    const openSelectedProcedure = async () => {
      let nextTemplateId = hasRequestedTemplate ? requestedTemplateId : 0;
      let existingResultId = 0;
      let nextChargeDescription = '';

      if (hasRequestedCharge) {
        const chargeTarget = await getLabChargeResultTarget(requestedChargeId);
        nextTemplateId =
          nextTemplateId || getTemplateIdFromCharge(chargeTarget);
        existingResultId = getPositiveNumber(chargeTarget?.ResultId);
        nextChargeDescription = String(chargeTarget?.Description ?? '');
        setChargeId(requestedChargeId);
        setChargeDescription(nextChargeDescription);
      }

      if (!nextTemplateId && !templates) {
        return;
      }

      if (!hasRequestedCharge && !nextTemplateId && templates?.length === 1) {
        nextTemplateId = getPositiveNumber(templates[0].Id);
      }

      if (!nextTemplateId) {
        resetResultWorkspace();
        notification.info({
          message: 'Unable to identify the laboratory template.',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      setSelectedTemplateId(getPositiveNumber(nextTemplateId) || undefined);
      selectedProcedureHandledRef.current = procedureKey;

      if (existingResultId <= 0) {
        const res = await PostData('GetRecords', {
          sp: 'udp_GetLabResultForAppointmentTemplate',
          parameters: {
            AppointmentId: Number(Id),
            TemplateId: nextTemplateId,
            ChargeId: hasRequestedCharge ? requestedChargeId : null,
          },
        });
        existingResultId = Number(res?.parameters?.lst?.[0]?.Id ?? 0);
      }

      if (existingResultId > 0) {
        await handleOpenResult(
          existingResultId,
          hasRequestedCharge ? requestedChargeId : undefined,
        );
      } else {
        await handleNew(
          nextTemplateId,
          requestedChargeId,
          nextChargeDescription,
        );
      }

      if (nextChargeDescription) {
        setChargeDescription(nextChargeDescription);
      }
    };

    void openSelectedProcedure();
  }, [
    Id,
    appointmentDetails,
    requestedChargeId,
    requestedTemplateId,
    templates,
  ]);
  return (
    <div className="cardBackGround">
      <PatientInfoHeader
        appointmentId={appointmentDetails?.Id}
        patientId={appointmentDetails?.fk_PatientInformation_Id}
        name={appointmentDetails?.Name}
        age={age}
        sex={appointmentDetails?.Sex}
        appointmentNo={appointmentDetails?.AppointmentNo}
      />

      <Divider className="print:hidden">
        Laboratory Department Result
        {chargeDescription || selectedTemplate?.Description
          ? ` (${chargeDescription || selectedTemplate?.Description})`
          : ''}
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
                    params: {
                      station: '1',
                    },
                    search: getCompletedResultsSearch(),
                  })
                }
              >
                Back to list
              </Button>
              <UploadDocumentButton
                patientId={appointmentDetails?.fk_PatientInformation_Id}
                appointmentId={appointmentDetails?.Id}
                departmentId={onlineResultDepartmentId}
              />
            </Space>
            <Divider>Charges</Divider>
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  label: 'Charges',
                  key: '1',
                  children: (
                    <ChargesPerPatient
                      AppointmentId={appointmentDetails?.Id}
                      Counter={['LAB']}
                      handleNewResult={handleNewResult}
                      Key={key}
                      activeChargeId={chargeId}
                      onActiveChargeChange={setActiveCharge}
                    />
                  ),
                },
                {
                  label: 'Existing Results',
                  key: '2',
                  children: (
                    <ExistingLabResults
                      PatientId={appointmentDetails?.fk_PatientInformation_Id}
                      activeChargeId={chargeId}
                      handleOpen={(data) => {
                        const resultAppointmentId = getPositiveNumber(
                          data?.fk_Appointments_Id,
                        );
                        const resultChargeId = getPositiveNumber(data?.Id);
                        const resultTemplateId = getPositiveNumber(
                          data?.LabTemplateId,
                        );

                        if (
                          resultAppointmentId > 0 &&
                          resultAppointmentId !== appointmentDetails?.Id
                        ) {
                          void router.navigate({
                            to: '/laboratoryresults/$Id',
                            params: { Id: String(resultAppointmentId) },
                            search: {
                              templateId: resultTemplateId,
                              chargeId: resultChargeId,
                            },
                          });
                          return;
                        }

                        setActiveCharge(data);
                        setChargeDescription(String(data?.Description ?? ''));
                        handleOpenResult(
                          getPositiveNumber(data?.ResultId),
                          resultChargeId,
                        );
                      }}
                      Key={key}
                    />
                  ),
                },
              ]}
            />
          </div>
        </aside>
        <main className="min-w-0 lg:col-span-9">
          {!hasSelectedTemplate ? (
            <div className="flex min-h-[320px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
              <div>
                <p className="text-base font-semibold text-slate-700">
                  Please click the charges result first.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Select a laboratory charge on the left to load the result
                  form.
                </p>
              </div>
            </div>
          ) : (
            <>
              {isDrugTestResult && (
                <div className="mb-4 border-b border-slate-200 pb-3">
                  <h2 className="text-sm font-semibold uppercase text-slate-800">
                    Drug Test Result
                  </h2>
                </div>
              )}
              <div className="mt-2">
                <div className="grid grid-cols-4 gap-4">
                  <div className="font-bold text-md">Test Name</div>
                  <div className="font-bold text-md">Result(SI)</div>
                  <div className="font-bold text-md">Reference Value(SI)</div>
                  {/* <div className="font-bold text-md">Result(Conv.)</div>
              <div className="font-bold text-md">Reference Value(Conv.)</div> */}
                  <div className="font-bold text-md">Flag</div>
                </div>
                {rowsCol1.map((v: any) => (
                  <>
                    {/* {v.IsWithResult === "N" && (
                  <div
                    key={v.Id}
                    className={v.IsBold === "Y" ? "font-bold" : "font-normal"}
                  >
                    {v.Test}
                  </div>
                )} */}
                    <>
                      <LabResult
                        data={v}
                        handleSaveResult={(x: any, submitAfterSave?: boolean) =>
                          handleSaveResult(x, submitAfterSave)
                        }
                        key={v.Id}
                        ResultId={ResultId}
                      />
                    </>
                    {/* {v.IsWithResult === "Y" && (
                  <>
                    <LabResult
                      data={v}
                      handleSaveResult={(x: any) => handleSaveResult(x)}
                      key={v.Id}
                    />
                  </>
                )} */}
                  </>
                ))}
              </div>
              <Form
                //  layout="vertical"
                {...formItemLayout}
                form={form}
                onFinish={handleSubmitForm}
                scrollToFirstError
              >
                <Form.Item label="Result Id." name="ResultId">
                  <strong>{ResultId}</strong>
                </Form.Item>
                <Form.Item label="Template Id." name="TemplateId">
                  <strong>{selectedTemplateId}</strong>
                </Form.Item>
                <Form.Item label="Result No." name="ResultNo">
                  <strong>{ResultNo}</strong>
                </Form.Item>

                <Form.Item
                  label={
                    isDrugTestResult ? 'Specimen Collected' : 'Date Received'
                  }
                  name="DateReceived"
                  rules={[
                    {
                      required: true,
                      message: 'Date received is required!',
                    },
                  ]}
                >
                  <DatePicker showTime showToday format="MM/DD/YYYY hh:mm A" />
                </Form.Item>
                <Form.Item
                  label={
                    isDrugTestResult ? 'Specimen Recorded' : 'Date Recorded'
                  }
                  name="DateCollected"
                  rules={[
                    {
                      required: true,
                      message: 'Date received is required!',
                    },
                  ]}
                >
                  <DatePicker showTime showToday format="MM/DD/YYYY hh:mm A" />
                </Form.Item>
                {/* <Form.Item
              label="Specimen"
              name="Specimen"
              rules={[
                {
                  max: 100,
                  message: 'Specimen must not exceed 100 characters!',
                },
              ]}
              normalize={(v) => v.toUpperCase()}
            >
              <AutoComplete options={specimen} placeholder="Please select" />
            </Form.Item> */}
                <Form.Item
                  label="Lab No."
                  name="LabNo"
                  rules={[
                    { required: true, message: 'Specimen is required!' },
                    {
                      max: 100,
                      message: 'Specimen must not exceed 100 characters!',
                    },
                  ]}
                  normalize={(v) => v.toUpperCase()}
                >
                  <Input />
                </Form.Item>
                {/* <Form.Item
              label="Test Principle"
              name="TestPrinciple"
              rules={[
                {
                  max: 200,
                },
              ]}
            >
              <AutoComplete
                options={testPrinciple}
                placeholder="Please select"
              />
            </Form.Item> */}
                <div className="flex gap-x-1 ">
                  <Form.Item
                    label="Requesting Physician"
                    name="RequestingPhysician"
                    className="flex-grow"
                  >
                    <Select
                      showSearch
                      allowClear
                      filterOption={(inputValue, option: any) =>
                        option.title
                          .toUpperCase()
                          .indexOf(inputValue.toUpperCase()) !== -1
                      }
                    >
                      {RequestingPhysician.map((d: any) => (
                        <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                          {d.Name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <AddReqPhysician />
                </div>
                <Form.Item
                  label="Medical Technologist"
                  name="Medtech"
                  rules={[
                    {
                      required: true,
                      message: 'Medical technologist is required!',
                    },
                  ]}
                >
                  <Select
                    showSearch
                    allowClear
                    filterOption={(inputValue, option: any) =>
                      option.title
                        .toUpperCase()
                        .indexOf(inputValue.toUpperCase()) !== -1
                    }
                  >
                    {Medtechs.map((d: any) => (
                      <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                        {d.Name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {isDrugTestResult && (
                  <Form.Item label="MSU" name="Msu">
                    <AutoComplete
                      allowClear
                      options={drugTestMsuValues.map((value) => ({
                        value,
                      }))}
                      filterOption={(inputValue, option) =>
                        String(option?.value ?? '')
                          .toUpperCase()
                          .includes(inputValue.toUpperCase())
                      }
                      placeholder="Enter or select MSU"
                    />
                  </Form.Item>
                )}

                <Form.Item
                  label="Quality Control"
                  name="Qa"
                  rules={[
                    {
                      required: true,
                      message: 'Quality control signer is required!',
                    },
                  ]}
                >
                  <Select
                    showSearch
                    allowClear
                    filterOption={(inputValue, option: any) =>
                      option.title
                        .toUpperCase()
                        .indexOf(inputValue.toUpperCase()) !== -1
                    }
                  >
                    {QualityControls.map((d: any) => (
                      <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                        {d.Name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={isDrugTestResult ? 'Pathologist 1' : 'Pathologist'}
                  name="Pathologist"
                  rules={[
                    {
                      required: true,
                      message: 'Pathologist is required!',
                    },
                  ]}
                >
                  <Select
                    showSearch
                    allowClear
                    filterOption={(inputValue, option: any) =>
                      option.title
                        .toUpperCase()
                        .indexOf(inputValue.toUpperCase()) !== -1
                    }
                  >
                    {Pathologist.map((d: any) => (
                      <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                        {d.Name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* {isDrugTestResult && (
                  <Form.Item label="Pathologist 2" name="Pathologist2">
                    <Select
                      showSearch
                      allowClear
                      filterOption={(inputValue, option: any) =>
                        option.title
                          .toUpperCase()
                          .indexOf(inputValue.toUpperCase()) !== -1
                      }
                    >
                      {Pathologist.map((d: any) => (
                        <Select.Option key={d.Id} title={d.Name} value={d.Id}>
                          {d.Name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )} */}

                {/* {isDrugTestResult && (
                  <div className="mb-2 grid grid-cols-[minmax(100px,1fr)_minmax(0,3fr)] gap-4 border-b border-slate-200 pb-2 text-xs font-semibold uppercase text-slate-500">
                    <span>Test</span>
                    <span>Results</span>
                  </div>
                )} */}
                <Form.Item label="Remarks" name="Remarks">
                  <Input.TextArea rows={4} />
                </Form.Item>
                {isFinalized && (
                  <>
                    <Form.Item label="Finalized By" name="FinalizedBy">
                      <Input readOnly />
                    </Form.Item>
                    <Form.Item label="Date Finalized" name="DateFinalized">
                      <Input readOnly />
                    </Form.Item>
                  </>
                )}
                <Form.Item {...tailFormItemLayout}>
                  <div className="flex justify-between">
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        // disabled={IsSaving || ReportStatus === "F"}

                        disabled={
                          (rowsCol1.length <= 0 && !isDrugTestResult) ||
                          isFinalized ||
                          isOnlineResultShown ||
                          isResultSubmitBlocked
                        }
                        loading={isProcessing || IsSaving}
                      >
                        Save
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => {
                          handlePrint(true);
                        }}
                        loading={isProcessing}
                        disabled={ResultId === 0}
                      >
                        Print
                      </Button>
                    </Space>
                    <Space>
                      <Popconfirm
                        title="Cancel Changes?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => {
                          window.location.reload();
                        }}
                      >
                        <Button
                          danger
                          type="primary"
                          loading={isProcessing}
                          disabled={!allowSave || isOnlineResultShown}
                        >
                          Cancel Changes
                        </Button>
                      </Popconfirm>
                      <Button
                        type="primary"
                        onClick={() => {
                          setShowFinalize(true);
                        }}
                        loading={isProcessing}
                        disabled={ResultId === 0}
                      >
                        {isOnlineResultShown
                          ? 'Unshow Online Result'
                          : 'Show to Online Results'}
                      </Button>

                      <Popconfirm
                        title="Delete this result?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => handleDeleteResult()}
                      >
                        <Button
                          danger
                          type="primary"
                          loading={isProcessing}
                          disabled={ResultId === 0 || isFinalized}
                        >
                          Delete Result
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                </Form.Item>
              </Form>
            </>
          )}
        </main>
      </div>
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
