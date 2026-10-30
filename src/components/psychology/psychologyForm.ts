export const psychologyDepartmentId = 1034;
export type PsychologyFormType = 'LOCAL' | 'OFW';

export const localIntellectualLevels = [
  { value: 'BELOW_AVERAGE', label: 'Below Average' },
  { value: 'AVERAGE', label: 'Average' },
  { value: 'ABOVE_AVERAGE', label: 'Above Average' },
  { value: 'SUPERIOR', label: 'Superior' },
  { value: 'VERY_SUPERIOR', label: 'Very Superior' },
] as const;

export const localScoreGroups = [
  {
    title: 'Socialization & Impulse',
    scores: [
      { code: 'interpersonal_problems', label: 'Interpersonal Problems' },
      { code: 'alienation', label: 'Alienation' },
      { code: 'impulse_expression', label: 'Impulse Expression' },
    ],
  },
  {
    title: 'Mood & Emotional Adjustment',
    scores: [
      { code: 'depression', label: 'Depression' },
      { code: 'anxiety', label: 'Anxiety' },
      { code: 'hypochondriasis', label: 'Hypochondriasis' },
    ],
  },
  {
    title: 'Cognitive',
    scores: [
      { code: 'persecutory_ideas', label: 'Persecutory Ideas' },
      { code: 'thinking_disorder', label: 'Thinking Disorder' },
    ],
  },
  {
    title: 'Self Perception',
    scores: [
      { code: 'self_depreciation', label: 'Self Depreciation' },
      { code: 'social_introversion', label: 'Social Introversion' },
    ],
  },
  {
    title: 'Critical Deviant Behavior',
    scores: [
      { code: 'denial', label: 'Denial' },
      { code: 'deviant', label: 'Deviant' },
    ],
  },
] as const;

export type LocalPsychologyScores = Record<string, number>;

export const getLocalPsychologyNarrative = (intellectualLevel?: string): string => {
  const level = localIntellectualLevels
    .find((option) => option.value === intellectualLevel)
    ?.label.toLowerCase() ?? '_____';
  return `The client garnered ${level} score in intellectual capacity with no cognitive deficits seen during the time of test administration. Based on personality test, generally, the client has the patience to cope with lengthy and tedious tasks assigned to them. Confidence, cheerfulness, persistence and optimism are few of their key characteristics that make up who they are today. Moreover, the client has a strong sense of obligation towards society and its laws.`;
};

export const getScreeningPurposeLabel = (purpose?: string, other?: string): string => {
  switch (purpose) {
    case 'EMPLOYMENT': return 'For Employment';
    case 'INTERNSHIP': return 'For Internship';
    case 'PERSONAL_USE': return 'For Personal Use';
    case 'OTHER': return other?.trim() || 'Other';
    default: return '—';
  }
};

export const intellectualLevels = [
  { value: 'VERY_SUPERIOR', label: 'Very Superior' },
  { value: 'SUPERIOR', label: 'Superior' },
  { value: 'ABOVE_AVERAGE', label: 'Above Average' },
  { value: 'AVERAGE', label: 'Average' },
  { value: 'BELOW_AVERAGE', label: 'Below Average' },
  { value: 'BORDERLINE', label: 'Borderline' },
  { value: 'MENTALLY_DEFICIENT', label: 'Mentally Deficient' },
] as const;

export const getPsychologyNarrative = (intellectualLevel?: string): string => {
  const level = intellectualLevels
    .find((option) => option.value === intellectualLevel)
    ?.label.toLowerCase() ?? '_____';

  return `The client garnered ${level} score in intellectual capacity, with no cognitive deficiency seen during test administration. Based on the personality test, he can tolerate irritation from noise and disappointments. He loves to study anything about Japanese Language. Furthermore, he seems to be a goal oriented type of person.`;
};

export const getLocalRecommendedConclusion = (denial?: number): string =>
  denial !== undefined && denial >= 71
    ? 'The client scored markedly high on Denial Scale, which indicates the possibility of manipulating the test to produce a positive impression.'
    : '';

export const recommendationTypes = [
  { value: 'RECOMMENDED', label: 'RECOMMENDED' },
  { value: 'RECOMMENDED_WITH_RESERVATION', label: 'RECOMMENDED WITH RESERVATION' },
  { value: 'RECOMMENDED_FOR_INTERNSHIP', label: 'RECOMMENDED FOR INTERNSHIP' },
  {
    value: 'RECOMMENDED_WITH_RESERVATION_FOR_INTERNSHIP',
    label: 'RECOMMENDED WITH RESERVATION FOR INTERNSHIP',
  },
] as const;

export const psychologyTraitGroups = [
  {
    title: 'Sense of Responsibility',
    traits: [
      { code: 'perseverance', label: 'Perseverance' },
      { code: 'obedience', label: 'Obedience' },
      { code: 'self_discipline', label: 'Self-disciplined / Orderly' },
      { code: 'enthusiasm', label: 'Enthusiasm' },
      { code: 'initiative', label: 'Initiative' },
    ],
  },
  {
    title: 'Emotional Stability',
    traits: [
      { code: 'boredom_tolerance', label: 'Can withstand boredom and work alone' },
      { code: 'stress_tolerance', label: 'Tolerance to stress, pressures and inconveniences' },
      { code: 'faces_reality', label: 'Face reality' },
      { code: 'confidence', label: 'Confidence' },
      { code: 'relaxed', label: 'Relaxed' },
    ],
  },
  {
    title: 'Objectivity',
    traits: [
      { code: 'tough_mindedness', label: 'Tough-mindedness' },
      { code: 'adaptability', label: 'Adaptability' },
      { code: 'practicality', label: 'Practicality' },
    ],
  },
  {
    title: 'Motivation',
    traits: [
      { code: 'assertiveness', label: 'Assertiveness' },
      { code: 'independence', label: 'Independence' },
      { code: 'resourcefulness', label: 'Resourcefulness' },
    ],
  },
  {
    title: 'Interpersonal and Personal Adjustment',
    traits: [
      { code: 'peers', label: 'Relationship with peers and co-workers (teammanship)' },
      { code: 'authority', label: 'Relationship with superiors, employers and authority figures (deference)' },
      { code: 'self_esteem', label: 'Self-esteem' },
      { code: 'aggressive_tendencies', label: 'Aggressive tendencies' },
    ],
  },
  {
    title: 'Goal Orientation',
    traits: [
      { code: 'goal_orientation', label: "Directs one's effort towards clear-cut objectives" },
    ],
  },
] as const;

export type PsychologyRatings = Record<string, number>;

export type PsychologyResult = {
  Id: number;
  AppointmentId: number;
  ChargeId: number;
  DateOfExamination: string;
  FormType?: PsychologyFormType;
  DateOfInterpretation?: string;
  LocalScoresJson?: string;
  PsychologicalScreeningPurpose?: string;
  PsychologicalScreeningPurposeOther?: string;
  IntelligenceTest?: string;
  PersonalityTest?: string;
  OtherTests?: string;
  IntellectualLevel?: string;
  RatingsJson?: string;
  NarrativeReport?: string;
  ConclusionRemarks?: string;
  Recommendation?: string;
  RecommendationType?: string;
  RecommendationDetails?: string;
  FurtherEvaluationDetails?: string;
  PsychologistId?: number;
  PsychologistName?: string;
  PreparedById?: number;
  PreparedByName?: string;
  PreparedByTitle?: string;
  PreparedByLicenseNo?: string;
  ChargeDescription?: string;
};

export const parsePsychologyRatings = (value?: string): PsychologyRatings => {
  try {
    const parsed: unknown = JSON.parse(value || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const allowed = new Set<string>(
      psychologyTraitGroups.flatMap((group) => group.traits.map((trait) => trait.code)),
    );
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([code, rating]) =>
          allowed.has(code) &&
          Number.isInteger(rating) &&
          Number(rating) >= 1 &&
          Number(rating) <= 7,
      ),
    ) as PsychologyRatings;
  } catch {
    return {};
  }
};

export const parseLocalPsychologyScores = (value?: string): LocalPsychologyScores => {
  try {
    const parsed: unknown = JSON.parse(value || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const allowed = new Set<string>(localScoreGroups.flatMap((group) => group.scores.map((score) => score.code)));
    return Object.fromEntries(Object.entries(parsed).filter(
      ([code, score]) => allowed.has(code) && Number.isInteger(score) && Number(score) >= 10 && Number(score) <= 100,
    )) as LocalPsychologyScores;
  } catch {
    return {};
  }
};
