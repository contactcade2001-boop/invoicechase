import { redirect } from "next/navigation";

/** /dashboard-v2 was the staging URL while we built the new dashboard.
 *  The new design is now live at /dashboard. Anyone who bookmarked
 *  /dashboard-v2 gets a permanent redirect. */
export default function DashboardV2Redirect() {
  redirect("/dashboard");
}
