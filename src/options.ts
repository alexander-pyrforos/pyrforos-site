export interface Option {
  id: string;
  title: string;
  art: string;
}

/** Placeholder tournament options — owner-approved content replaces these at the content pass. */
export const OPTIONS: Option[] = [
  { id: "V1", title: "Variant 1", art: "art-a" },
  { id: "V2", title: "Variant 2", art: "art-b" },
  { id: "V3", title: "Variant 3", art: "art-c" },
  { id: "V4", title: "Variant 4", art: "art-d" },
  { id: "V5", title: "Variant 5", art: "art-e" },
  { id: "V6", title: "Variant 6", art: "art-f" },
];

export const SEED_HIDE_THRESHOLD = 10;