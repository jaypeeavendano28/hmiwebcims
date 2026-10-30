import dayjs from 'dayjs';
import { TAppointments } from '../../types';
import {
  getLocalPsychologyNarrative,
  getLocalRecommendedConclusion,
  localIntellectualLevels,
  localScoreGroups,
  LocalPsychologyScores,
  PsychologyResult,
  recommendationTypes,
} from './psychologyForm';
import './psychologyPrint.css';

type Props = {
  patient?: TAppointments;
  purpose: string;
  result?: PsychologyResult;
  scores: LocalPsychologyScores;
};

const ScoreGroup = ({ group, scores }: {
  group: typeof localScoreGroups[number];
  scores: LocalPsychologyScores;
}) => (
  <div className="psychology-local-score-group">
    <div className="psychology-local-score-group-title">{group.title}</div>
    <div className="psychology-local-score-rows">
      {group.scores.map((score) => (
        <div className="psychology-local-score-row" key={score.code}>
          <strong>{score.label}</strong>
          <div className="psychology-local-score-track">
            {scores[score.code] !== undefined && (
              <div className="psychology-local-score-bar" style={{ width: `${scores[score.code]}%` }} />
            )}
          </div>
          <div className="psychology-local-score-axis">
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => <span key={tick}>{tick}</span>)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function PsychologyLocalPrintReport({ patient, purpose, result, scores }: Props) {
  if (!result) return null;

  const recommendationLabel = recommendationTypes.find(
    (option) => option.value === result.RecommendationType,
  )?.label ?? 'RECOMMENDED';
  const recommendedConclusionText = getLocalRecommendedConclusion(scores.denial);
  const level = localIntellectualLevels.find((option) => option.value === result.IntellectualLevel)?.label ?? '—';
  const reportHeader = (
    <header className="psychology-local-header">
      <div className="psychology-local-brand">HMICare, Inc.</div>
      <div>
        <h1>Psychological Test Report</h1>
        <div>Psychology Department</div>
        <small>9179 Gen. Emilio Aguinaldo Hi-way, Sampaloc I (Pala-pala)<br />Dasmariñas City, Cavite</small>
      </div>
    </header>
  );

  return (
    <div id="psychology-print-report" className="psychology-local-print">
      <section className="psychology-print-page">
        {reportHeader}
        <div className="psychology-local-details">
          <div><strong>Name:</strong> {patient?.Name || '—'}</div>
          <div><strong>Age:</strong> {patient?.AgeYears || '—'}</div>
          <div><strong>Purpose of Psychological Screening:</strong> {purpose}</div>
          <div><strong>Gender:</strong> {patient?.Sex === 'M' ? 'Male' : patient?.Sex === 'F' ? 'Female' : patient?.Sex || '—'}</div>
          <div><strong>Date of Examination:</strong> {dayjs(result.DateOfExamination).format('MM/DD/YYYY')}</div>
          <div><strong>Date of Interpretation:</strong> {result.DateOfInterpretation ? dayjs(result.DateOfInterpretation).format('MM/DD/YYYY') : '—'}</div>
        </div>
        <h2>A. Intelligence Test (RSPM)</h2>
        <p className="psychology-local-level">Intellectual Level: {level}</p>
        <h2>B. Personality Test (BPI)</h2>
        <div className="psychology-local-first-page-body">
          <div>{localScoreGroups.slice(0, 3).map((group) => <ScoreGroup key={group.title} group={group} scores={scores} />)}</div>
          <p className="psychology-print-paragraph">{getLocalPsychologyNarrative(result.IntellectualLevel)}</p>
        </div>
        <div className="psychology-local-confidential">CONFIDENTIAL</div>
      </section>

      <section className="psychology-print-page">
        {reportHeader}
        <div className="psychology-local-second-page-scores">
          {localScoreGroups.slice(3).map((group) => <ScoreGroup key={group.title} group={group} scores={scores} />)}
        </div>
        <div className="psychology-local-legend">
          <strong>Legend:</strong>
          <span>10–40 Very Low</span><span>41–50 Low</span><span>51–60 Average</span>
          <span>61–70 High</span><span>71 and above Very High</span>
        </div>
        <h2>C. Conclusion / Remarks</h2>
        <div className="psychology-print-decision-box">
          <strong>({result.Recommendation === 'RECOMMENDED' ? '✓' : ' '}) {recommendationLabel}</strong>
          {result.Recommendation === 'RECOMMENDED' && (
            <>
              {recommendedConclusionText && <p>{recommendedConclusionText}</p>}
              {result.RecommendationDetails && <p>{result.RecommendationDetails}</p>}
            </>
          )}
        </div>
        <div className="psychology-print-decision-box">
          <strong>({result.Recommendation === 'FURTHER_EVALUATION' ? '✓' : ' '}) FOR FURTHER EVALUATION</strong>
          {result.Recommendation === 'FURTHER_EVALUATION' && <p>{result.FurtherEvaluationDetails || '—'}</p>}
        </div>
        <div className="psychology-print-signatures">
          <div className="psychology-print-signature">
            <strong>{result.PreparedByName || '—'}</strong>
            <span>Prepared by · {result.PreparedByTitle || 'Psychometrician'}</span>
            {result.PreparedByLicenseNo && <span>PRC License No. {result.PreparedByLicenseNo}</span>}
          </div>
          <div className="psychology-print-signature">
            <strong>{result.PsychologistName || '—'}</strong>
            <span>Attested by · Psychologist</span>
          </div>
        </div>
        <div className="psychology-local-confidential">CONFIDENTIAL</div>
      </section>
    </div>
  );
}
