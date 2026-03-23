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

