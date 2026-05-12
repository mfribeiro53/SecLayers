export interface Topic {
  num: number;
  act: number;
  title: string;
  slug: string;
  actLabel: string;
  toolComponent: string;
  tags: string[];
}

export interface ChapterContent {
  slug: string;
  theory: string;
  misconception: {
    myth: string;
    reality: string;
  };
  interviewQuestions: InterviewQuestion[];
  toolConfig?: Record<string, unknown>;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  category: "junior" | "mid" | "senior";
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  relatedTopics: string[];
  act?: number;
}

export interface ExamQuestion {
  id: string;
  chapterSlug: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface UserProgress {
  completedChapters: string[];
  lastVisited: string | null;
  examScores: { date: string; score: number; total: number }[];
  depthToggle: "beginner" | "advanced";
}

export type ActColor =
  | "slate"
  | "blue"
  | "violet"
  | "emerald"
  | "orange"
  | "rose"
  | "cyan";

export interface Lab {
  slug: string;
  title: string;
  act: number;
  chapterSlug: string;
  difficulty: "easy" | "medium" | "hard";
  objective: string;
  tags: string[];
}

export const ACT_NUMBER_TO_COLOR: Record<number, ActColor> = {
  1: "slate",
  2: "blue",
  3: "violet",
  4: "emerald",
  5: "orange",
  6: "rose",
  7: "cyan",
};
