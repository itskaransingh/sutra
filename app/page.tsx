import { redirect } from "next/navigation";

export default function Home() {
  redirect("/me")
  return (
    <div>
      Redirecting...
    </div>
  );
}
