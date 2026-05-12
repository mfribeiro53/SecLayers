import type { Lab } from "@/types";

export type { Lab };

export const LABS: Lab[] = [
  {
    slug: "sqli-login-bypass",
    title: "SQL Injection: Login Bypass",
    act: 2,
    chapterSlug: "sql-injection",
    difficulty: "easy",
    objective:
      "A login form concatenates user input directly into a SQL query with no sanitization. Log in as admin without knowing the password.",
    tags: ["sqli", "owasp-a03", "web"],
  },
  {
    slug: "xss-cookie-theft",
    title: "XSS: Cookie Theft",
    act: 2,
    chapterSlug: "xss",
    difficulty: "easy",
    objective:
      "A blog's comment section reflects user input without encoding. Craft a payload that steals the admin session cookie.",
    tags: ["xss", "owasp-a03", "web"],
  },
  {
    slug: "csrf-email-change",
    title: "CSRF: Account Takeover",
    act: 2,
    chapterSlug: "csrf",
    difficulty: "medium",
    objective:
      "The settings API changes a user's email with no CSRF token. Craft a malicious HTML page that silently changes the victim's email when visited.",
    tags: ["csrf", "owasp-a01", "web"],
  },
  {
    slug: "idor-user-profile",
    title: "IDOR: Profile Data Leak",
    act: 2,
    chapterSlug: "idor",
    difficulty: "easy",
    objective:
      "The /api/users/{id}/profile endpoint returns any user's data by ID alone. Find the admin profile.",
    tags: ["idor", "owasp-a01", "web"],
  },
  {
    slug: "broken-api-auth",
    title: "Broken API Auth: Expired JWT",
    act: 3,
    chapterSlug: "api-auth",
    difficulty: "medium",
    objective:
      "The admin API accepts JWTs without validating the expiry claim. Use an expired token to access the admin endpoint.",
    tags: ["jwt", "owasp-a02", "api"],
  },
  {
    slug: "graphql-introspection",
    title: "GraphQL: Introspection Leak",
    act: 3,
    chapterSlug: "graphql",
    difficulty: "medium",
    objective:
      "Introspection is enabled in production. Use it to discover a hidden type and query the secret flag field.",
    tags: ["graphql", "introspection", "api"],
  },
];

export const LAB_ACT_LABELS: Record<number, string> = {
  2: "Act I — Web Security",
  3: "Act II — API Security",
};

export function getLabBySlug(slug: string): Lab | undefined {
  return LABS.find((l) => l.slug === slug);
}

export function groupLabsByAct(): Record<number, Lab[]> {
  const groups: Record<number, Lab[]> = {};
  for (const lab of LABS) {
    if (!groups[lab.act]) groups[lab.act] = [];
    groups[lab.act].push(lab);
  }
  return groups;
}
