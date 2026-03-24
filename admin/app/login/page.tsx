import type { Metadata } from "next";
import { LoginPage } from "@/components/admin-react/login-page";

export const metadata: Metadata = {
  title: "Moso Tea Admin | Login",
};

export default function LoginRoutePage() {
  return <LoginPage />;
}

