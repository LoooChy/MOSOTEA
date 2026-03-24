export type BookingStatus = "open" | "full" | "cancelled" | "completed";

export type BookingItem = {
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

export type CustomerItem = {
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

export type BookingListResponse = {
  ok: boolean;
  scope: "upcoming" | "history";
  page: number;
  pageSize: number;
  total: number;
  items: BookingItem[];
  error?: string;
};

export type CustomerListResponse = {
  ok: boolean;
  page: number;
  pageSize: number;
  total: number;
  items: CustomerItem[];
  error?: string;
};

export type SessionPatchResponse = {
  ok: boolean;
  sessionId: string;
  booked: number;
  total: number;
  status: BookingStatus;
  warning?: string;
  error?: string;
};

