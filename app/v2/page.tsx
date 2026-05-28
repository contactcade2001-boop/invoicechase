import { redirect } from "next/navigation";

/** /v2 was the staging URL while we built the new landing. The new
 *  design is now live at /, so anyone who bookmarked /v2 gets a
 *  permanent redirect home. Keep this file until traffic stops. */
export default function V2Redirect() {
  redirect("/");
}
