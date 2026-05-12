import { describe, it, expect } from "vitest";
import { TOPICS } from "@/lib/topics";
import { TOOL_META } from "@/lib/tool-meta";
import examQuestions from "@/content/exam-questions.json";
import glossary from "@/content/glossary.json";

// ── Topics ───────────────────────────────────────────────────────

describe("TOPICS", () => {
  it("has 41 entries", () => {
    expect(TOPICS).toHaveLength(41);
  });

  it("has unique slugs", () => {
    const slugs = TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique chapter numbers", () => {
    const nums = TOPICS.map((t) => t.num);
    expect(new Set(nums).size).toBe(nums.length);
  });

  it("chapter numbers are sequential 1–41", () => {
    const sorted = [...TOPICS].sort((a, b) => a.num - b.num).map((t) => t.num);
    const expected = Array.from({ length: 41 }, (_, i) => i + 1);
    expect(sorted).toEqual(expected);
  });

  it("every topic has required fields", () => {
    for (const topic of TOPICS) {
      expect(topic.slug, `topic ${topic.num}`).toBeTruthy();
      expect(topic.title, `topic ${topic.num}`).toBeTruthy();
      expect(topic.actLabel, `topic ${topic.num}`).toBeTruthy();
      expect(topic.toolComponent, `topic ${topic.num}`).toBeTruthy();
      expect(topic.act, `topic ${topic.num}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("act numbers are 1–7", () => {
    for (const topic of TOPICS) {
      expect(topic.act).toBeGreaterThanOrEqual(1);
      expect(topic.act).toBeLessThanOrEqual(7);
    }
  });
});

// ── TOOL_META ────────────────────────────────────────────────────

describe("TOOL_META", () => {
  it("every TOPICS toolComponent has a TOOL_META entry", () => {
    const missing = TOPICS.filter((t) => !TOOL_META[t.toolComponent]).map(
      (t) => t.toolComponent
    );
    expect(missing).toEqual([]);
  });

  it("every TOOL_META entry has summary and quickStart", () => {
    for (const [key, meta] of Object.entries(TOOL_META)) {
      expect(meta.summary, key).toBeTruthy();
      expect(Array.isArray(meta.quickStart), key).toBe(true);
      expect(meta.quickStart.length, key).toBeGreaterThan(0);
    }
  });

  it("help steps are non-empty arrays when present", () => {
    for (const [key, meta] of Object.entries(TOOL_META)) {
      if (meta.help) {
        expect(Array.isArray(meta.help.steps), key).toBe(true);
        expect(meta.help.steps.length, key).toBeGreaterThan(0);
        expect(meta.help.goal, key).toBeTruthy();
        expect(meta.help.lookFor, key).toBeTruthy();
      }
    }
  });
});

// ── Exam questions ───────────────────────────────────────────────

describe("exam-questions.json", () => {
  it("has at least 40 questions", () => {
    expect(examQuestions.length).toBeGreaterThanOrEqual(40);
  });

  it("every question has required fields", () => {
    for (const q of examQuestions) {
      expect(q.id, `question ${q.id}`).toBeDefined();
      expect(q.question, `question ${q.id}`).toBeTruthy();
      expect(Array.isArray(q.options), `question ${q.id}`).toBe(true);
      expect(q.options.length, `question ${q.id}`).toBeGreaterThanOrEqual(2);
      expect(q.explanation, `question ${q.id}`).toBeTruthy();
    }
  });

  it("correctIndex is within options range", () => {
    for (const q of examQuestions) {
      expect(q.correctIndex, `question ${q.id}`).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, `question ${q.id}`).toBeLessThan(q.options.length);
    }
  });

  it("question IDs are unique", () => {
    const ids = examQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── Glossary ─────────────────────────────────────────────────────

describe("glossary.json", () => {
  it("has at least 100 entries", () => {
    expect(glossary.length).toBeGreaterThanOrEqual(100);
  });

  it("every entry has term and definition", () => {
    for (const entry of glossary) {
      expect(entry.term, JSON.stringify(entry)).toBeTruthy();
      expect(entry.definition, entry.term).toBeTruthy();
    }
  });

  it("terms are unique", () => {
    const terms = glossary.map((e) => e.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("relatedTopics are valid TOPICS slugs when present", () => {
    const validSlugs = new Set(TOPICS.map((t) => t.slug));
    for (const entry of glossary) {
      for (const slug of entry.relatedTopics ?? []) {
        expect(validSlugs.has(slug), `"${entry.term}" references unknown slug "${slug}"`).toBe(true);
      }
    }
  });
});
