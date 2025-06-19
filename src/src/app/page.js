import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login"); // Redirige a la página de login
  return null;
}
