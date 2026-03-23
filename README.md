# Moso Tea Next.js Workspace

This workspace contains two independent Next.js apps:

- `front`: public website based on the static design drafts
- `admin`: admin console based on the static design drafts

## Install

```bash
npm install
```

## Run

```bash
npm run dev:front
npm run dev:admin
```

## Build

```bash
npm run build:front
npm run build:admin
```

## Booking Email (Resend)

`/booking/success` will call `POST /api/booking/send-email` and send a real booking confirmation email with subject:

`MOSO TEA BOOKING INFORMATION`

Configure these environment variables for the `front` app:

- `RESEND_API_KEY`
- `RESEND_FROM` (must be a verified sender/domain in Resend)
- `RESEND_REPLY_TO` (optional)

Recommended file: `front/.env.local`

## Supabase + Vercel API

This workspace now includes production-ready API routes for `front` and `admin`, backed by Supabase.

### 1) Create Database Schema

Run SQL in Supabase SQL Editor:

- `supabase/schema.sql`

### 2) Environment Variables

Set these variables in Vercel for both apps (`front` and `admin`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Additional variables:

- `front`: `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO` (optional)
- `admin`: `ADMIN_API_TOKEN` (optional but recommended for external API callers)
- `admin` (booking cancellation email): `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO` (optional)

### 3) Front API Endpoints

- `POST /api/booking/submit`
  - Create booking in Supabase (no email).
- `POST /api/booking/send-email`
  - Persist booking in Supabase and send confirmation email via Resend.
- `GET /api/booking/availability?date=YYYY-MM-DD[&workshop=authentic|brewing|making]`
  - Query available sessions for booking calendar.

### 4) Admin API Endpoints

Admin API accepts either:

- `Authorization: Bearer <ADMIN_API_TOKEN>`
- or `x-admin-token: <ADMIN_API_TOKEN>`
- or admin login cookie (`moso_admin_auth=1`) for same-origin dashboard requests

Endpoints:

- `GET /api/admin/bookings?scope=upcoming|history&page=1&pageSize=10`
  - Session list for `/bookings` and `/history`.
- `PATCH /api/admin/bookings/:sessionId`
  - Body:
    - `{ "action": "cancel" }`
    - `{ "action": "edit", "bookedCount": 0..6 }`
- `GET /api/admin/customers?sessionId=<uuid>&page=1&pageSize=10`
  - Contact list for `/customers`.

## Route Mapping

### Front app (`front`)

- `/` -> `stitch/moso_tea_homepage/code.html`
- `/about` -> `stitch/about_us_desktop/code.html`
- `/workshops` -> `stitch/workshops_listing/code.html`
- `/contact` -> `stitch/contact_us_desktop/code.html`
- `/faq` -> `stitch/refined_faq_desktop/code.html`
- `/booking/calendar` -> `stitch/booking_calendar_date_selection/code.html`
- `/booking/confirm` -> `stitch/booking_confirmation/code.html`
- `/booking/validate` -> `stitch/booking_validation_feedback_desktop/code.html`
- `/booking/full` -> `stitch/booking_error_full_capacity_desktop/code.html`
- `/booking/success` -> `stitch/booking_success_desktop/code.html`
- `/booking/loading` -> `stitch/loading_state_preparing_ritual_desktop/code.html`

### Admin app (`admin`)

- `/` -> `stitch/admin_booking_overview/code.html`
- `/login` -> `stitch/admin_login_desktop/code.html`
- `/bookings/detail` -> `stitch/admin_booking_details_customer_profile/code.html`
- `/customers` -> `stitch/admin_customer_directory/code.html`
- `/content` -> `stitch/admin_content_management/code.html`
- `/notifications` -> `stitch/admin_notifications_toasts_desktop/code.html`
