export type Level = "concept" | "calculation" | "synthesis";

export interface Question {
  id: string;
  text: string;
  level: Level;
  section: string;
}

export interface Section {
  title: string;
  questions: Question[];
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  sections: Section[];
}
