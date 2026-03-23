"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type BookingStatus = "open" | "full" | "cancelled" | "completed";

type BookingItem = {
  sessionId: string;
  workshopKey: string;
  workshopType: string;
  date: string;
  timeRange: string;
  booked: number;
  total: number;
  status: BookingStatus;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  } | null;
};

type CustomerItem = {
  bookingId: string;
  bookingRef: string;
  sessionId: string | null;
  name: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  timeRange: string;
  project: string;
};

type BookingListResponse = {
  ok: boolean;
  scope: "upcoming" | "history";
  page: number;
  pageSize: number;
  total: number;
  items: BookingItem[];
  error?: string;
};

type CustomerListResponse = {
  ok: boolean;
  page: number;
  pageSize: number;
  total: number;
  items: CustomerItem[];
  error?: string;
};

type SessionPatchResponse = {
  ok: boolean;
  sessionId: string;
  booked: number;
  total: number;
  status: BookingStatus;
  warning?: string;
  error?: string;
};

type AdminBookingsEnhancerProps = {
  pathname: string;
};

const HISTORY_PAGE_SIZE = 6;
const CUSTOMERS_PAGE_SIZE = 6;
const BOOKINGS_PAGE_SIZE = 100;

function clampGuestCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(6, Math.floor(value)));
}

function formatDate(dateToken: string): string {
  const parsed = new Date(`${dateToken}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateToken;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getStatusMarkup(status: BookingStatus): string {
  if (status === "completed") {
    return `
      <span class="flex items-center gap-2 text-primary font-medium">
        <span class="material-symbols-outlined text-sm">check_circle</span>
        Completed
      </span>
    `;
  }
  if (status === "cancelled") {
    return `
      <span class="flex items-center gap-2 text-error font-medium">
        <span class="material-symbols-outlined text-sm">cancel</span>
        Cancelled
      </span>
    `;
  }
  if (status === "full") {
    return `
      <span class="flex items-center gap-2 text-secondary font-medium">
        <span class="w-2 h-2 rounded-full bg-secondary"></span>
        Full
      </span>
    `;
  }
  return `
    <span class="flex items-center gap-2 text-primary font-medium">
      <span class="w-2 h-2 rounded-full bg-primary"></span>
      Open
    </span>
  `;
}

function getBookedPill(booked: number, total: number, status: BookingStatus): string {
  if (status === "cancelled") {
    return `
      <div class="inline-flex items-center justify-center px-3 py-1 bg-error-container text-on-error-container rounded-full font-label font-bold">
        ${booked}/${total}
      </div>
    `;
  }
  if (booked >= total) {
    return `
      <div class="inline-flex items-center justify-center px-3 py-1 bg-primary text-white rounded-full font-label font-bold">
        ${booked}/${total}
      </div>
    `;
  }
  return `
    <div class="inline-flex items-center justify-center px-3 py-1 bg-surface-variant rounded-full font-label font-bold text-primary">
      ${booked}/${total}
    </div>
  `;
}

function buildPaginationButtons(currentPage: number, totalPages: number): number[] {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  pages.add(currentPage);
  pages.add(currentPage - 1);
  pages.add(currentPage + 1);
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

function renderPagination(options: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}): string {
  const { currentPage, totalPages, totalItems, pageSize } = options;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = buildPaginationButtons(currentPage, totalPages);
  return `
    <p class="text-xs text-on-surface-variant font-medium uppercase tracking-widest">
      Showing ${start}-${end} of ${totalItems} records
    </p>
    <div class="flex gap-2">
      <button
        class="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant ${currentPage <= 1 ? "opacity-40 pointer-events-none" : ""}"
        type="button"
        data-page-nav="prev"
      >
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <div class="flex gap-1">
        ${pages
          .map((page) => {
            const active = page === currentPage;
            return `
              <button
                type="button"
                data-page="${page}"
                class="${
                  active
                    ? "w-10 h-10 rounded-lg bg-primary text-on-primary font-bold text-sm"
                    : "w-10 h-10 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant text-sm"
                }"
              >
                ${page}
              </button>
            `;
          })
          .join("")}
      </div>
      <button
        class="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant ${currentPage >= totalPages ? "opacity-40 pointer-events-none" : ""}"
        type="button"
        data-page-nav="next"
      >
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  `;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
  }
  return payload as T;
}

export function AdminBookingsEnhancer({ pathname }: AdminBookingsEnhancerProps) {
  const isBookingsRoute = pathname === "/bookings";
  const isHistoryRoute = pathname === "/history";
  const isCustomerRoute = pathname === "/customers" || pathname === "/bookings/customers";

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [upcomingData, setUpcomingData] = useState<BookingListResponse | null>(null);
  const [historyData, setHistoryData] = useState<BookingListResponse | null>(null);
  const [customersData, setCustomersData] = useState<CustomerListResponse | null>(null);

  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingGuests, setEditingGuests] = useState(0);
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!isCustomerRoute) {
      setSelectedSessionId(null);
      setCustomersPage(1);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("sessionId");
    setSelectedSessionId(sessionId && sessionId.trim().length > 0 ? sessionId.trim() : null);
  }, [isCustomerRoute, pathname]);

  useEffect(() => {
    if (!isBookingsRoute) {
      return;
    }
    let cancelled = false;
    setLoadingBookings(true);
    setBookingsError(null);
    void fetchJson<BookingListResponse>(
      `/api/admin/bookings?scope=upcoming&page=1&pageSize=${BOOKINGS_PAGE_SIZE}`
    )
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setUpcomingData(payload);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setBookingsError(error instanceof Error ? error.message : "Failed to load bookings.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingBookings(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isBookingsRoute, refreshVersion]);

  useEffect(() => {
    if (!isHistoryRoute) {
      return;
    }
    let cancelled = false;
    setLoadingHistory(true);
    setHistoryError(null);
    void fetchJson<BookingListResponse>(
      `/api/admin/bookings?scope=history&page=${historyPage}&pageSize=${HISTORY_PAGE_SIZE}`
    )
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setHistoryData(payload);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setHistoryError(error instanceof Error ? error.message : "Failed to load history.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [historyPage, isHistoryRoute, refreshVersion]);

  useEffect(() => {
    if (!isCustomerRoute) {
      return;
    }
    let cancelled = false;
    setLoadingCustomers(true);
    setCustomersError(null);
    const query = new URLSearchParams();
    query.set("page", String(customersPage));
    query.set("pageSize", String(CUSTOMERS_PAGE_SIZE));
    if (selectedSessionId) {
      query.set("sessionId", selectedSessionId);
    }

    void fetchJson<CustomerListResponse>(`/api/admin/customers?${query.toString()}`)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setCustomersData(payload);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setCustomersError(error instanceof Error ? error.message : "Failed to load customers.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCustomers(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [customersPage, isCustomerRoute, refreshVersion, selectedSessionId]);

  useEffect(() => {
    if (!isBookingsRoute) {
      setEditingSessionId(null);
      setCancelSessionId(null);
    }
  }, [isBookingsRoute]);

  const upcomingItems = upcomingData?.items ?? [];
  const historyItems = historyData?.items ?? [];
  const customerItems = customersData?.items ?? [];

  const editingItem = useMemo(
    () => upcomingItems.find((item) => item.sessionId === editingSessionId) ?? null,
    [editingSessionId, upcomingItems]
  );
  const cancellingItem = useMemo(
    () => upcomingItems.find((item) => item.sessionId === cancelSessionId) ?? null,
    [cancelSessionId, upcomingItems]
  );

  useEffect(() => {
    if (!isBookingsRoute) {
      return;
    }
    const table = document.querySelector("main table");
    if (!table) {
      return;
    }

    const headerRow = table.querySelector("thead tr");
    if (headerRow) {
      headerRow.innerHTML = `
        <th class="px-8 py-6 font-medium">Date &amp; Time</th>
        <th class="px-8 py-6 font-medium">Workshop Type</th>
        <th class="px-8 py-6 font-medium text-center">Booked/Total</th>
        <th class="px-8 py-6 font-medium">Status</th>
        <th class="px-8 py-6 font-medium text-right">Action</th>
      `;
    }

    const tbody = table.querySelector("tbody");
    if (!tbody) {
      return;
    }

    if (loadingBookings) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-on-surface-variant" colspan="5">Loading bookings...</td>
        </tr>
      `;
      return;
    }
    if (bookingsError) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-error" colspan="5">${escapeHtml(bookingsError)}</td>
        </tr>
      `;
      return;
    }
    if (upcomingItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-on-surface-variant" colspan="5">No booking sessions found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = upcomingItems
      .map((item) => {
        return `
          <tr class="group hover:bg-surface-container-low transition-colors cursor-pointer" data-session-id="${escapeHtml(item.sessionId)}">
            <td class="px-8 py-6">
              <div class="flex flex-col">
                <span class="font-bold text-on-surface">${escapeHtml(formatDate(item.date))}</span>
                <span class="text-on-surface-variant/70">${escapeHtml(item.timeRange)}</span>
              </div>
            </td>
            <td class="px-8 py-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-xl">self_improvement</span>
                </div>
                <div>
                  <p class="font-semibold text-primary">${escapeHtml(item.workshopType)}</p>
                  <p class="text-xs text-on-surface-variant/70">Session: ${escapeHtml(item.sessionId)}</p>
                </div>
              </div>
            </td>
            <td class="px-8 py-6 text-center">
              ${getBookedPill(item.booked, item.total, item.status)}
            </td>
            <td class="px-8 py-6">
              ${getStatusMarkup(item.status)}
            </td>
            <td class="px-8 py-6 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  data-action="cancel"
                  data-session-id="${escapeHtml(item.sessionId)}"
                  class="px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-xs font-label font-bold hover:opacity-90 transition-opacity"
                >
                  取消
                </button>
                <button
                  type="button"
                  data-action="edit"
                  data-session-id="${escapeHtml(item.sessionId)}"
                  class="px-3 py-1.5 rounded-full bg-surface-container-high text-primary text-xs font-label font-bold hover:bg-surface-container-highest transition-colors"
                >
                  编辑
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    const onBodyClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const actionButton = target.closest<HTMLButtonElement>("button[data-action]");
      if (actionButton) {
        event.preventDefault();
        event.stopPropagation();
        const sessionId = actionButton.getAttribute("data-session-id");
        if (!sessionId) {
          return;
        }
        const action = actionButton.getAttribute("data-action");
        if (action === "cancel") {
          setEditingSessionId(null);
          setCancelSessionId(sessionId);
          return;
        }
        const selected = upcomingItems.find((item) => item.sessionId === sessionId);
        if (!selected) {
          return;
        }
        setCancelSessionId(null);
        setEditingSessionId(sessionId);
        setEditingGuests(selected.booked);
        return;
      }

      const row = target.closest<HTMLTableRowElement>("tr[data-session-id]");
      if (!row) {
        return;
      }
      const sessionId = row.getAttribute("data-session-id");
      if (!sessionId) {
        return;
      }
      window.location.href = `/bookings/customers?sessionId=${encodeURIComponent(sessionId)}`;
    };

    tbody.addEventListener("click", onBodyClick);
    return () => {
      tbody.removeEventListener("click", onBodyClick);
    };
  }, [bookingsError, isBookingsRoute, loadingBookings, upcomingItems]);

  useEffect(() => {
    if (!isCustomerRoute) {
      return;
    }
    const table = document.querySelector("main table");
    if (!table) {
      return;
    }

    const title = document.querySelector("header h2");
    if (title) {
      title.textContent = selectedSessionId ? "Customer Booking Details" : "Customer Directory";
    }
    const subtitle = title?.parentElement?.querySelector("p");
    if (subtitle) {
      subtitle.textContent = selectedSessionId
        ? "Primary contact information for the selected session."
        : "Main contact details for all active bookings.";
    }

    const headerRow = table.querySelector("thead tr");
    if (headerRow) {
      headerRow.innerHTML = `
        <th class="px-8 py-6 font-headline italic text-lg text-primary font-medium">Name</th>
        <th class="px-6 py-6 font-headline italic text-lg text-primary font-medium">Email</th>
        <th class="px-6 py-6 font-headline italic text-lg text-primary font-medium">Phone</th>
        <th class="px-6 py-6 font-headline italic text-lg text-primary font-medium">Booked</th>
        <th class="px-6 py-6 font-headline italic text-lg text-primary font-medium">Date &amp; Time</th>
        <th class="px-6 py-6 font-headline italic text-lg text-primary font-medium">Project</th>
      `;
    }

    const tbody = table.querySelector("tbody");
    if (!tbody) {
      return;
    }

    if (loadingCustomers) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-on-surface-variant" colspan="6">Loading customers...</td>
        </tr>
      `;
    } else if (customersError) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-error" colspan="6">${escapeHtml(customersError)}</td>
        </tr>
      `;
    } else if (customerItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-on-surface-variant" colspan="6">No customer records found.</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = customerItems
        .map((item) => {
          return `
            <tr class="group hover:bg-surface-container-low transition-colors ease-out-expo duration-500">
              <td class="px-8 py-6">
                <p class="font-bold text-on-surface">${escapeHtml(item.name)}</p>
              </td>
              <td class="px-6 py-6 text-on-surface-variant">${escapeHtml(item.email)}</td>
              <td class="px-6 py-6 text-on-surface-variant">${escapeHtml(item.phone)}</td>
              <td class="px-6 py-6">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary-fixed text-on-primary-fixed">
                  ${item.guests}
                </span>
              </td>
              <td class="px-6 py-6 text-on-surface-variant">${escapeHtml(`${formatDate(item.date)} - ${item.timeRange}`)}</td>
              <td class="px-6 py-6 text-primary font-medium">${escapeHtml(item.project)}</td>
            </tr>
          `;
        })
        .join("");
    }

    const card = table.closest("div.bg-surface-container-lowest");
    if (!card) {
      return;
    }

    const total = customersData?.total ?? 0;
    const page = customersData?.page ?? customersPage;
    const pageSize = customersData?.pageSize ?? CUSTOMERS_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    let pagination = card.querySelector<HTMLElement>("[data-admin-pagination='customers']");
    if (!pagination) {
      const existing = card.querySelector<HTMLElement>(".px-8.py-6.flex.items-center.justify-between");
      if (existing) {
        existing.remove();
      }
      pagination = document.createElement("div");
      pagination.setAttribute("data-admin-pagination", "customers");
      pagination.className =
        "px-8 py-6 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30";
      card.appendChild(pagination);
    }
    pagination.innerHTML = renderPagination({
      currentPage: page,
      totalPages,
      totalItems: total,
      pageSize,
    });
    pagination.onclick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      const pageButton = target.closest<HTMLButtonElement>("button[data-page]");
      if (pageButton) {
        const nextPage = Number(pageButton.getAttribute("data-page"));
        if (Number.isFinite(nextPage)) {
          setCustomersPage(nextPage);
        }
        return;
      }
      const navButton = target.closest<HTMLButtonElement>("button[data-page-nav]");
      if (!navButton) {
        return;
      }
      const direction = navButton.getAttribute("data-page-nav");
      if (direction === "prev") {
        setCustomersPage((current) => Math.max(1, current - 1));
      } else if (direction === "next") {
        setCustomersPage((current) => Math.min(totalPages, current + 1));
      }
    };
  }, [
    customerItems,
    customersData,
    customersError,
    customersPage,
    isCustomerRoute,
    loadingCustomers,
    selectedSessionId,
  ]);

  useEffect(() => {
    if (!isHistoryRoute) {
      return;
    }
    const mainTitle = document.querySelector("header h2");
    if (mainTitle) {
      mainTitle.textContent = "History";
    }
    const subtitle = mainTitle?.parentElement?.querySelector("p");
    if (subtitle) {
      subtitle.textContent = "Completed workshop sessions and attendance history.";
    }

    const statsGrid = document.querySelector(
      "main section.grid.grid-cols-1.md\\:grid-cols-3"
    ) as HTMLElement | null;
    if (statsGrid) {
      statsGrid.style.display = "none";
    }

    const table = document.querySelector("main table");
    if (!table) {
      return;
    }
    const tableTitle = table
      .closest("section")
      ?.querySelector("div.p-8.border-b h3") as HTMLElement | null;
    if (tableTitle) {
      tableTitle.textContent = "Completed Activities";
    }

    const headerRow = table.querySelector("thead tr");
    if (headerRow) {
      headerRow.innerHTML = `
        <th class="px-8 py-6 font-medium">Date &amp; Time</th>
        <th class="px-8 py-6 font-medium">Workshop Type</th>
        <th class="px-8 py-6 font-medium text-center">Booked/Total</th>
        <th class="px-8 py-6 font-medium">Status</th>
      `;
    }

    const tbody = table.querySelector("tbody");
    if (!tbody) {
      return;
    }
    if (loadingHistory) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-on-surface-variant" colspan="4">Loading history...</td>
        </tr>
      `;
    } else if (historyError) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-error" colspan="4">${escapeHtml(historyError)}</td>
        </tr>
      `;
    } else if (historyItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td class="px-8 py-10 text-center text-on-surface-variant" colspan="4">No completed activities.</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = historyItems
        .map((item) => {
          return `
            <tr class="group hover:bg-surface-container-low transition-colors">
              <td class="px-8 py-6">
                <div class="flex flex-col">
                  <span class="font-bold text-on-surface">${escapeHtml(formatDate(item.date))}</span>
                  <span class="text-on-surface-variant/70">${escapeHtml(item.timeRange)}</span>
                </div>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-xl">history</span>
                  </div>
                  <p class="font-semibold text-primary">${escapeHtml(item.workshopType)}</p>
                </div>
              </td>
              <td class="px-8 py-6 text-center">
                ${getBookedPill(item.booked, item.total, item.status)}
              </td>
              <td class="px-8 py-6">
                ${getStatusMarkup(item.status)}
              </td>
            </tr>
          `;
        })
        .join("");
    }

    const card = table.closest("section.bg-surface-container-lowest");
    if (!card) {
      return;
    }
    const total = historyData?.total ?? 0;
    const page = historyData?.page ?? historyPage;
    const pageSize = historyData?.pageSize ?? HISTORY_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    let pagination = card.querySelector<HTMLElement>("[data-admin-pagination='history']");
    if (!pagination) {
      pagination = document.createElement("div");
      pagination.setAttribute("data-admin-pagination", "history");
      pagination.className =
        "px-8 py-6 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30";
      card.appendChild(pagination);
    }
    pagination.innerHTML = renderPagination({
      currentPage: page,
      totalPages,
      totalItems: total,
      pageSize,
    });
    pagination.onclick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      const pageButton = target.closest<HTMLButtonElement>("button[data-page]");
      if (pageButton) {
        const nextPage = Number(pageButton.getAttribute("data-page"));
        if (Number.isFinite(nextPage)) {
          setHistoryPage(nextPage);
        }
        return;
      }
      const navButton = target.closest<HTMLButtonElement>("button[data-page-nav]");
      if (!navButton) {
        return;
      }
      const direction = navButton.getAttribute("data-page-nav");
      if (direction === "prev") {
        setHistoryPage((current) => Math.max(1, current - 1));
      } else if (direction === "next") {
        setHistoryPage((current) => Math.min(totalPages, current + 1));
      }
    };
  }, [
    historyData,
    historyError,
    historyItems,
    historyPage,
    isHistoryRoute,
    loadingHistory,
  ]);

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update booking.";
      window.alert(message);
    }
  };

  const onConfirmCancel = async () => {
    if (!cancellingItem) {
      return;
    }
    try {
      const result = await fetchJson<SessionPatchResponse>(`/api/admin/bookings/${cancellingItem.sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "cancel",
        }),
      });
      if (result.warning && result.warning.trim().length > 0) {
        window.alert(result.warning);
      }
      setCancelSessionId(null);
      setRefreshVersion((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel booking.";
      window.alert(message);
    }
  };

  if ((!editingItem && !cancellingItem) || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1c1c19]/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl">
        {editingItem ? (
          <>
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
                onClick={onConfirmEdit}
                className="px-5 py-2.5 rounded-full bg-primary text-white font-label text-sm hover:opacity-90 transition-opacity"
              >
                Confirm
              </button>
            </div>
          </>
        ) : null}
        {cancellingItem ? (
          <>
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
                onClick={onConfirmCancel}
                className="px-5 py-2.5 rounded-full bg-error text-white font-label text-sm hover:opacity-90 transition-opacity"
              >
                Confirm Cancel
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
