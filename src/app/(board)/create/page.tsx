import { redirect } from "next/navigation";

export default function CreateEntryPage() {
  redirect("/board?create=1");
}
