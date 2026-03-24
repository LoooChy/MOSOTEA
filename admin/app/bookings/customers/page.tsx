import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomersPage } from "@/components/admin-react/customers-page";

export const metadata: Metadata = {
  title: "Moso Tea Admin | Booking Customers",
};

export default function BookingCustomersRoutePage() {
  return (
    <Suspense fallback={null}>
      <CustomersPage />
    </Suspense>
  );
}
