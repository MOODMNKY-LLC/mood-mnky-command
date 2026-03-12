import { redirect } from "next/navigation";

/** Canonical route is /dojo/me/flowise. Redirect so bookmarks and legacy links work. */
export default function DojoFlowiseRedirect() {
  redirect("/dojo/me/flowise");
}
