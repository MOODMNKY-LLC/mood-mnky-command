import { redirect } from "next/navigation";

/** Canonical route is /dojo/me/preferences. Redirect so bookmarks and legacy links work. */
export default function DojoPreferencesRedirect() {
  redirect("/dojo/me/preferences");
}
