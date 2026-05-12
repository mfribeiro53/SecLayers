import { describe, it, expect } from "vitest";
import { semverClean, semverLt } from "@/lib/semver-utils";

describe("semverClean", () => {
  it("strips caret prefix", () => expect(semverClean("^1.2.3")).toBe("1.2.3"));
  it("strips tilde prefix", () => expect(semverClean("~2.0.0")).toBe("2.0.0"));
  it("strips >= prefix", () => expect(semverClean(">=3.1.0")).toBe("3.1.0"));
  it("passes through plain version", () => expect(semverClean("4.17.21")).toBe("4.17.21"));
  it("strips pre-release suffix", () => expect(semverClean("1.0.0-beta.1")).toBe("1.0.0"));
  it("strips build metadata", () => expect(semverClean("1.0.0+build.42")).toBe("1.0.0"));
});

describe("semverLt", () => {
  it("older patch is less than newer patch", () => expect(semverLt("4.17.15", "4.17.21")).toBe(true));
  it("same version is not less than", () => expect(semverLt("4.17.21", "4.17.21")).toBe(false));
  it("newer patch is not less than older", () => expect(semverLt("4.17.21", "4.17.15")).toBe(false));
  it("older minor is less than newer minor", () => expect(semverLt("1.2.6", "1.3.0")).toBe(true));
  it("older major is less than newer major", () => expect(semverLt("3.9.9", "4.0.0")).toBe(true));
  it("handles range-prefixed versions", () => expect(semverLt("^4.17.15", "4.17.21")).toBe(true));
  it("1.2.5 < 1.2.6 (minimist CVE check)", () => expect(semverLt("1.2.5", "1.2.6")).toBe(true));
  it("2.29.1 < 2.29.2 (moment CVE check)", () => expect(semverLt("2.29.1", "2.29.2")).toBe(true));
  it("missing patch segment treated as 0", () => expect(semverLt("1.0", "1.0.1")).toBe(true));
});
