"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPagination } from "@/components/admin-react/pagination";
import type {
  BookingItem,
  BookingListResponse,
  SessionPatchResponse,
} from "@/components/admin-react/types";
import { clampGuestCount, fetchJson, formatDate } from "@/components/admin-react/utils";
import { ProtectedShell } from "@/components/admin-react/protected-shell";

const BOOKINGS_PAGE_SIZE = 100;

function StatusBadge({ status }: { status: BookingItem["status"] }) {
  if (status === "completed") {
    return (
      <span className="flex items-center gap-2 text-primary font-medium">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        Completed
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="flex items-center gap-2 text-error font-medium">
        <span className="material-symbols-outlined text-sm">cancel</span>
        Cancelled
      </span>
    );
  }
  if (status === "full") {
    return (
      <span className="flex items-center gap-2 text-secondary font-medium">
        <span className="w-2 h-2 rounded-full bg-secondary" />
        Full
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-primary font-medium">
      <span className="w-2 h-2 rounded-full bg-primary" />
      Open
    </span>
  );
}

function BookedPill({
  booked,
  total,
  status,
}: {
  booked: number;
  total: number;
  status: BookingItem["status"];
}) {
  if (status === "cancelled") {
    return (
      <div className="inline-flex items-center justify-center px-3 py-1 bg-error-container text-on-error-container rounded-full font-label font-bold">
        {booked}/{total}
      </div>
    );
  }
  if (booked >= total) {
    return (
      <div className="inline-flex items-center justify-center px-3 py-1 bg-primary text-white rounded-full font-label font-bold">
        {booked}/{total}
      </div>
    );
  }
  return (
    <div className="inline-flex items-center justify-center px-3 py-1 bg-surface-variant rounded-full font-label font-bold text-primary">
      {booked}/{total}
    </div>
  );
}

export function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BookingItem[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingGuests, setEditingGuests] = useState(0);
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchJson<BookingListResponse>(
      `/api/admin/bookings?scope=upcoming&page=1&pageSize=${BOOKINGS_PAGE_SIZE}`
    )
      .then((payload) => {
        if (!cancelled) {
          setItems(payload.items);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load bookings.");
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
  }, [refreshVersion]);

  const editingItem = useMemo(
    () => items.find((item) => item.sessionId === editingSessionId) ?? null,
    [editingSessionId, items]
  );
  const cancellingItem = useMemo(
    () => items.find((item) => item.sessionId === cancelSessionId) ?? null,
    [cancelSessionId, items]
  );

  const onComplete = async (sessionId: string) => {
    try {
      await fetchJson<SessionPatchResponse>(`/api/admin/bookings/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "complete",
        }),
      });
      setRefreshVersion((value) => value + 1);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to complete booking.";
      window.alert(message);
    }
  };

  const onConfirmEdit = async () => {
    if (!editingItem) {
      return;
    }
    try {
      await fetchJson<SessionPatchResponse>(`/api/admin/bookings/${editingItem.sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "edit",
          bookedCount: clampGuestCount(editingGuests),
        }),
      });
      setEditingSessionId(null);
      setRefreshVersion((value) => value + 1);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to update booking.";
      window.alert(message);
    }
  };

  const onConfirmCancel = async () => {
    if (!cancellingItem) {
      return;
    }
    try {
      const result = await fetchJson<SessionPatchResponse>(
        `/api/admin/bookings/${cancellingItem.sessionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "cancel",
          }),
        }
      );
      if (result.warning && result.warning.trim().length > 0) {
        window.alert(result.warning);
      }
      setCancelSessionId(null);
      setRefreshVersion((value) => value + 1);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to cancel booking.";
      window.alert(message);
    }
  };

  return (
    <ProtectedShell pathname="/bookings">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <h2 className="font-headline text-4xl text-primary font-light tracking-tight mb-2">
            Hi, Tea Master
          </h2>
          <p className="text-on-surface-variant font-body">
            The garden is quiet. Here is the ritual oversight for today.
          </p>
        </div>
      </header>

      <section className="bg-surface-container-lowest rounded-xl p-1 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-surface-variant/30 flex justify-between items-center">
          <h3 className="font-headline text-2xl text-primary">Upcoming Sessions</h3>
          <div className="flex gap-4">
            <button
              type="button"
              className="text-primary text-sm font-label flex items-center gap-1 hover:underline"
            >
              View Calendar <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-secondary/60 font-label text-xs uppercase tracking-widest">
                <th className="px-8 py-6 font-medium">Date &amp; Time</th>
                <th className="px-8 py-6 font-medium">Workshop Type</th>
                <th className="px-8 py-6 font-medium text-center">Booked/Total</th>
                <th className="px-8 py-6 font-medium">Status</th>
                <th className="px-8 py-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-body">
              {loading ? (
                <tr>
                  <td className="px-8 py-10 text-center text-on-surface-variant" colSpan={5}>
                    Loading bookings...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-8 py-10 text-center text-error" colSpan={5}>
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-8 py-10 text-center text-on-surface-variant" colSpan={5}>
                    No booking sessions found.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const disableActions = item.status === "cancelled" || item.status === "completed";
                  return (
                    <tr
                      key={item.sessionId}
                      className="group hover:bg-surface-container-low transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/bookings/customers?sessionId=${encodeURIComponent(item.sessionId)}`;
                      }}
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">{formatDate(item.date)}</span>
                          <span className="text-on-surface-variant/70">{item.timeRange}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">self_improvement</span>
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{item.workshopType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <BookedPill booked={item.booked} total={item.total} status={item.status} />
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={item.status} />
                      </td>
                      <td
                        className="px-8 py-6 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (disableActions) {
                                return;
                              }
                              setEditingSessionId(null);
                              setCancelSessionId(item.sessionId);
                            }}
                            className={`px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-xs font-label font-bold transition-opacity ${
                              disableActions ? "opacity-40 pointer-events-none" : "hover:opacity-90"
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (disableActions) {
                                return;
                              }
                              void onComplete(item.sessionId);
                            }}
                            className={`px-3 py-1.5 rounded-full bg-primary text-white text-xs font-label font-bold transition-opacity ${
                              disableActions ? "opacity-40 pointer-events-none" : "hover:opacity-90"
                            }`}
                          >
                            Done
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (disableActions) {
                                return;
                              }
                              setCancelSessionId(null);
                              setEditingSessionId(item.sessionId);
                              setEditingGuests(item.booked);
                            }}
                            className={`px-3 py-1.5 rounded-full bg-surface-container-high text-primary text-xs font-label font-bold transition-colors ${
                              disableActions
                                ? "opacity-40 pointer-events-none"
                                : "hover:bg-surface-container-highest"
                            }`}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingItem ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1c1c19]/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl">
            <div className="px-6 py-5 border-b border-outline-variant/20">
              <h3 className="font-headline text-2xl text-primary">Edit Booked Guests</h3>
              <p className="text-sm text-on-surface-variant mt-2">
                {editingItem.workshopType} ({editingItem.sessionId})
              </p>
            </div>
            <div className="px-6 py-6 space-y-3">
              <label className="block text-xs uppercase tracking-[0.18em] text-secondary font-label">
                Booked Guests (0 - 6)
              </label>
              <input
                type="number"
                min={0}
                max={6}
                value={editingGuests}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setEditingGuests(clampGuestCount(next));
                }}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 text-on-surface focus:border-primary focus:ring-0"
              />
            </div>
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingSessionId(null)}
                className="px-5 py-2.5 rounded-full bg-surface-container-high text-on-surface-variant font-label text-sm hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onConfirmEdit()}
                className="px-5 py-2.5 rounded-full bg-primary text-white font-label text-sm hover:opacity-90 transition-opacity"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cancellingItem ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1c1c19]/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl">
            <div className="px-6 py-5 border-b border-outline-variant/20">
              <h3 className="font-headline text-2xl text-primary">Cancel Booking</h3>
              <p className="text-sm text-on-surface-variant mt-2">
                {cancellingItem.workshopType} ({cancellingItem.sessionId})
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-on-surface">
                Are you sure you want to cancel this booking? This action will set booked guests to 0.
              </p>
            </div>
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelSessionId(null)}
                className="px-5 py-2.5 rounded-full bg-surface-container-high text-on-surface-variant font-label text-sm hover:bg-surface-container-highest transition-colors"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => void onConfirmCancel()}
                className="px-5 py-2.5 rounded-full bg-error text-white font-label text-sm hover:opacity-90 transition-opacity"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ProtectedShell>
  );
}

export function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BookingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchJson<BookingListResponse>(`/api/admin/bookings?scope=history&page=${page}&pageSize=6`)
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
          setError(requestError instanceof Error ? requestError.message : "Failed to load history.");
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
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <ProtectedShell pathname="/history">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <h2 className="font-headline text-4xl text-primary font-light tracking-tight mb-2">History</h2>
          <p className="text-on-surface-variant font-body">
            Completed workshop sessions and attendance history.
          </p>
        </div>
      </header>

      <section className="bg-surface-container-lowest rounded-xl p-1 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-surface-variant/30 flex justify-between items-center">
          <h3 className="font-headline text-2xl text-primary">Completed Activities</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-secondary/60 font-label text-xs uppercase tracking-widest">
                <th className="px-8 py-6 font-medium">Date &amp; Time</th>
                <th className="px-8 py-6 font-medium">Workshop Type</th>
                <th className="px-8 py-6 font-medium text-center">Booked/Total</th>
                <th className="px-8 py-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-body">
              {loading ? (
                <tr>
                  <td className="px-8 py-10 text-center text-on-surface-variant" colSpan={4}>
                    Loading history...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-8 py-10 text-center text-error" colSpan={4}>
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-8 py-10 text-center text-on-surface-variant" colSpan={4}>
                    No completed activities.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.sessionId} className="group hover:bg-surface-container-low transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">{formatDate(item.date)}</span>
                        <span className="text-on-surface-variant/70">{item.timeRange}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">history</span>
                        </div>
                        <p className="font-semibold text-primary">{item.workshopType}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <BookedPill booked={item.booked} total={item.total} status={item.status} />
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </section>
    </ProtectedShell>
  );
}

