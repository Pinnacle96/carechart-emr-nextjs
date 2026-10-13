export const MEDICATION_CATALOGUE = [
  { key: "demo-med-alpha", name: "Demo medicine Alpha" },
  { key: "demo-med-beta", name: "Demo medicine Beta" },
  { key: "demo-med-gamma", name: "Demo medicine Gamma" },
] as const;

export const LAB_CATALOGUE = [
  { key: "demo-lab-panel", name: "Demo wellness panel" },
  { key: "demo-lab-marker", name: "Demo marker test" },
  { key: "demo-lab-screen", name: "Demo screening test" },
] as const;

export const COMPLETION_REQUIRED_FIELDS = [
  "visitReason",
  "subjective",
  "assessment",
  "plan",
] as const;

export const PATIENTS_PER_PAGE = 10;
