"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type DepthMode = "beginner" | "advanced";
type Difficulty = "junior" | "mid" | "senior";

interface AppState {
  depthMode: DepthMode;
  setDepthMode: (v: DepthMode) => void;

  interviewMode: boolean;
  setInterviewMode: (v: boolean) => void;

  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;

  completedTopics: Set<number>;
  markTopicComplete: (n: number) => void;

  glossaryOpen: boolean;
  setGlossaryOpen: (v: boolean) => void;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [depthMode, setDepthMode] = useState<DepthMode>("beginner");
  const [interviewMode, setInterviewMode] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("mid");
  const [completedTopics, setCompletedTopics] = useState<Set<number>>(
    new Set()
  );
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("seclayers-completed");
      if (saved) setCompletedTopics(new Set(JSON.parse(saved) as number[]));
    } catch {
      /* ignore */
    }
  }, []);

  function markTopicComplete(n: number) {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      next.add(n);
      try {
        localStorage.setItem(
          "seclayers-completed",
          JSON.stringify([...next])
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <AppCtx.Provider
      value={{
        depthMode,
        setDepthMode,
        interviewMode,
        setInterviewMode,
        difficulty,
        setDifficulty,
        completedTopics,
        markTopicComplete,
        glossaryOpen,
        setGlossaryOpen,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be called inside <AppProvider>");
  return ctx;
}
