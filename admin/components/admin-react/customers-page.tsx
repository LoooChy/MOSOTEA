"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPagination } from "@/components/admin-react/pagination";
import type { CustomerItem, CustomerListResponse } from "@/components/admin-react/types";
import { fetchJson, formatDate } from "@/components/admin-react/utils";
import { ProtectedShell } from "@/components/admin-react/protected-shell";

const CUSTOMERS_PAGE_SIZE = 6;

export function CustomersPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(CUSTOMERS_PAGE_SIZE);

  const sessionId = useMemo(() => {
    const raw = searchParams.get("sessionId");
    return raw && raw.trim().length > 0 ? raw.trim() : null;
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("pageSize", String(CUSTOMERS_PAGE_SIZE));
    if (sessionId) {
      query.set("sessionId", sessionId);
    }

    void fetchJson<CustomerListResponse>(`/api/admin/customers?${query.toString()}`)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setItems(payload.items);
        setTotal(payload.total);
        setPageSize(payload.pageSize);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error ? requestError.message : "Failed to load customers."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, sessionId]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const title = sessionId ? "Customer Booking Details" : "Customer Directory";
  const subtitle = sessionId
    ? "Primary contact information for the selected session."
    : "Main contact details for all active bookings.";

  return (
    <ProtectedShell pathname={sessionId ? "/bookings/customers" : "/customers"}>
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline text-4xl font-bold tracking-tight text-primary">{title}</h2>
          <p className="font-body text-on-surface-variant mt-2 max-w-lg">{subtitle}</p>
        </div>
      </header>

      <section>
        <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="px-8 py-6 font-headline italic text-lg text-primary font-medium">Name</th>
                <th className="px-6 py-6 font-headline italic text-lg text-primary font-medium">Email</th>
                <th className="px-6 py-6 font-headline italic text-lg text-primary font-medium">Phone</th>
                <th className="px-6 py-6 font-headline italic text-lg text-primary font-medium">Booked</th>
                <th className="px-6 py-6 font-headline italic text-lg text-primary font-medium">
                  Date &amp; Time
                </th>
                <th className="px-6 py-6 font-headline italic text-lg text-primary font-medium">Project</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr>
                  <td className="px-8 py-10 text-center text-on-surface-variant" colSpan={6}>
                    Loading customers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-8 py-10 text-center text-error" colSpan={6}>
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-8 py-10 text-center text-on-surface-variant" colSpan={6}>
                    No customer records found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.bookingId}
                    className="group hover:bg-surface-container-low transition-colors ease-out-expo duration-500"
                  >
                    <td className="px-8 py-6">
                      <p className="font-bold text-on-surface">{item.name}</p>
                    </td>
                    <td className="px-6 py-6 text-on-surface-variant">{item.email}</td>
                    <td className="px-6 py-6 text-on-surface-variant">{item.phone}</td>
                    <td className="px-6 py-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary-fixed text-on-primary-fixed">
                        {item.guests}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-on-surface-variant">
                      {item.date ? `${formatDate(item.date)} - ${item.timeRange}` : "-"}
                    </td>
                    <td className="px-6 py-6 text-primary font-medium">{item.project || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </section>
    </ProtectedShell>
  );
}

