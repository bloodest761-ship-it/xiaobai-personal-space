const studioPathPattern = /^\/studio(?:\/|$)/;

/** Only permit internal Studio destinations after authentication. */
export function getSafeStudioRedirect(value: FormDataEntryValue | string | null | undefined) {
  const candidate = typeof value === "string" ? value : "";

  if (
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.includes("\\") &&
    studioPathPattern.test(candidate)
  ) {
    return candidate;
  }

  return "/studio";
}
