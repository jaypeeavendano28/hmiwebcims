import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import {
  AutoComplete,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
} from 'antd';
import axios from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PostData, blobToDataUrl } from '../../helpers';
import useAppStore from '../../store';
import type {
  TAppointmentVitalSigns,
  TAppointments,
  TDoctors,
} from '../../types';
import ChargesPerPatient, {
  getResultBlockedMessage,
  isResultBlockedStatus,
} from '../../components/ChargesPerPatient';
import { ExistingCadioResults } from '../../components/ExistingCardioResult';
import FinalizeForm from '../../components/FinalizeForm';
import { BiArrowBack } from 'react-icons/bi';
import { getCompletedResultsSearch } from '../../helpers/resultNavigation';
import AddReqPhysician from '../../components/add-req-physician';
import PatientInfoHeader from '../../components/PatientInfoHeader';
import UploadDocumentButton from '../../components/UploadDocumentButton';

export const Route = createLazyFileRoute(
  '/_authenticated/cardiologyresult/$Id',
)({
  component: () => <CardiologyResult />,
});

type MeasurementCell = {
  name: string;
  parameter: string;
  reference?: string;
};

type MeasurementRow = {
  left: MeasurementCell;
  middle: MeasurementCell;
  right: MeasurementCell;
};

type SpectralRow = {
  mitral: string;
  mitralName?: string;
  tissue: string;
  tissueName?: string;
  pulmonary: string;
  pulmonaryName?: string;
};

type Exam = '2decho' | 'treadmill' | 'ecg';

type CardioKeyword = {
  Id: number;
  Description?: string;
  Legend?: string;
};

type CardioKeywordFormValues = {
  Legend?: string;
  Description?: string;
};

type CardiologyResultRecord = Record<
  string,
  string | number | Date | null | undefined
>;

type ExistingCardiologyResultRecord = {
  Id?: string | number;
  ResultId?: string | number;
  AdmissionId?: string | number;
  ChargeId?: string | number;
  fk_Appointments_Id?: string | number;
  fk_Charges_Id?: string | number;
  DateFinalized?: string | Date | null;
  FinalizedBy?: string | null;
  ItemId?: string | number;
  fk_Items_Id?: string | number;
  ChargeDescription?: string;
  Description?: string;
};

const tableClassName =
  'w-full min-w-[940px] table-fixed border-collapse text-[10px] leading-tight text-black';
const thClassName =
  'border border-black px-1 py-[2px] text-left align-top font-bold';
const tdClassName = 'border border-black p-0 align-top';
const labelCellClassName =
  'whitespace-normal break-words border border-black px-1 py-[3px] align-top text-[10px]';
const referenceCellClassName =
  'whitespace-pre-line border border-black px-1 py-[2px] align-top text-[8px] leading-tight';
const inputClassName =
  'block min-h-[20px] w-full bg-transparent px-1 py-[2px] text-center text-[10px] leading-tight outline-none focus:bg-sky-50';
const impressionClassName =
  'min-h-[240px] w-full resize-y rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
const reportTextFields = new Set(['Interpretation', 'Impression']);
const defaultTreadmillImpression = [
  '1. Resting 12 lead ECG__________________________________',
  '2.  No subjective nor objective evidence of stress induced myocardial ischemia during exercise and recovery phase.',
  '   The test is equivocal for evidence of exercise stress induced myocardial ischemia due to presence of_______________________________________',
  '______________________________________',
  '______________________________________',
  'The test is positive for evidence of exercise stress induced myocardial ischemia due to presence of',
  '',
  '',
  'OTHERS:',
  '',
  '3. Patient achieved ____% of predicted maximum target HR at ______METS and a treadmill exercise duration of _____ minutes and ____seconds. _______________functional capacity for age.',
  '4. Arrhythmia: NO   YES  ______________________.',
  '5.  Physiologic BP and HR response to exercise.',
  '6.  Exaggerated BP and HR response to exercise.',
  '7. Exaggerated BP response to exercise.',
].join('\n');
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

const encodeReportLineBreaks = (value?: string) =>
  value?.replace(/\r?\n/g, '\\n');

const decodeReportLineBreaks = (value?: string) => value?.replace(/\\n/g, '\n');

const examLabels: Record<Exam, string> = {
  '2decho': '2D Echo',
  treadmill: 'Treadmill',
  ecg: 'ECG',
};

const examByItemId: Record<number, Exam> = {
  2285: '2decho',
  2283: 'ecg',
  2284: 'treadmill',
};

const getPositiveNumber = (value: unknown) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};

const getExamByItemId = (itemId: unknown) =>
  examByItemId[getPositiveNumber(itemId)];

const saveResultEndpoints: Record<Exam, string> = {
  '2decho': 'SaveCardiology2DEchoResult',
  treadmill: 'SaveCardiologyTreadmillResult',
  ecg: 'SaveCardiologyECGResult',
};

const printReportNames: Record<Exam, string> = {
  '2decho': '2decho.rdl',
  treadmill: 'treadmill.rdl',
  ecg: 'ecg.rdl',
};

const onlineResultTypes: Record<Exam, string> = {
  '2decho': 'CARDIO-2DECHO',
  treadmill: 'CARDIO-TREADMILL',
  ecg: 'CARDIO-ECG',
};

const onlineResultDescriptions: Record<Exam, string> = {
  '2decho': '2D Echo Result',
  treadmill: 'Treadmill Result',
  ecg: 'ECG Result',
};

const onlineResultDepartmentId = 1022;

const normalizeExam = (exam?: string): Exam | undefined => {
  if (exam === 'treadmill' || exam === 'ecg' || exam === '2decho') {
    return exam;
  }

  return undefined;
};

const measurementRows: MeasurementRow[] = [
  {
    left: {
      name: 'TwoDLvidEd',
      parameter: 'LVID (ed)',
      reference: 'Male [4.2-5.8] cm\nFemale [3.8-5.2] cm',
    },
    middle: {
      name: 'TwoDIvstEd',
      parameter: 'IVST (ed)',
      reference: 'Male [0.6-1.0] cm\nFemale [0.6-0.9] cm',
    },
    right: {
      name: 'TwoDRvMid',
      parameter: 'RV (mid)',
      reference: '1.9-3.5 cm',
    },
  },
  {
    left: {
      name: 'TwoDLvidEs',
      parameter: 'LVID (es)',
      reference: 'Male [2.5-4.0] cm\nFemale [2.2-3.5] cm',
    },
    middle: {
      name: 'TwoDIvstEs',
      parameter: 'IVST (es)',
      reference: 'Male [0.6-1.0] cm\nFemale [0.6-0.9] cm',
    },
    right: {
      name: 'TwoDTapse',
      parameter: 'TAPSE',
      reference: 'greater than or\nequal to 17mm',
    },
  },
  {
    left: {
      name: 'TwoDLvVolEd',
      parameter: 'LV Vol (ed)',
      reference: 'Male [62-150] cm\nFemale [46-106] cm',
    },
    middle: {
      name: 'TwoDPwtEd',
      parameter: 'PWT (ed)',
      reference: 'Male [0.6-1.0] cm\nFemale [0.6-0.9] cm',
    },
    right: {
      name: 'TwoDLvot',
      parameter: 'LVOT',
      reference: 'Male [2.3-2.9] cm\nFemale [2.1-2.5]',
    },
  },
  {
    left: {
      name: 'TwoDLvVolEs',
      parameter: 'LV Vol (es)',
      reference: 'Male [21-61] cm\nFemale [14-42] cm',
    },
    middle: {
      name: 'TwoDPwtEs',
      parameter: 'PWT (es)',
      reference: 'Male [0.6-1.0] cm\nFemale [0.6-0.9] cm',
    },
    right: {
      name: 'TwoDAoAnn',
      parameter: 'Ao. ann',
    },
  },
  {
    left: {
      name: 'TwoDLvEfTeicholz',
      parameter: 'LV EF (Teicholz)',
      reference: 'Male [52-72%]\nFemale [54-74%]',
    },
    middle: {
      name: 'TwoDLvmi',
      parameter: 'LVMI',
      reference: 'Male [49-115] gm\nFemale [43-95] gm',
    },
    right: {
      name: 'TwoDAorticRootSinusOfValsalva',
      parameter: 'Aortic root/Sinus of\nvalsalva',
      reference: 'Male [3.1-3.7] cm\nFemale [2.7-3.3]',
    },
  },
  {
    left: {
      name: 'TwoDBiplaneSimpsons',
      parameter: 'Biplane (Simpsons)',
    },
    middle: {
      name: 'TwoDRwt',
      parameter: 'RWT',
      reference: '[0.22-0.42] cm',
    },
    right: {
      name: 'TwoDMpa',
      parameter: 'MPA',
      reference: '0.9-2.9cm',
    },
  },
  {
    left: {
      name: 'TwoDCo',
      parameter: 'CO',
      reference: '4-7 L/min',
    },
    middle: {
      name: 'TwoDAorta',
      parameter: 'Aorta',
      reference: '2.1-3.5cm',
    },
    right: {
      name: 'TwoDRvot',
      parameter: 'RVOT',
      reference: '2.0-3.0cm',
    },
  },
  {
    left: {
      name: 'TwoDSv',
      parameter: 'SV',
      reference: '50-90mL',
    },
    middle: {
      name: 'TwoDLa',
      parameter: 'LA',
      reference: '2.0-3.5 cm',
    },
    right: {
      name: 'TwoDIvcDiameterExp',
      parameter: 'IVC Diameter (Exp.)',
    },
  },
  {
    left: {
      name: 'TwoDEpss',
      parameter: 'EPSS',
      reference: '<1.0',
    },
    middle: {
      name: 'TwoDLaVolIndex',
      parameter: 'LA Vol. Index',
      reference: '16-34 ml/m2',
    },
    right: {
      name: 'TwoDIvcDiameterInsp',
      parameter: 'IVC Diameter (Insp.)',
      reference: '1.2-2.1cm',
    },
  },
  {
    left: {
      name: 'TwoDHeartRate',
      parameter: 'HEART RATE',
      reference: '60-100 bpm',
    },
    middle: {
      name: 'TwoDRa',
      parameter: 'RA',
      reference: '2.8-4.0 cm',
    },
    right: {
      name: 'TwoDIvcCollapsibility',
      parameter: 'IVC COLLAPSIBILITY',
      reference: '> 50%',
    },
  },
];

const dopplerRows = [
  {
    label: 'Mitral',
    fieldPrefix: 'DopplerMitral',
  },
  {
    label: 'Tricuspid',
    fieldPrefix: 'DopplerTricuspid',
  },
  {
    label: 'Pulmonic',
    fieldPrefix: 'DopplerPulmonic',
  },
  {
    label: 'Aorta',
    fieldPrefix: 'DopplerAorta',
  },
  {
    label: 'LVOT',
    fieldPrefix: 'DopplerLvot',
  },
];

const spectralRows: SpectralRow[] = [
  {
    mitral: 'Deceleration Time',
    mitralName: 'SpectralDecelerationTime',
    tissue: "Lat E'",
    tissueName: 'SpectralLatE',
    pulmonary: 'Pvs/Pvd',
    pulmonaryName: 'SpectralPvsPvd',
  },
  {
    mitral: 'IVRT',
    mitralName: 'SpectralIvrt',
    tissue: "Lat a'",
    tissueName: 'SpectralLatA',
    pulmonary: 'Peak AR vel.',
    pulmonaryName: 'SpectralPeakArVel',
  },
  {
    mitral: '',
    tissue: 'Med E',
    tissueName: 'SpectralMedE',
    pulmonary: 'a Duration',
    pulmonaryName: 'SpectralADuration',
  },
  {
    mitral: '',
    tissue: "Med A'",
    tissueName: 'SpectralMedA',
    pulmonary: '',
  },
  {
    mitral: '',
    tissue: '',
    pulmonary: '',
  },
];

const ValueInput = ({ label, name }: { label: string; name: string }) => (
  <input aria-label={label} className={inputClassName} name={name} />
);

const SectionTitle = ({ children }: { children: string }) => (
  <div className="mb-1 mt-2 pl-5 text-[12px] font-semibold underline">
    {children}
  </div>
);

const MeasurementCells = ({
  cell,
  group,
}: {
  cell: MeasurementCell;
  group: string;
}) => (
  <>
    <td className={labelCellClassName}>{cell.parameter}</td>
    <td className={tdClassName}>
      <ValueInput label={`${group} ${cell.parameter} value`} name={cell.name} />
    </td>
    <td className={referenceCellClassName}>{cell.reference}</td>
  </>
);

type ExamDetailsFieldsProps = {
  dateOfExamination: Dayjs | null;
  dateDone: Dayjs | null;
  dateRead: Dayjs | null;
  requestingPhysician?: number;
  cardiologist?: number;
  requestingPhysicians: TDoctors[];
  cardiologists: TDoctors[];
  onDateOfExaminationChange: (date: Dayjs | null) => void;
  onDateDoneChange: (date: Dayjs | null) => void;
  onDateReadChange: (date: Dayjs | null) => void;
  onRequestingPhysicianChange: (doctorId?: number) => void;
  onCardiologistChange: (doctorId?: number) => void;
};

const ExamDetailsFields = ({
  dateOfExamination,
  dateDone,
  dateRead,
  requestingPhysician,
  cardiologist,
  requestingPhysicians,
  cardiologists,
  onDateOfExaminationChange,
  onDateDoneChange,
  onDateReadChange,
  onRequestingPhysicianChange,
  onCardiologistChange,
}: ExamDetailsFieldsProps) => (
  <div className="mb-4 grid w-full grid-cols-1 gap-2">
    <input
      name="DateOfExamination"
      readOnly
      type="hidden"
      value={dateOfExamination ? dateOfExamination.format('YYYY-MM-DD') : ''}
    />
    <input
      name="DateDone"
      readOnly
      type="hidden"
      value={dateDone ? dateDone.format('YYYY-MM-DD') : ''}
    />
    <input
      name="DateRead"
      readOnly
      type="hidden"
      value={dateRead ? dateRead.format('YYYY-MM-DD') : ''}
    />
    <input
      name="RequestingPhysician"
      readOnly
      type="hidden"
      value={requestingPhysician ?? ''}
    />
    <input
      name="Cardiologist"
      readOnly
      type="hidden"
      value={cardiologist ?? ''}
    />

    <div className="col-span-3">
      <label
        className="mb-1 block text-sm font-semibold text-slate-700"
        htmlFor="date-of-examination"
      >
        Date Of Examination <span className="text-red-600">*</span>
      </label>
      <DatePicker
        className="w-full"
        format="MM/DD/YYYY"
        id="date-of-examination"
        value={dateOfExamination}
        onChange={onDateOfExaminationChange}
      />
    </div>

    <div className="col-span-3">
      <label
        className="mb-1 block text-sm font-semibold text-slate-700"
        htmlFor="date-done"
      >
        Date Done <span className="text-red-600">*</span>
      </label>
      <DatePicker
        className="w-full"
        format="MM/DD/YYYY"
        id="date-done"
        value={dateDone}
        onChange={onDateDoneChange}
      />
    </div>

    <div className="col-span-3">
      <label
        className="mb-1 block text-sm font-semibold text-slate-700"
        htmlFor="date-read"
      >
        Date Read <span className="text-red-600">*</span>
      </label>
      <DatePicker
        className="w-full"
        format="MM/DD/YYYY"
        id="date-read"
        value={dateRead}
        onChange={onDateReadChange}
      />
    </div>

    <div className="col-span-3">
      <label
        className="mb-1 block text-sm font-semibold text-slate-700"
        htmlFor="requesting-physician"
      >
        {/* Requesting Physician <span className="text-red-600">*</span> */}
        Requesting Physician
      </label>
      <div className="flex">
        <Select
          allowClear
          className="w-full"
          id="requesting-physician"
          optionFilterProp="label"
          options={requestingPhysicians.map((doctor) => ({
            label: doctor.Name ?? '',
            value: doctor.Id,
          }))}
          showSearch
          value={requestingPhysician}
          onChange={onRequestingPhysicianChange}
        />
        <AddReqPhysician />
      </div>
    </div>

    <div>
      <label
        className="mb-1 block text-sm font-semibold text-slate-700"
        htmlFor="cardiologist"
      >
        Cardiologist <span className="text-red-600">*</span>
      </label>
      <Select
        allowClear
        className="w-full"
        id="cardiologist"
        optionFilterProp="label"
        options={cardiologists.map((doctor) => ({
          label: doctor.Name ?? '',
          value: doctor.Id,
        }))}
        showSearch
        value={cardiologist}
        onChange={onCardiologistChange}
      />
    </div>
  </div>
);

const TwoDEchoFields = () => (
  <>
    <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
      <div className="min-w-[940px] bg-white p-2 text-black print:min-w-0 print:p-0">
        <SectionTitle>M-Mode / 2D Measurements</SectionTitle>
        <table className={tableClassName}>
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[14%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[8%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr>
              <th className={thClassName}>Parameters</th>
              <th className={thClassName}>Values</th>
              <th className={thClassName}>Parameters</th>
              <th className={thClassName}>Parameters</th>
              <th className={thClassName}>Values</th>
              <th className={thClassName}>Parameters</th>
              <th className={thClassName}>Parameters</th>
              <th className={thClassName}>Values</th>
              <th className={thClassName}>Parameters</th>
            </tr>
          </thead>
          <tbody>
            {measurementRows.map((row) => (
              <tr key={`${row.left.parameter}-${row.middle.parameter}`}>
                <MeasurementCells cell={row.left} group="M-Mode" />
                <MeasurementCells cell={row.middle} group="2D" />
                <MeasurementCells cell={row.right} group="Right heart" />
              </tr>
            ))}
          </tbody>
        </table>

        <SectionTitle>Doppler Measurements</SectionTitle>
        <table className={tableClassName}>
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[7%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[21%]" />
          </colgroup>
          <thead>
            <tr>
              <th className={thClassName} colSpan={4}></th>
              <th
                className={`${thClassName} text-center font-normal`}
                colSpan={5}
              >
                Regurgitation
              </th>
            </tr>
            <tr>
              <th className={thClassName}></th>
              <th
                className={`${thClassName} text-center text-[9px] font-normal`}
              >
                Velocity (cm/sec)
                <br />
                E-A
              </th>
              <th
                className={`${thClassName} text-center text-[9px] font-normal`}
              >
                PeakGradient
                <br />
                (mmHg)
              </th>
              <th className={thClassName}></th>
              <th className={thClassName}>VTI</th>
              <th className={thClassName}>Vena C.</th>
              <th className={thClassName}>PHT</th>
              <th className={thClassName}>JET AREA</th>
              <th
                className={`${thClassName} text-center text-[9px] font-normal`}
              >
                Peak Gradient
                <br />
                (mmHg)
              </th>
            </tr>
          </thead>
          <tbody>
            {dopplerRows.map((valve, index) => (
              <tr key={valve.label}>
                <td className={labelCellClassName}>{valve.label}</td>
                <td className={tdClassName}>
                  <ValueInput
                    label={`${valve.label} velocity`}
                    name={`${valve.fieldPrefix}Velocity`}
                  />
                </td>
                <td className={tdClassName}>
                  <ValueInput
                    label={`${valve.label} peak gradient`}
                    name={`${valve.fieldPrefix}PeakGradient`}
                  />
                </td>
                {index === 0 && (
                  <td className={tdClassName} rowSpan={dopplerRows.length}></td>
                )}
                <td className={tdClassName}>
                  <ValueInput
                    label={`${valve.label} VTI`}
                    name={`${valve.fieldPrefix}Vti`}
                  />
                </td>
                <td className={tdClassName}>
                  <ValueInput
                    label={`${valve.label} vena contracta`}
                    name={`${valve.fieldPrefix}VenaContracta`}
                  />
                </td>
                <td className={tdClassName}>
                  <ValueInput
                    label={`${valve.label} PHT`}
                    name={`${valve.fieldPrefix}Pht`}
                  />
                </td>
                <td className={tdClassName}>
                  <ValueInput
                    label={`${valve.label} jet area`}
                    name={`${valve.fieldPrefix}JetArea`}
                  />
                </td>
                <td className={tdClassName}>
                  <ValueInput
                    label={`${valve.label} regurgitation peak gradient`}
                    name={`${valve.fieldPrefix}RegurgitationPeakGradient`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <SectionTitle>Spectral Doppler Measurements</SectionTitle>
        <table className={tableClassName}>
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[13%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[13%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr>
              <th className={thClassName}>Mitral Flow</th>
              <th className={thClassName}>Values</th>
              <th className={thClassName}></th>
              <th className={thClassName}></th>
              <th className={thClassName} colSpan={2}>
                Tissue Doppler Imaging
              </th>
              <th className={thClassName}></th>
              <th className={thClassName} colSpan={2}>
                Pulmonary Vein
              </th>
            </tr>
          </thead>
          <tbody>
            {spectralRows.map((row, index) => (
              <tr key={`${row.mitral}-${row.tissue}-${index}`}>
                <td className={labelCellClassName}>{row.mitral}</td>
                <td className={tdClassName}>
                  {row.mitralName && (
                    <ValueInput
                      label={`${row.mitral || `mitral ${index}`} value`}
                      name={row.mitralName}
                    />
                  )}
                </td>
                <td className={tdClassName}></td>
                <td className={tdClassName}></td>
                <td className={labelCellClassName}>{row.tissue}</td>
                <td className={tdClassName}>
                  {row.tissueName && (
                    <ValueInput
                      label={`${row.tissue || `tissue ${index}`} value`}
                      name={row.tissueName}
                    />
                  )}
                </td>
                <td className={tdClassName}></td>
                <td className={labelCellClassName}>{row.pulmonary}</td>
                <td className={tdClassName}>
                  {row.pulmonaryName && (
                    <ValueInput
                      label={`${row.pulmonary || `pulmonary ${index}`} value`}
                      name={row.pulmonaryName}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="mt-4 w-full">
      <label
        className="mb-1 block text-sm font-semibold text-slate-700"
        htmlFor="interpretation"
      >
        Interpretation
      </label>
      <textarea
        className={impressionClassName}
        id="interpretation"
        name="Interpretation"
      />
    </div>
  </>
);

const TreadmillFields = () => (
  <div className="w-full">
    <label
      className="mb-1 block text-sm font-semibold text-slate-700"
      htmlFor="treadmill-impression"
    >
      Impression
    </label>
    <textarea
      className={impressionClassName}
      id="treadmill-impression"
      name="Impression"
      defaultValue={defaultTreadmillImpression}
    />
  </div>
);

type EcgFieldsProps = {
  keywords: CardioKeyword[];
  keywordValue: string;
  impression: string;
  onKeywordChange: (value: string) => void;
  onKeywordAppend: (value: string) => void;
  onImpressionChange: (value: string) => void;
  onManageKeywords: () => void;
};

const EcgFields = ({
  keywords,
  keywordValue,
  impression,
  onKeywordChange,
  onKeywordAppend,
  onImpressionChange,
  onManageKeywords,
}: EcgFieldsProps) => (
  <div className="w-full">
    <label
      className="mb-1 block text-sm font-semibold text-slate-700"
      htmlFor="ecg-keywords"
    >
      Keywords
    </label>
    <div className="mb-3 flex gap-2">
      <AutoComplete
        allowClear
        className="w-full"
        id="ecg-keywords"
        options={keywords.map((keyword) => ({
          label: keyword.Legend ?? keyword.Description ?? '',
          value: keyword.Description || keyword.Legend || '',
        }))}
        value={keywordValue}
        onChange={onKeywordChange}
        onSelect={onKeywordAppend}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') {
            return;
          }

          event.preventDefault();
          onKeywordAppend(keywordValue);
        }}
        filterOption={(inputValue, option) =>
          (option?.value ?? '')
            .toString()
            .toUpperCase()
            .includes(inputValue.toUpperCase()) ||
          (option?.label ?? '')
            .toString()
            .toUpperCase()
            .includes(inputValue.toUpperCase())
        }
      />
      <Button htmlType="button" onClick={onManageKeywords}>
        Manage
      </Button>
    </div>

    <label
      className="mb-1 block text-sm font-semibold text-slate-700"
      htmlFor="ecg-impression"
    >
      Impression
    </label>
    <textarea
      className={impressionClassName}
      id="ecg-impression"
      name="Impression"
      value={impression}
      onChange={(event) => onImpressionChange(event.target.value)}
    />
  </div>
);

const CardiologyResult = () => {
  const { Id } = Route.useParams();
  const search = Route.useSearch() as {
    exam?: string;
    chargeId?: string;
    resultId?: string | number;
    standalone?: boolean | string;
  };
  const searchResultId = Number(search.resultId ?? 0);
  const searchChargeId = Number(search.chargeId ?? 0);
  const exam = normalizeExam(search.exam?.toLowerCase());
  const router = useRouter();
  const queryClient = useQueryClient();
  const store = useAppStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [vitalSignsForm] = Form.useForm<TAppointmentVitalSigns>();
  const [keywordForm] = Form.useForm<CardioKeywordFormValues>();
  const [ecgKeyword, setEcgKeyword] = useState('');
  const [ecgImpression, setEcgImpression] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [dateOfExamination, setDateOfExamination] = useState<Dayjs | null>(
    dayjs(),
  );
  const [dateDone, setDateDone] = useState<Dayjs | null>(dayjs());
  const [dateRead, setDateRead] = useState<Dayjs | null>(dayjs());
  const [chargesKey, setChargesKey] = useState(Math.random().toString());
  const [resultId, setResultId] = useState(
    Number.isFinite(searchResultId) && searchResultId > 0 ? searchResultId : 0,
  );
  const [chargeId, setChargeId] = useState(
    Number.isFinite(searchChargeId) && searchChargeId > 0 ? searchChargeId : 0,
  );
  const [chargeDescription, setChargeDescription] = useState('');
  const [activeCharge, setActiveCharge] = useState<any>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingVitalSigns, setIsSavingVitalSigns] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [editingKeywordId, setEditingKeywordId] = useState(0);
  const [isOnlineResultShown, setIsOnlineResultShown] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isSavingKeyword, setIsSavingKeyword] = useState(false);
  const [deletingKeywordId, setDeletingKeywordId] = useState(0);
  const [finalizedBy, setFinalizedBy] = useState('');
  const [dateFinalized, setDateFinalized] = useState('');
  const [requestingPhysician, setRequestingPhysician] = useState<
    number | undefined
  >();
  const [cardiologist, setCardiologist] = useState<number | undefined>();

  const appointmentDetails = useQuery({
    queryKey: ['cardiology-result-appointment', Id],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentDetails',
        parameters: {
          Id,
        },
      });

      return res?.parameters?.lst?.[0] as TAppointments | undefined;
    },
    refetchOnWindowFocus: false,
  });

  const appointmentVitalSigns = useQuery({
    queryKey: ['cardiology-result-vital-signs', Id],
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
    enabled: getPositiveNumber(Id) > 0,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const cardioKeywords = useQuery({
    queryKey: ['cardio-keywords', keywordSearch],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetCardioKeywords',
        parameters: {
          Search: keywordSearch,
        },
      });

      return Array.isArray(res?.parameters?.lst)
        ? (res.parameters.lst as CardioKeyword[])
        : [];
    },
    enabled: exam === 'ecg',
    refetchOnWindowFocus: false,
  });

  const twoDEchoResult = useQuery({
    queryKey: ['cardiology-2decho-result', resultId],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetCardiology2DEchoResult',
        parameters: {
          Id: resultId,
        },
      });

      return res?.parameters?.lst?.[0] as CardiologyResultRecord | undefined;
    },
    enabled: exam === '2decho' && resultId > 0,
    refetchOnWindowFocus: false,
  });

  const treadmillResult = useQuery({
    queryKey: ['cardiology-treadmill-result', resultId],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetCardiologyTreadmillResult',
        parameters: {
          Id: resultId,
        },
      });

      return res?.parameters?.lst?.[0] as CardiologyResultRecord | undefined;
    },
    enabled: exam === 'treadmill' && resultId > 0,
    refetchOnWindowFocus: false,
  });

  const ecgResult = useQuery({
    queryKey: ['cardiology-ecg-result', resultId],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetCardiologyECGResult',
        parameters: {
          Id: resultId,
        },
      });

      return res?.parameters?.lst?.[0] as CardiologyResultRecord | undefined;
    },
    enabled: exam === 'ecg' && resultId > 0,
    refetchOnWindowFocus: false,
  });

  const requestingPhysicians = useQuery({
    queryKey: ['cardiology-result-requesting-physicians'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });

      return Array.isArray(res?.parameters?.lst)
        ? (res.parameters.lst as TDoctors[])
        : [];
    },
    refetchOnWindowFocus: false,
  });

  const cardiologists = useQuery({
    queryKey: ['cardiology-result-cardiologists', store.branchCode],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetListOfCardiologist',
        parameters: {
          BranchCode: store.branchCode,
        },
      });

      return Array.isArray(res?.parameters?.lst)
        ? (res.parameters.lst as TDoctors[])
        : [];
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setResultId(
      Number.isFinite(searchResultId) && searchResultId > 0
        ? searchResultId
        : 0,
    );
    setChargeId(
      Number.isFinite(searchChargeId) && searchChargeId > 0
        ? searchChargeId
        : 0,
    );
  }, [searchChargeId, searchResultId]);

  const activeResultData =
    exam === '2decho'
      ? twoDEchoResult.data
      : exam === 'treadmill'
        ? treadmillResult.data
        : exam === 'ecg'
          ? ecgResult.data
          : undefined;

  const activeResultIsFetched =
    exam === '2decho'
      ? twoDEchoResult.isFetched
      : exam === 'treadmill'
        ? treadmillResult.isFetched
        : exam === 'ecg'
          ? ecgResult.isFetched
          : false;

  const refetchActiveResult = async () => {
    if (!exam || resultId === 0) {
      return;
    }

    if (exam === '2decho') {
      await twoDEchoResult.refetch();
      return;
    }

    if (exam === 'treadmill') {
      await treadmillResult.refetch();
      return;
    }

    if (exam === 'ecg') {
      await ecgResult.refetch();
    }
  };

  const refreshOnlineResultStatus = async (
    nextResultId = resultId,
    nextExam = exam,
  ) => {
    const id = getPositiveNumber(nextResultId);

    if (!nextExam || id <= 0) {
      setIsOnlineResultShown(false);
      return;
    }

    const res = await PostData('GetPdfFileStatus', {
      ResultId: id,
      ResultType: onlineResultTypes[nextExam],
    });

    setIsOnlineResultShown(Boolean(res?.parameters?.Shown));
  };

  const age = [
    appointmentDetails.data?.AgeYears
      ? `${appointmentDetails.data.AgeYears}Y`
      : '',
    appointmentDetails.data?.AgeMonths
      ? `${appointmentDetails.data.AgeMonths}M`
      : '',
    appointmentDetails.data?.AgeDays
      ? `${appointmentDetails.data.AgeDays}D`
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  const isResultSubmitBlocked = isResultBlockedStatus(activeCharge?.Status);
  const resultSubmitBlockedMessage = getResultBlockedMessage(activeCharge);

  const getNumberOrUndefined = (value: unknown) => {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) && numericValue > 0
      ? numericValue
      : undefined;
  };

  const getFormValue = (fieldName: string, value: unknown) => {
    if (value instanceof Date) {
      return dayjs(value).format('YYYY-MM-DD');
    }

    const textValue =
      value === null || value === undefined ? '' : String(value);

    return reportTextFields.has(fieldName)
      ? decodeReportLineBreaks(textValue) ?? ''
      : textValue;
  };

  const setNativeFormValues = (record: CardiologyResultRecord) => {
    window.requestAnimationFrame(() => {
      if (!formRef.current) {
        return;
      }

      Object.entries(record).forEach(([key, value]) => {
        const field = formRef.current?.elements.namedItem(key);

        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement
        ) {
          field.value = getFormValue(key, value);
        }
      });
    });
  };

  useEffect(() => {
    if (!exam) {
      setResultId(0);
      setChargeId(0);
      setChargeDescription('');
      setIsOnlineResultShown(false);
      setIsFinalized(false);
      setFinalizedBy('');
      setDateFinalized('');
      setEcgImpression('');
      return;
    }

    if (!activeResultIsFetched) {
      return;
    }

    const result = activeResultData;

    if (!result) {
      setResultId(0);
      setIsOnlineResultShown(false);
      setIsFinalized(false);
      setFinalizedBy('');
      setDateFinalized('');
      if (exam === 'ecg') {
        setEcgImpression('');
      }
      return;
    }

    const nextResultId = Number(result.Id ?? 0);
    setResultId(nextResultId);
    setChargeId(Number(result.ChargeId ?? result.fk_Charges_Id ?? 0));
    setChargeDescription(String(result.ChargeDescription ?? ''));
    setDateOfExamination(
      result.DateOfExamination ? dayjs(result.DateOfExamination) : dayjs(),
    );
    setDateDone(result.DateDone ? dayjs(result.DateDone) : dayjs());
    setDateRead(result.DateRead ? dayjs(result.DateRead) : dayjs());
    setRequestingPhysician(getNumberOrUndefined(result.RequestingPhysician));
    setCardiologist(getNumberOrUndefined(result.Cardiologist));
    setEcgImpression(
      exam === 'ecg' ? getFormValue('Impression', result.Impression) : '',
    );
    setFinalizedBy(String(result.FinalizedBy ?? ''));
    setDateFinalized(
      String(result.DateFinalized ?? result.FinalizedDate ?? ''),
    );
    setIsFinalized(String(result.FinalizedBy ?? '').trim() !== '');
    void refreshOnlineResultStatus(nextResultId, exam);
    setNativeFormValues(result);
  }, [activeResultData, activeResultIsFetched, exam]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isResultSubmitBlocked) {
      notification.warning({
        message: resultSubmitBlockedMessage,
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (!exam || (chargeId === 0 && resultId === 0)) {
      notification.info({
        message: 'Please click the charges result first.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (!dateOfExamination?.isValid()) {
      notification.error({
        message: 'Date of examination is required.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (!dateDone?.isValid()) {
      notification.error({
        message: 'Date done is required.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (!dateRead?.isValid()) {
      notification.error({
        message: 'Date read is required.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    // if (getPositiveNumber(requestingPhysician) === 0) {
    //   notification.error({
    //     message: 'Requesting physician is required.',
    //     placement: 'topRight',
    //     duration: 3,
    //   });
    //   return;
    // }

    if (getPositiveNumber(cardiologist) === 0) {
      notification.error({
        message: 'Cardiologist is required.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const data: Record<string, FormDataEntryValue> = {};

    formData.forEach((value, key) => {
      if (key !== 'exam') {
        data[key] =
          typeof value === 'string' && reportTextFields.has(key)
            ? encodeReportLineBreaks(value) ?? ''
            : value;
      }
    });

    setIsSaving(true);

    try {
      const res = await PostData(saveResultEndpoints[exam], {
        ...data,
        Id: resultId,
        AdmissionId: Number(Id),
        ChargeId: chargeId,
        ChargeDescription: chargeDescription,
        DateOfExamination: dateOfExamination
          ? dateOfExamination.format('YYYY-MM-DD')
          : data.DateOfExamination,
        DateDone: dateDone ? dateDone.format('YYYY-MM-DD') : data.DateDone,
        DateRead: dateRead ? dateRead.format('YYYY-MM-DD') : data.DateRead,
        RequestingPhysician: requestingPhysician ?? 0,
        Cardiologist: cardiologist ?? 0,
      });

      if (res?.status === 1) {
        const savedId = Number(res.message ?? res.parameters?.Id);

        if (Number.isFinite(savedId) && savedId > 0) {
          setResultId(savedId);
          await refreshOnlineResultStatus(savedId, exam);
        }

        notification.success({
          message: `${examLabels[exam]} result successfully saved!`,
          placement: 'topRight',
          duration: 3,
        });

        await refetchActiveResult();
        setChargesKey(Math.random().toString());
      } else {
        notification.error({
          message: res?.message ?? `Unable to save ${examLabels[exam]} result.`,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchResultPdf = async () => {
    if (!exam || resultId === 0) {
      throw new Error('Please click the charges result first.');
    }

    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const response = await axios({
      url: apiUrl + '/api/GenerateReport',
      method: 'GET',
      responseType: 'blob',
      params: {
        ReportName: printReportNames[exam],
        AppointmentId: resultId,
        BranchCode: store.branchCode,
      },
    });

    return new Blob([response.data], {
      type: 'application/pdf',
    });
  };

  const handleOnlineResult = async (values: any) => {
    if (!exam || resultId === 0) {
      notification.info({
        message: 'Please click the charges result first.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setShowFinalize(false);
    setIsFinalizing(true);

    try {
      let res;

      if (isOnlineResultShown) {
        res = await PostData('UnshowPdfFile', {
          ResultId: resultId,
          ResultType: onlineResultTypes[exam],
          Username: values.Username,
          Password: values.Password,
        });
      } else {
        const pdf = await blobToDataUrl(await fetchResultPdf());

        res = await PostData('UploadPdfFile', {
          ResultId: resultId,
          ResultType: onlineResultTypes[exam],
          fk_Appointments_Id: Number(Id),
          fk_Departments_Id: onlineResultDepartmentId,
          Description: onlineResultDescriptions[exam],
          ShowInCompanyPortal: 'Y',
          Pdf: pdf,
          Username: values.Username,
          Password: values.Password,
        });
      }

      if (res?.status === 1) {
        notification.success({
          message: isOnlineResultShown
            ? 'Result hidden from online results.'
            : 'Result shown to online results.',
          placement: 'topRight',
          duration: 3,
        });

        await refreshOnlineResultStatus(resultId, exam);
        setChargesKey(Math.random().toString());
      } else {
        notification.error({
          message:
            res?.message ??
            `Unable to update online result for ${examLabels[exam]}.`,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const handlePrint = async () => {
    if (!exam || resultId === 0) {
      notification.info({
        message: 'Please click the charges result first.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    try {
      setIsPrinting(true);

      const pdfBlob = await fetchResultPdf();
      const data = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');

      a.setAttribute('href', data);
      a.setAttribute('target', '_blank');
      a.click();
    } catch (error: any) {
      let message = `Unable to print ${examLabels[exam]} result.`;

      if (error.response?.data?.text) {
        try {
          const errorString = JSON.parse(await error.response.data.text());
          message = errorString.Message ?? message;
        } catch {
          message = error.message ?? message;
        }
      } else {
        message = error.message ?? message;
      }

      notification.error({
        message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const navigateToCardiologyResult = ({
    appointmentId,
    selectedExam,
    selectedChargeId,
    selectedResultId,
  }: {
    appointmentId: number;
    selectedExam: Exam;
    selectedChargeId: number;
    selectedResultId: number;
  }) => {
    router.navigate({
      to: '/cardiologyresult/$Id',
      params: {
        Id: appointmentId.toString(),
      },
      search: {
        exam: selectedExam,
        chargeId: selectedChargeId,
        resultId: selectedResultId,
        standalone: search.standalone,
      },
    });
  };

  const buildCardiologyResultUrl = ({
    appointmentId,
    selectedExam,
    selectedChargeId,
    selectedResultId,
  }: {
    appointmentId: number;
    selectedExam: Exam;
    selectedChargeId: number;
    selectedResultId: number;
  }) => {
    const basePath =
      import.meta.env.BASE_URL === '/'
        ? ''
        : import.meta.env.BASE_URL.replace(/\/$/, '');
    const searchParams = new URLSearchParams({
      exam: selectedExam,
      chargeId: selectedChargeId.toString(),
      resultId: selectedResultId.toString(),
    });

    return `${basePath}/cardiologyresult/${appointmentId}?${searchParams.toString()}`;
  };

  const resetResultForm = () => {
    formRef.current?.reset();
    setDateOfExamination(dayjs());
    setDateDone(dayjs());
    setDateRead(dayjs());
    setRequestingPhysician(undefined);
    setCardiologist(undefined);
    setEcgKeyword('');
    setEcgImpression('');
    setIsOnlineResultShown(false);
    setIsFinalized(false);
    setFinalizedBy('');
    setDateFinalized('');
  };

  const handleDeleteResult = async () => {
    if (!exam || resultId === 0) {
      notification.info({
        message: 'Please click the charges result first.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    const deletedResultId = resultId;
    const selectedChargeId = chargeId;
    setIsDeleting(true);

    try {
      const res = await PostData('DeleteCardiologyResult', {
        Id: deletedResultId,
        ChargeId: selectedChargeId,
        ResultType: onlineResultTypes[exam],
      });

      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? 'Unable to delete cardiology result.',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      resetResultForm();
      setResultId(0);
      setChargesKey(Math.random().toString());

      const activeResultQueryKey =
        exam === '2decho'
          ? 'cardiology-2decho-result'
          : exam === 'treadmill'
            ? 'cardiology-treadmill-result'
            : 'cardiology-ecg-result';

      queryClient.removeQueries({
        queryKey: [activeResultQueryKey, deletedResultId],
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: ['udp_GetCardiologyResultsByPatientId'],
      });

      navigateToCardiologyResult({
        appointmentId: getPositiveNumber(Id),
        selectedExam: exam,
        selectedChargeId,
        selectedResultId: 0,
      });

      notification.success({
        message: 'Cardiology result successfully deleted!',
        placement: 'topRight',
        duration: 3,
      });
    } catch (error) {
      notification.error({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete cardiology result.',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getChargeDetails = async (
    appointmentId: number,
    selectedChargeId: number,
  ) => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetChargesByAppointmentIdForResult',
      parameters: {
        AppointmentId: appointmentId,
      },
    });
    const charges = Array.isArray(res?.parameters?.lst)
      ? res.parameters.lst
      : [];

    return charges.find(
      (charge: any) => getPositiveNumber(charge.Id) === selectedChargeId,
    );
  };

  const handleOpenExistingResult = async (
    data: ExistingCardiologyResultRecord,
  ) => {
    const resultWindow = window.open('', '_blank');

    if (resultWindow) {
      resultWindow.opener = null;
      resultWindow.document.title = 'Opening cardiology result...';
      resultWindow.document.body.innerHTML =
        '<p style="font-family: sans-serif;">Opening cardiology result...</p>';
    }

    const selectedResultId = getPositiveNumber(data.ResultId ?? data.Id);
    const selectedChargeId = getPositiveNumber(
      data.ChargeId ?? data.fk_Charges_Id,
    );
    const appointmentId = getPositiveNumber(
      data.AdmissionId ?? data.fk_Appointments_Id ?? Id,
    );

    if (!appointmentId || !selectedChargeId || !selectedResultId) {
      resultWindow?.close();
      notification.info({
        message: 'Unable to open selected cardiology result.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    try {
      let itemId = getPositiveNumber(data.fk_Items_Id ?? data.ItemId);

      if (!itemId) {
        const charge = await getChargeDetails(appointmentId, selectedChargeId);

        itemId =
          itemId || getPositiveNumber(charge?.fk_Items_Id ?? charge?.ItemId);
      }

      const selectedExam = getExamByItemId(itemId);

      if (!selectedExam) {
        resultWindow?.close();
        notification.error({
          message: 'Unable to identify the cardiology result type.',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      const url = buildCardiologyResultUrl({
        appointmentId,
        selectedExam,
        selectedChargeId,
        selectedResultId,
      });

      if (resultWindow) {
        resultWindow.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error: any) {
      resultWindow?.close();
      notification.error({
        message: error.message ?? 'Unable to open selected cardiology result.',
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const handleNewResult = (data: any) => {
    setActiveCharge(data);

    const selectedExam = getExamByItemId(data.fk_Items_Id ?? data.ItemId);
    const appointmentId = getPositiveNumber(data.fk_Appointments_Id);
    const selectedChargeId = getPositiveNumber(data.Id);
    const selectedResultId = getPositiveNumber(data.ResultId);

    if (!appointmentId || !selectedChargeId || !selectedExam) {
      notification.info({
        message: 'Unable to open selected cardiology charge.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setChargeId(selectedChargeId);
    setChargeDescription(data.Description ?? '');

    if (selectedResultId > 0) {
      setResultId(selectedResultId);
    } else {
      resetResultForm();
      setResultId(0);
    }

    navigateToCardiologyResult({
      appointmentId,
      selectedExam,
      selectedChargeId,
      selectedResultId,
    });
  };

  const getVitalSignsParameterValue = (value: unknown) =>
    value === null || value === undefined ? '' : String(value);

  const handleSaveVitalSigns = async (values: TAppointmentVitalSigns) => {
    const appointmentId = getPositiveNumber(Id);

    if (appointmentId === 0) {
      notification.error({
        message: 'Unable to identify the appointment.',
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
          AppointmentId: appointmentId,
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

  const appendEcgKeyword = (keyword: string) => {
    const cleanKeyword = keyword.trim();

    if (!cleanKeyword) {
      return;
    }

    setEcgImpression((current) =>
      current ? `${current}\n${cleanKeyword}` : cleanKeyword,
    );
    setEcgKeyword('');
  };

  const handleOpenKeywordModal = () => {
    setShowKeywordModal(true);
    setKeywordSearch('');
    setEditingKeywordId(0);
    keywordForm.resetFields();
    void cardioKeywords.refetch();
  };

  const handleNewKeyword = () => {
    setEditingKeywordId(0);
    keywordForm.resetFields();
  };

  const handleEditKeyword = (keyword: CardioKeyword) => {
    setEditingKeywordId(keyword.Id);
    keywordForm.setFieldsValue({
      Legend: keyword.Legend ?? '',
      Description: keyword.Description ?? '',
    });
  };

  const handleSaveKeyword = async (values: CardioKeywordFormValues) => {
    const legend = values.Legend?.trim() ?? '';
    const description = values.Description?.trim() ?? '';

    if (!legend && !description) {
      notification.error({
        message: 'Please enter a legend or description.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setIsSavingKeyword(true);

    try {
      const res = await PostData('SaveCardioKeyword', {
        Id: editingKeywordId,
        Legend: legend,
        Description: description,
      });

      if (res?.status === 1) {
        notification.success({
          message: 'Keyword successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
        handleNewKeyword();
        await cardioKeywords.refetch();
      } else {
        notification.error({
          message: res?.message ?? 'Unable to save keyword.',
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save keyword.';

      notification.error({
        message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsSavingKeyword(false);
    }
  };

  const handleDeleteKeyword = async (keyword: CardioKeyword) => {
    setDeletingKeywordId(keyword.Id);

    try {
      const res = await PostData('DeleteCardioKeyword', {
        Id: keyword.Id,
      });

      if (res?.status === 1) {
        notification.success({
          message: 'Keyword successfully deleted!',
          placement: 'topRight',
          duration: 3,
        });

        if (editingKeywordId === keyword.Id) {
          handleNewKeyword();
        }

        await cardioKeywords.refetch();
      } else {
        notification.error({
          message: res?.message ?? 'Unable to delete keyword.',
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete keyword.';

      notification.error({
        message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setDeletingKeywordId(0);
    }
  };

  return (
    <div className="cardBackGround">
      {/* <div className="mb-3 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            Cardiology Result
          </h1>
          <p className="text-sm text-slate-500">{examLabels[exam]}</p>
        </div>
        <Space>
          <Button icon={<MdRestartAlt />} onClick={handleClear}>
            Clear
          </Button>
          <Button
            type="primary"
            icon={<MdOutlinePrint />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Space>
      </div> */}

      <PatientInfoHeader
        appointmentId={appointmentDetails.data?.Id}
        patientId={appointmentDetails.data?.fk_PatientInformation_Id}
        name={appointmentDetails.data?.Name}
        age={age}
        sex={appointmentDetails.data?.Sex}
        appointmentNo={appointmentDetails.data?.AppointmentNo}
      />

      <div className="my-3 print:hidden">
        <div className="mb-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase text-slate-500">
            Vital Signs
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="border border-slate-200 bg-slate-50 px-3 py-3">
          <Form
            form={vitalSignsForm}
            layout="vertical"
            onFinish={handleSaveVitalSigns}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_120px]">
              <Form.Item label="Height (cm)" name="HeightCm" className="!mb-0">
                <InputNumber
                  className="w-full"
                  min={0}
                  precision={2}
                  size="small"
                />
              </Form.Item>

              <Form.Item label="Weight (kg)" name="WeightKg" className="!mb-0">
                <InputNumber
                  className="w-full"
                  min={0}
                  precision={2}
                  size="small"
                />
              </Form.Item>

              <Form.Item label="BSA" name="Bsa" className="!mb-0">
                <InputNumber
                  className="w-full"
                  min={0}
                  precision={2}
                  size="small"
                />
              </Form.Item>

              <Form.Item label="BP" name="Bp" className="!mb-0">
                <Input maxLength={50} size="small" />
              </Form.Item>

              <Form.Item label="HR" name="Hr" className="!mb-0">
                <Input maxLength={50} size="small" />
              </Form.Item>

              <div className="flex items-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSavingVitalSigns}
                  disabled={appointmentVitalSigns.isFetching}
                  className="w-full"
                  size="small"
                >
                  Update
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>

      <div className="hidden border-b border-slate-200 pb-3 print:block">
        <div className="grid grid-cols-5 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Height (cm)</p>
            <p className="font-semibold text-slate-900">
              {appointmentVitalSigns.data?.HeightCm ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Weight (kg)</p>
            <p className="font-semibold text-slate-900">
              {appointmentVitalSigns.data?.WeightKg ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-500">BSA</p>
            <p className="font-semibold text-slate-900">
              {appointmentVitalSigns.data?.Bsa ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-500">BP</p>
            <p className="font-semibold text-slate-900">
              {appointmentVitalSigns.data?.Bp ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-500">HR</p>
            <p className="font-semibold text-slate-900">
              {appointmentVitalSigns.data?.Hr ?? '-'}
            </p>
          </div>
        </div>
      </div>

      {/* <div className="mb-3 print:hidden">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={exam}
          onChange={(event) => handleChangeExam(event.target.value as Exam)}
        >
          <Radio.Button value="2decho">2D Echo</Radio.Button>
          <Radio.Button value="treadmill">Treadmill</Radio.Button>
          <Radio.Button value="ecg">ECG</Radio.Button>
        </Radio.Group>
      </div> */}

      <Divider className="print:hidden">
        Cardiology Department Result{exam ? ` (${examLabels[exam]})` : ''}
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
                patientId={appointmentDetails.data?.fk_PatientInformation_Id}
                appointmentId={appointmentDetails.data?.Id}
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
                      AppointmentId={appointmentDetails.data?.Id}
                      handleNewResult={handleNewResult}
                      Key={chargesKey}
                      Counter={['CARDIO']}
                      activeChargeId={chargeId}
                      onActiveChargeChange={setActiveCharge}
                    />
                  ),
                },
                {
                  label: 'Existing Results',
                  key: '2',
                  children: (
                    <ExistingCadioResults
                      PatientId={
                        appointmentDetails.data?.fk_PatientInformation_Id
                      }
                      AppointmentId={appointmentDetails.data?.Id}
                      handleOpen={handleOpenExistingResult}
                      reloadKey={chargesKey}
                      activeChargeId={chargeId}
                    />
                  ),
                },
              ]}
            />
          </div>
        </aside>
        <main className="min-w-0 lg:col-span-9">
          {!exam ? (
            <div className="flex min-h-[320px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
              <div>
                <p className="text-base font-semibold text-slate-700">
                  Please click the charges result first.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Select a cardiology charge on the left to load the result
                  form.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* {chargeDescription && (
                <div className="mb-3 text-center font-semibold text-slate-700">
                  Cardiology Result for - {chargeDescription}
                </div>
              )} */}
              <form ref={formRef} onSubmit={handleSubmit}>
                <input name="exam" type="hidden" value={exam} />
                <ExamDetailsFields
                  cardiologist={cardiologist}
                  cardiologists={cardiologists.data ?? []}
                  dateDone={dateDone}
                  dateOfExamination={dateOfExamination}
                  dateRead={dateRead}
                  requestingPhysician={requestingPhysician}
                  requestingPhysicians={requestingPhysicians.data ?? []}
                  onCardiologistChange={setCardiologist}
                  onDateDoneChange={setDateDone}
                  onDateOfExaminationChange={setDateOfExamination}
                  onDateReadChange={setDateRead}
                  onRequestingPhysicianChange={setRequestingPhysician}
                />
                {exam === '2decho' && <TwoDEchoFields />}
                {exam === 'treadmill' && <TreadmillFields />}
                {exam === 'ecg' && (
                  <EcgFields
                    keywords={cardioKeywords.data ?? []}
                    keywordValue={ecgKeyword}
                    impression={ecgImpression}
                    onKeywordChange={setEcgKeyword}
                    onKeywordAppend={appendEcgKeyword}
                    onImpressionChange={setEcgImpression}
                    onManageKeywords={handleOpenKeywordModal}
                  />
                )}

                {isFinalized && (
                  <div className="mt-3 grid grid-cols-1 gap-3 rounded border border-slate-200 bg-slate-50 p-3 print:hidden md:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Finalized By
                      <input
                        className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-normal text-slate-900"
                        readOnly
                        value={finalizedBy}
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Date Finalized
                      <input
                        className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-normal text-slate-900"
                        readOnly
                        value={dateFinalized}
                      />
                    </label>
                  </div>
                )}

                <div className="mt-3 flex w-full justify-end gap-2 print:hidden">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSaving}
                    disabled={
                      isFinalized ||
                      isOnlineResultShown ||
                      isFinalizing ||
                      isDeleting ||
                      isResultSubmitBlocked
                    }
                  >
                    Submit
                  </Button>
                  <Button
                    type="primary"
                    htmlType="button"
                    loading={isFinalizing}
                    disabled={resultId === 0 || isSaving || isDeleting}
                    onClick={() => setShowFinalize(true)}
                  >
                    {isOnlineResultShown
                      ? 'Unshow Online Result'
                      : 'Show to Online Results'}
                  </Button>
                  <Button
                    type="primary"
                    htmlType="button"
                    loading={isPrinting}
                    disabled={
                      resultId === 0 || isSaving || isFinalizing || isDeleting
                    }
                    onClick={handlePrint}
                  >
                    Print
                  </Button>
                  <Popconfirm
                    title={`Delete this ${examLabels[exam]} result?`}
                    description="The saved result and its online PDF will be removed."
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleDeleteResult}
                  >
                    <Button
                      danger
                      type="primary"
                      htmlType="button"
                      loading={isDeleting}
                      disabled={
                        resultId === 0 ||
                        isFinalized ||
                        isSaving ||
                        isFinalizing ||
                        isPrinting
                      }
                    >
                      Delete Result
                    </Button>
                  </Popconfirm>
                </div>
              </form>
            </>
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
          title={
            isOnlineResultShown
              ? 'Unshow Online Result'
              : 'Show to Online Results'
          }
          submitText={isOnlineResultShown ? 'Unshow' : 'Show'}
        />
      </Modal>
      <Modal
        open={showKeywordModal}
        destroyOnClose
        footer={null}
        title="Cardio Keywords"
        width={900}
        onCancel={() => {
          setShowKeywordModal(false);
          setKeywordSearch('');
          handleNewKeyword();
        }}
      >
        <Form form={keywordForm} layout="vertical" onFinish={handleSaveKeyword}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item name="Legend" label="Legend">
              <Input allowClear />
            </Form.Item>
            <Form.Item name="Description" label="Description">
              <Input.TextArea
                allowClear
                autoSize={{ minRows: 1, maxRows: 4 }}
              />
            </Form.Item>
          </div>
          <div className="flex justify-end gap-2">
            <Button htmlType="button" onClick={handleNewKeyword}>
              New
            </Button>
            <Button type="primary" htmlType="submit" loading={isSavingKeyword}>
              {editingKeywordId > 0 ? 'Update' : 'Save'}
            </Button>
          </div>
        </Form>
        <Divider />
        <Input.Search
          allowClear
          className="mb-3"
          placeholder="Search legend or description"
          enterButton="Search"
          onSearch={(value) => setKeywordSearch(value.trim())}
          onChange={(event) => {
            if (!event.target.value) {
              setKeywordSearch('');
            }
          }}
        />
        <Table<CardioKeyword>
          rowKey="Id"
          dataSource={cardioKeywords.data ?? []}
          loading={cardioKeywords.isFetching}
          size="small"
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: 'Legend',
              dataIndex: 'Legend',
              key: 'Legend',
            },
            {
              title: 'Description',
              dataIndex: 'Description',
              key: 'Description',
            },
            {
              title: 'Action',
              key: 'action',
              width: 150,
              render: (_, keyword) => (
                <Space>
                  <Button
                    htmlType="button"
                    size="small"
                    onClick={() => handleEditKeyword(keyword)}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete keyword?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => handleDeleteKeyword(keyword)}
                  >
                    <Button
                      danger
                      htmlType="button"
                      size="small"
                      loading={deletingKeywordId === keyword.Id}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};
