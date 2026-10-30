import dayjs from 'dayjs';
import { TAppointments } from '../../types';
import {
  getPsychologyNarrative,
  intellectualLevels,
  psychologyTraitGroups,
  PsychologyRatings,
  recommendationTypes,
} from './psychologyForm';
import './psychologyPrint.css';

type Props = {
  patient?: TAppointments;
  positionAppliedFor?: string;
  referredBy?: string;
  values?: {
    DateOfExamination?: string;
    IntelligenceTest?: string;
    PersonalityTest?: string;
    OtherTests?: string;
    IntellectualLevel?: string;
    Recommendation?: string;
    RecommendationType?: string;
    RecommendationDetails?: string;
    FurtherEvaluationDetails?: string;
  };
  ratings: PsychologyRatings;
  psychologistName?: string;
  preparedByName?: string;
  preparedByTitle?: string;
  preparedByLicenseNo?: string;
};

const RatingsTable = ({
  title,
  traits,
  ratings,
}: {
  title: string;
  traits: readonly { code: string; label: string }[];
  ratings: PsychologyRatings;
}) => (
  <table className="psychology-ratings-table">
    <thead>
      <tr>
        <th>{title}</th>
        {[1, 2, 3, 4, 5, 6, 7].map((rating) => (
          <th key={rating}>{rating}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {traits.map((trait) => (
        <tr key={trait.code}>
          <td>{trait.label}</td>
          {[1, 2, 3, 4, 5, 6, 7].map((rating) => (
            <td key={rating}>{ratings[trait.code] === rating ? '✓' : ''}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const PsychologyPrintReport = ({
  patient,
  positionAppliedFor,
  referredBy,
  values,
  ratings,
  psychologistName,
  preparedByName,
  preparedByTitle,
  preparedByLicenseNo,
}: Props) => {
  if (!values) return null;

  const age = patient?.AgeYears ? `${patient.AgeYears} years` : '—';
  const recommendationLabel = recommendationTypes.find(
    (option) => option.value === values.RecommendationType,
  )?.label ?? 'RECOMMENDED';

  return (
    <div id="psychology-print-report">
      <section className="psychology-print-page">
        <header className="psychology-print-header">
          <div>HMICare Inc.</div>
          <h1>Tabulated Psychological Evaluation Form</h1>
        </header>

        <div className="psychology-print-details">
          <div><strong>Name:</strong> {patient?.Name || '—'}</div>
          <div><strong>Age:</strong> {age}</div>
          <div><strong>Sex:</strong> {patient?.Sex || '—'}</div>
          <div><strong>Position Applied for:</strong> {positionAppliedFor || '—'}</div>
          <div><strong>Referred by:</strong> {referredBy || '—'}</div>
          <div><strong>Date of Examination:</strong> {values.DateOfExamination ? dayjs(values.DateOfExamination).format('MMMM D, YYYY') : '—'}</div>
        </div>

        <h2>Test Administered</h2>
        <div className="psychology-print-tests">
          <div><strong>Intelligence Test (IQ):</strong> {values.IntelligenceTest || '—'}</div>
          <div><strong>Personality Test:</strong> {values.PersonalityTest || '—'}</div>
          <div><strong>Others:</strong> {values.OtherTests || '—'}</div>
        </div>

        <h2>I. Intellectual Level</h2>
        <div className="psychology-levels">
          {intellectualLevels.map((level) => (
            <div key={level.value}>
              ({values.IntellectualLevel === level.value ? '✓' : ' '}) {level.label}
            </div>
          ))}
        </div>

        <h2>II. Personality Traits and Characteristics</h2>
        {psychologyTraitGroups.slice(0, 3).map((group) => (
          <RatingsTable key={group.title} {...group} ratings={ratings} />
        ))}
      </section>

      <section className="psychology-print-page">
        {psychologyTraitGroups.slice(3).map((group) => (
          <RatingsTable key={group.title} {...group} ratings={ratings} />
        ))}

        <h2>Narrative Report</h2>
        <p className="psychology-print-paragraph">{getPsychologyNarrative(values.IntellectualLevel)}</p>
        <h2>III. Conclusion / Remarks</h2>
        <div className="psychology-print-decision-box">
          <strong>({values.Recommendation === 'RECOMMENDED' ? '✓' : ' '}) {recommendationLabel}</strong>
          {values.Recommendation === 'RECOMMENDED' && values.RecommendationDetails && (
            <p>{values.RecommendationDetails}</p>
          )}
        </div>
        <div className="psychology-print-decision-box">
          <strong>({values.Recommendation === 'FURTHER_EVALUATION' ? '✓' : ' '}) FOR FURTHER EVALUATION</strong>
          {values.Recommendation === 'FURTHER_EVALUATION' && (
            <p>{values.FurtherEvaluationDetails || '—'}</p>
          )}
        </div>
        <div className="psychology-print-legend">
          <strong>Legend:</strong> 1 – Very Low · 2 – Low · 3 – Low Average · 4 – Average ·
          5 – High Average · 6 – High · 7 – Very High
        </div>
        <div className="psychology-print-signatures">
          <div className="psychology-print-signature">
            <strong>{preparedByName || '—'}</strong>
            <span>Prepared by · {preparedByTitle || 'Psychometrician'}</span>
            {preparedByLicenseNo && <span>PRC License No. {preparedByLicenseNo}</span>}
          </div>
          <div className="psychology-print-signature">
            <strong>{psychologistName || '—'}</strong>
            <span>Psychologist</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PsychologyPrintReport;
