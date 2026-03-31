/**
 * Returns the correct dashboard route based on user_metadata.
 * Supports flat user_type values: student_license, student_master, student_doctorate,
 * freelance, pme, enterprise.
 * Also supports legacy format (user_type + level/org_type).
 */
export function getDashboardRoute(meta: Record<string, any> | undefined): string {
  if (!meta) return "/dashboard";

  const userType = meta.user_type || "";

  // Flat user_type values (preferred)
  switch (userType) {
    case "student_license":
      return "/dashboard/student-license";
    case "student_master":
      return "/dashboard/student-master";
    case "student_doctorate":
      return "/dashboard/student-doctorate";
    case "freelance":
      return "/dashboard/freelance";
    case "pme":
      return "/dashboard/pme";
    case "enterprise":
      return "/dashboard/enterprise";
  }

  // Legacy format fallback
  if (userType === "student") {
    const level = meta.level || "licence";
    const levelMap: Record<string, string> = {
      licence: "/dashboard/student-license",
      master: "/dashboard/student-master",
      doctorat: "/dashboard/student-doctorate",
    };
    return levelMap[level] || "/dashboard/student-license";
  }

  if (userType === "organisation") {
    return meta.org_type === "enterprise"
      ? "/dashboard/enterprise"
      : "/dashboard/pme";
  }

  return "/dashboard";
}
