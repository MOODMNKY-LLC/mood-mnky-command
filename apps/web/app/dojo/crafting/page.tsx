import { redirect } from "next/navigation";

/** Canonical route is /dojo/me/crafting. Redirect so bookmarks and legacy links work. */
export default function DojoCraftingRedirect() {
  redirect("/dojo/me/crafting");
}
