/**
 * Returns the correct dashboard route based on user_metadata.
 */
export function getDashboardRoute(meta: Record<string, any> | undefined): string {
  if (!meta) return "/dashboard";

  const userType = meta.user_type || "";
  const level = meta.level || "licence";

  switch (userType) {
    case "student":
      return `/dashboard/student/${level}`;
    case "freelance":
      return "/dashboard/freelance";
    case "organisation":
      return "/dashboard/enterprise";
    default:
      return "/dashboard";
  }
}
