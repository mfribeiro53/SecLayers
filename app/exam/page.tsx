"use client";

import { useState } from "react";
import Link from "next/link";
import rawQuestions from "@/content/exam-questions.json";

type Question = (typeof rawQuestions)[number];

const QUESTIONS: Question[] = rawQuestions;

const card: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border-subtle)",
};

export default function ExamPage() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  const start = () => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setSubmitted(false);
  };

  const answer = (questionId: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const next = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion((c) => c + 1);
    }
  };
  const prev = () => {
    if (currentQuestion > 0) setCurrentQuestion((c) => c - 1);
  };
  const submit = () => setSubmitted(true);

  const score = submitted
    ? shuffledQuestions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;
  const q = shuffledQuestions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10">
      <header
        className="rounded-2xl p-7 lg:p-9 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "#a5b4fc" }}
        >
          Assessment
        </p>
        <h1
          className="mt-2 text-3xl lg:text-4xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Exam
        </h1>
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {QUESTIONS.length} questions across{" "}
          {new Set(QUESTIONS.map((q) => q.chapter)).size} Phase 1 chapters
        </p>
      </header>

      <div className="mt-8">
        {!started ? (
          <div
            className="p-8 rounded-xl text-center space-y-5"
            style={card}
          >
            <p style={{ color: "var(--text-secondary)" }}>
              Questions are randomly shuffled. You can navigate freely and
              change answers before submitting.
            </p>
            <button
              onClick={start}
              className="px-6 py-3 rounded-lg font-medium text-sm transition-colors"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Start Exam
            </button>
          </div>
        ) : submitted ? (
          <div className="space-y-6">
            <div
              className="p-8 rounded-xl text-center"
              style={card}
            >
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {score} / {shuffledQuestions.length}
              </p>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {score >= 32
                  ? "Excellent — strong AppSec fundamentals."
                  : score >= 24
                    ? "Good work. Review the chapters for topics you missed."
                    : "Keep studying. Review the chapters and try again."}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={start}
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    background: "var(--accent)",
                    color: "white",
                  }}
                >
                  Retake
                </button>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-md text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ← Back to chapters
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              {shuffledQuestions.map((q) => {
                const isCorrect = answers[q.id] === q.correctIndex;
                const accent = isCorrect ? "#34d399" : "#f87171";
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-lg text-sm"
                    style={{
                      background: "var(--bg-surface)",
                      borderLeft: `3px solid ${accent}`,
                      border: "1px solid var(--border-subtle)",
                      borderLeftWidth: "3px",
                      borderLeftColor: accent,
                    }}
                  >
                    <p style={{ color: "var(--text-primary)" }}>
                      {isCorrect ? "✓" : "✗"} {q.question}
                    </p>
                    {!isCorrect && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Correct: {q.options[q.correctIndex]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          q && (
            <div className="space-y-5">
              {/* Progress */}
              <div
                className="flex items-center justify-between text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <span>
                  Question {currentQuestion + 1} of{" "}
                  {shuffledQuestions.length}
                </span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>

              {/* Question */}
              <div className="p-6 rounded-xl" style={card}>
                <p
                  className="text-[11px] uppercase tracking-widest font-bold mb-2"
                  style={{ color: "#a5b4fc" }}
                >
                  {q.chapterTitle}
                </p>
                <p
                  className="text-lg font-medium leading-relaxed"
                  style={{ color: "var(--text-primary)" }}
                >
                  {q.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => answer(q.id, i)}
                      className="w-full text-left p-4 rounded-lg transition-colors"
                      style={{
                        background: selected
                          ? "var(--accent-soft)"
                          : "var(--bg-surface)",
                        color: selected
                          ? "#a5b4fc"
                          : "var(--text-secondary)",
                        border: `1px solid ${selected ? "var(--accent)" : "var(--border-subtle)"}`,
                      }}
                    >
                      <span
                        className="font-mono text-xs mr-2"
                        style={{
                          color: selected ? "#a5b4fc" : "var(--text-muted)",
                        }}
                      >
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Nav */}
              <div className="flex justify-between">
                <button
                  onClick={prev}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 text-sm rounded-md transition-colors disabled:opacity-40"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  ← Previous
                </button>
                {currentQuestion < shuffledQuestions.length - 1 ? (
                  <button
                    onClick={next}
                    className="px-4 py-2 text-sm rounded-md font-medium"
                    style={{ background: "var(--accent)", color: "white" }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    className="px-4 py-2 text-sm rounded-md font-medium"
                    style={{ background: "#10b981", color: "white" }}
                  >
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
