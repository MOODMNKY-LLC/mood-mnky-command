import { redirect } from "next/navigation";

/** Canonical route is /dojo/me/crafting/saved. Redirect so bookmarks and legacy links work. */
export default function DojoCraftingSavedRedirect() {
  redirect("/dojo/me/crafting/saved");
}
