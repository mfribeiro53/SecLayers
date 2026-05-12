/** Strip leading range specifiers and pre-release suffixes from a semver string. */
export function semverClean(v: string): string {
  return v.replace(/^[^0-9]*/, "").replace(/[-+].*$/, "");
}

/** Returns true if semver a is strictly less than b. */
export function semverLt(a: string, b: string): boolean {
  const pa = semverClean(a).split(".").map(Number);
  const pb = semverClean(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const na = isNaN(pa[i]) ? 0 : pa[i];
    const nb = isNaN(pb[i]) ? 0 : pb[i];
    if (na < nb) return true;
    if (na > nb) return false;
  }
  return false;
}
