import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root traffic to the secure dashboard portal
  // The middleware will handle sending unauthenticated users to /login
  redirect("/dashboard");
}
