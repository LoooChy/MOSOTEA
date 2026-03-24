"use client";

import { useEffect } from "react";

type BookingJourneyEnhancerProps = {
  enabled: boolean;
};

type ExperienceKey = "authentic" | "brewing" | "making";

const EXPERIENCE_ORDER: ExperienceKey[] = ["authentic", "brewing", "making"];

const EXPERIENCE_DETAILS: Record<
  ExperienceKey,
  { title: string; unitPrice: number }
> = {
  authentic: {
    title: "Authentic Ceremony",
    unitPrice: 50,
  },
  brewing: {
    title: "Tradition of Tea Brewing",
    unitPrice: 50,
  },
  making: {
    title: "Art of Tea Making",
    unitPrice: 50,
  },
};

const CALENDAR_THEME = {
  wrapper:
    "bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10",
  monthHeader: "font-headline text-2xl text-primary",
  iconButton: "p-2 hover:bg-surface-container rounded-full transition-colors",
  weekday:
    "text-center text-xs font-label uppercase tracking-widest text-on-surface/30 mb-4",
  selectedDay:
    "aspect-square flex flex-col items-center justify-center rounded-2xl bg-primary text-on-primary shadow-xl shadow-primary/20 transform scale-105 z-10",
  normalDay:
    "aspect-square flex flex-col items-center justify-center rounded-2xl border border-primary/10 hover:bg-surface-container transition-all",
  disabledDay:
    "aspect-square flex flex-col items-center justify-center rounded-2xl bg-surface-dim/20 opacity-45 cursor-not-allowed text-on-surface/40",
  outsideDay: "aspect-square flex items-center justify-center text-on-surface/10",
};

const TIME_SLOT_THEME = {
  selected:
    "p-6 rounded-xl bg-primary text-on-primary ring-2 ring-primary ring-offset-4 ring-offset-surface flex items-center justify-between group cursor-pointer transition-all duration-500",
  normal:
    "p-6 rounded-xl bg-surface-container-lowest border border-primary/5 flex items-center justify-between group cursor-pointer hover:bg-primary hover:text-white transition-all duration-500",
  disabled:
    "p-6 rounded-xl bg-surface-container-lowest border border-primary/5 flex items-center justify-between group transition-all duration-500 opacity-60 cursor-not-allowed",
};

function formatDateToken(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatCurrentTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeTimeLabel(raw: string): string {
  const compact = raw.replace(/\s+/g, " ").trim();
  const range = compact.match(/(\d{1,2}:\d{2})\D+(\d{1,2}:\d{2})/);
  if (range) {
    return `${range[1]} - ${range[2]}`;
  }
  const single = compact.match(/(\d{1,2}:\d{2})/);
  if (single) {
    return single[1];
  }
  return compact;
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatSummaryDateTime(date: Date, time: string): string {
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
  return `${label} - ${time}`;
}

function createSelectedBadge(): HTMLDivElement {
  const badge = document.createElement("div");
  badge.setAttribute("data-selected-badge", "true");
  badge.className =
    "absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20";
  const icon = document.createElement("span");
  icon.className = "material-symbols-outlined text-white text-sm";
  icon.textContent = "check_circle";
  icon.style.fontVariationSettings = "'FILL' 1";
  badge.appendChild(icon);
  return badge;
}

export function BookingJourneyEnhancer({ enabled }: BookingJourneyEnhancerProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const completedBookingKey = "moso:booking-completed-ref";
    const navigationEntry = window.performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const navigationType = navigationEntry?.type ?? "navigate";
    const completedBookingRef = window.localStorage.getItem(completedBookingKey);
    if (completedBookingRef) {
      if (navigationType === "back_forward") {
        window.location.replace("/");
        return;
      }
      window.localStorage.removeItem(completedBookingKey);
    }

    const heading = Array.from(document.querySelectorAll("h2")).find((node) =>
      /choose your journey/i.test(node.textContent ?? "")
    ) as HTMLElement | undefined;
    if (!heading) {
      return;
    }

    const section = heading.closest("section");
    const grid = section?.querySelector("div.grid");
    const cards = (grid ? Array.from(grid.children).slice(0, 3) : []).filter(
      (node): node is HTMLElement => node instanceof HTMLElement
    );
    if (cards.length !== 3) {
      return;
    }

    cards.forEach((card, index) => {
      card.dataset.experience = EXPERIENCE_ORDER[index];
      card.style.cursor = "pointer";
      const existingBadge = card.querySelector(".absolute.top-4.right-4") as
        | HTMLElement
        | null;
      if (existingBadge) {
        existingBadge.setAttribute("data-selected-badge", "true");
      }
    });

    const summaryTitle = Array.from(document.querySelectorAll("h3")).find((node) =>
      /reservation summary/i.test(node.textContent ?? "")
    ) as HTMLElement | undefined;
    const summaryAside = summaryTitle?.closest("aside") as HTMLElement | null;
    const summaryRoot =
      (summaryTitle?.closest(".sticky, .relative.z-10, .rounded-3xl") as
        | HTMLElement
        | null) ??
      (summaryAside?.firstElementChild as HTMLElement | null);
    const summaryRows = summaryRoot
      ? Array.from(summaryRoot.querySelectorAll("div.space-y-6 > div"))
      : [];
    const experienceValue = summaryRows[0]?.querySelector(
      ".font-headline.text-lg"
    ) as HTMLElement | null;
    const dateTimeValue = summaryRows[1]?.querySelector(
      ".font-headline.text-lg"
    ) as HTMLElement | null;
    const totalValue = summaryRoot?.querySelector(
      ".text-3xl.font-headline.text-primary"
    ) as HTMLElement | null;
    const totalLabel = summaryRoot?.querySelector(
      ".pt-6.border-t .text-xs.uppercase"
    ) as HTMLElement | null;
    const detailsStack = summaryRoot?.querySelector("div.space-y-6") as
      | HTMLElement
      | null;

    const continueControl = Array.from(
      document.querySelectorAll("a[role='button'], a, button")
    ).find((node) =>
      /continue to guest info/i.test(node.textContent ?? "")
    ) as HTMLAnchorElement | HTMLButtonElement | undefined;

    const changeControl = Array.from(
      document.querySelectorAll("a, button")
    ).find((node) => /^change$/i.test((node.textContent ?? "").trim()));

    const selectDateHeading = Array.from(document.querySelectorAll("h2")).find((node) =>
      /select a date/i.test(node.textContent ?? "")
    ) as HTMLElement | undefined;
    const selectDateSection = selectDateHeading?.closest("section");
    const calendarContainer = selectDateSection?.querySelector(
      ".bg-surface-container-low.rounded-3xl"
    ) as HTMLElement | null;
    const timeHeading = Array.from(document.querySelectorAll("h2")).find((node) =>
      /available times/i.test(node.textContent ?? "")
    ) as HTMLElement | undefined;
    const timeSection = timeHeading?.closest("section");

    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const currentTimeLabel = formatCurrentTime(now);

    let selected: ExperienceKey = "authentic";
    let selectedDate = new Date(tomorrow);
    let visibleMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    let selectedTime = currentTimeLabel;
    let selectedTimeSlotLabel: string | null = null;
    let selectedGuests = 1;

    let guestControls = detailsStack?.querySelector(
      "[data-guest-controls='true']"
    ) as HTMLElement | null;
    if (!guestControls && detailsStack) {
      const totalRow = detailsStack.querySelector(
        ".pt-6.border-t"
      ) as HTMLElement | null;
      const controls = document.createElement("div");
      controls.setAttribute("data-guest-controls", "true");
      controls.className =
        "flex items-center justify-between bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3";
      controls.innerHTML = `
        <div>
          <div class="text-xs uppercase tracking-widest text-on-surface/40 mb-1">Guests</div>
          <div class="text-sm font-headline text-primary" data-guest-value>1</div>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" data-guest-action="decrease" class="w-9 h-9 rounded-full border border-primary/20 text-primary flex items-center justify-center transition-colors hover:bg-surface-container">-</button>
          <button type="button" data-guest-action="increase" class="w-9 h-9 rounded-full border border-primary/20 text-primary flex items-center justify-center transition-colors hover:bg-surface-container">+</button>
        </div>
      `;
      if (totalRow) {
        detailsStack.insertBefore(controls, totalRow);
      } else {
        detailsStack.appendChild(controls);
      }
      guestControls = controls;
    }

    const guestValue = guestControls?.querySelector(
      "[data-guest-value]"
    ) as HTMLElement | null;
    const guestDecreaseButton = guestControls?.querySelector(
      "[data-guest-action='decrease']"
    ) as HTMLButtonElement | null;
    const guestIncreaseButton = guestControls?.querySelector(
      "[data-guest-action='increase']"
    ) as HTMLButtonElement | null;

    const timeSlots = (timeSection
      ? Array.from(
          timeSection.querySelectorAll<HTMLElement>("div.p-6.rounded-xl")
        )
      : []
    )
      .map((element) => {
        const titleEl = element.querySelector(".text-lg.font-headline") as
          | HTMLElement
          | null;
        const label = normalizeTimeLabel(titleEl?.textContent ?? "");
        const soldOut = /sold out/i.test(element.textContent ?? "");
        return {
          element,
          label,
          soldOut,
        };
      })
      .filter((slot) => slot.label.length > 0);

    const applyCardAppearance = (
      card: HTMLElement,
      state: "active" | "hover" | "inactive"
    ) => {
      const image = card.querySelector("img") as HTMLImageElement | null;
      const overlay = Array.from(card.querySelectorAll(".absolute.inset-0")).find(
        (el) => (el as HTMLElement).className.includes("bg-gradient-to-t")
      ) as HTMLElement | undefined;

      card.style.transition = "transform 320ms cubic-bezier(0.19, 1, 0.22, 1)";

      if (state === "active") {
        card.style.transform = "translateY(-6px) scale(1.03)";
        if (image) {
          image.classList.remove("grayscale", "group-hover:grayscale-0");
          image.style.filter = "grayscale(0)";
          image.style.opacity = "0.96";
        }
        if (overlay) {
          overlay.style.background =
            "linear-gradient(to top, rgba(23,52,28,0.92), rgba(23,52,28,0.26), transparent)";
        }
        return;
      }

      if (state === "hover") {
        card.style.transform = "translateY(-8px) scale(1.035)";
        if (image) {
          image.classList.remove("grayscale", "group-hover:grayscale-0");
          image.style.filter = "grayscale(0.15)";
          image.style.opacity = "0.82";
        }
        if (overlay) {
          overlay.style.background =
            "linear-gradient(to top, rgba(23,52,28,0.86), rgba(23,52,28,0.22), transparent)";
        }
        return;
      }

      card.style.transform = "";
      if (image) {
        image.classList.remove("grayscale", "group-hover:grayscale-0");
        image.style.filter = "grayscale(1)";
        image.style.opacity = "0.45";
      }
      if (overlay) {
        overlay.style.background =
          "linear-gradient(to top, rgba(28,28,25,0.78), rgba(28,28,25,0.18), transparent)";
      }
    };

    const updateSummary = () => {
      const details = EXPERIENCE_DETAILS[selected];
      const canContinue = Boolean(selectedTimeSlotLabel);
      if (experienceValue) {
        experienceValue.textContent = details.title;
      }
      if (dateTimeValue) {
        dateTimeValue.textContent = formatSummaryDateTime(selectedDate, selectedTime);
      }
      if (totalValue) {
        totalValue.textContent = formatMoney(details.unitPrice * selectedGuests);
      }
      if (totalLabel) {
        totalLabel.textContent = `Total for ${selectedGuests} ${selectedGuests === 1 ? "Guest" : "Guests"}`;
      }
      if (guestValue) {
        guestValue.textContent = String(selectedGuests);
      }
      if (guestDecreaseButton) {
        guestDecreaseButton.disabled = selectedGuests <= 1;
        guestDecreaseButton.style.opacity = selectedGuests <= 1 ? "0.45" : "1";
        guestDecreaseButton.style.cursor =
          selectedGuests <= 1 ? "not-allowed" : "pointer";
      }
      if (guestIncreaseButton) {
        guestIncreaseButton.disabled = selectedGuests >= 6;
        guestIncreaseButton.style.opacity = selectedGuests >= 6 ? "0.45" : "1";
        guestIncreaseButton.style.cursor =
          selectedGuests >= 6 ? "not-allowed" : "pointer";
      }
      if (continueControl) {
        continueControl.classList.toggle("opacity-50", !canContinue);
        continueControl.classList.toggle("cursor-not-allowed", !canContinue);
        continueControl.classList.toggle("pointer-events-none", !canContinue);
        continueControl.setAttribute("aria-disabled", canContinue ? "false" : "true");
        if (continueControl instanceof HTMLButtonElement) {
          continueControl.disabled = !canContinue;
        }
      }
      if (continueControl instanceof HTMLAnchorElement) {
        continueControl.href = `/booking/validate?experience=${selected}&date=${formatDateToken(
          selectedDate
        )}&time=${encodeURIComponent(selectedTime)}&guests=${selectedGuests}`;
      }
    };

    const applySummarySticky = () => {
      if (!summaryRoot) {
        return;
      }
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      if (desktop) {
        const topOffset = 128;
        summaryRoot.style.position = "sticky";
        summaryRoot.style.top = `${topOffset}px`;
        summaryRoot.style.maxHeight = `calc(100vh - ${topOffset + 20}px)`;
        summaryRoot.style.overflowY = "auto";
      } else {
        summaryRoot.style.position = "static";
        summaryRoot.style.top = "";
        summaryRoot.style.maxHeight = "";
        summaryRoot.style.overflowY = "";
      }
    };

    const applyTimeSlotVisual = (
      slot: { element: HTMLElement; label: string; soldOut: boolean },
      state: "selected" | "normal" | "disabled"
    ) => {
      slot.element.className =
        state === "selected"
          ? TIME_SLOT_THEME.selected
          : state === "normal"
            ? TIME_SLOT_THEME.normal
            : TIME_SLOT_THEME.disabled;
      const iconWrap = slot.element.querySelector(".w-12.h-12.rounded-full") as
        | HTMLElement
        | null;
      const icon = slot.element.querySelector(".material-symbols-outlined") as
        | HTMLElement
        | null;
      const subtitle = slot.element.querySelector(".text-sm") as
        | HTMLElement
        | null;
      const spots = slot.element.querySelector(".text-xs") as HTMLElement | null;

      if (iconWrap) {
        iconWrap.classList.remove("bg-white/10", "bg-surface-container-high");
      }
      if (icon) {
        icon.classList.remove("text-white", "text-primary", "group-hover:text-white");
        icon.style.opacity = "";
      }
      if (subtitle) {
        subtitle.classList.remove(
          "text-white/60",
          "text-on-surface/50",
          "group-hover:text-white/60"
        );
        subtitle.style.opacity = "";
      }
      if (spots) {
        spots.classList.remove(
          "text-white",
          "text-primary",
          "group-hover:text-white",
          "text-error"
        );
        spots.style.opacity = "";
      }

      if (state === "selected") {
        if (iconWrap) {
          iconWrap.classList.add("bg-white/10");
        }
        if (icon) {
          icon.classList.add("text-white");
        }
        if (subtitle) {
          subtitle.classList.add("text-white/60");
        }
        if (spots) {
          spots.classList.add("text-white");
        }
        return;
      }

      if (state === "normal") {
        if (iconWrap) {
          iconWrap.classList.add("bg-surface-container-high");
        }
        if (icon) {
          icon.classList.add("text-primary", "group-hover:text-white");
        }
        if (subtitle) {
          subtitle.classList.add("text-on-surface/50", "group-hover:text-white/60");
        }
        if (spots) {
          spots.classList.add("text-primary", "group-hover:text-white");
        }
        return;
      }

      if (iconWrap) {
        iconWrap.classList.add("bg-surface-container-high");
      }
      if (icon) {
        icon.classList.add("text-primary");
      }
      if (subtitle) {
        subtitle.classList.add("text-on-surface/50");
      }
      if (spots) {
        if (slot.soldOut) {
          spots.classList.add("text-error");
        } else {
          spots.classList.add("text-primary");
        }
      }
      if (state === "disabled") {
        if (icon) {
          icon.style.opacity = "0.75";
        }
        if (subtitle) {
          subtitle.style.opacity = "0.75";
        }
        if (spots) {
          spots.style.opacity = "0.85";
        }
      }
    };

    const updateTimeSlotsVisual = () => {
      timeSlots.forEach((slot) => {
        if (slot.soldOut) {
          applyTimeSlotVisual(slot, "disabled");
          return;
        }
        if (selectedTimeSlotLabel && slot.label === selectedTimeSlotLabel) {
          applyTimeSlotVisual(slot, "selected");
          return;
        }
        applyTimeSlotVisual(slot, "normal");
      });
    };

    const renderDatePicker = () => {
      if (!calendarContainer) {
        return;
      }
      const monthTitle = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(visibleMonth);

      const firstDay = new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        1
      );
      const startOffset = (firstDay.getDay() + 6) % 7;
      const daysInMonth = new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + 1,
        0
      ).getDate();

      let daysHtml = "";
      for (let i = 0; i < startOffset; i += 1) {
        daysHtml += `<div class="${CALENDAR_THEME.outsideDay}">-</div>`;
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth(),
          day
        );
        const selectable = startOfDay(date).getTime() > todayStart.getTime();
        const selectedDay = selectable && isSameDay(date, selectedDate);
        const classes = selectedDay
          ? CALENDAR_THEME.selectedDay
          : selectable
            ? CALENDAR_THEME.normalDay
            : CALENDAR_THEME.disabledDay;
        const subText = selectedDay ? "Chosen" : selectable ? "Avail" : "Locked";
        const token = formatDateToken(date);
        if (selectable) {
          daysHtml += `<button type="button" data-cal-date="${token}" class="${classes}"><span class="text-lg font-headline">${day}</span><span class="text-[8px] uppercase tracking-tighter ${selectedDay ? "opacity-70 mt-1" : "text-primary/40 mt-1"}">${subText}</span></button>`;
        } else {
          daysHtml += `<div class="${classes}"><span class="text-lg font-headline">${day}</span><span class="text-[8px] uppercase tracking-tighter mt-1">${subText}</span></div>`;
        }
      }

      const totalCells = startOffset + daysInMonth;
      const trailing = (7 - (totalCells % 7)) % 7;
      for (let i = 0; i < trailing; i += 1) {
        daysHtml += `<div class="${CALENDAR_THEME.outsideDay}">-</div>`;
      }

      const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        .map((label) => `<div class="${CALENDAR_THEME.weekday}">${label}</div>`)
        .join("");

      calendarContainer.className = CALENDAR_THEME.wrapper;
      calendarContainer.innerHTML = `
        <div class="flex items-center justify-between mb-10">
          <div class="flex items-center space-x-4">
            <h3 class="${CALENDAR_THEME.monthHeader}">${monthTitle}</h3>
            <div class="flex space-x-1">
              <button type="button" data-cal-action="prev" class="${CALENDAR_THEME.iconButton}">
                <span class="material-symbols-outlined text-primary text-xl">chevron_left</span>
              </button>
              <button type="button" data-cal-action="next" class="${CALENDAR_THEME.iconButton}">
                <span class="material-symbols-outlined text-primary text-xl">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-7 gap-y-6">
          ${weekdays}
          ${daysHtml}
        </div>
      `;
    };

    const onCalendarClick = (event: Event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-cal-action],[data-cal-date]"
      );
      if (!target) {
        return;
      }
      const action = target.dataset.calAction;
      if (action === "prev") {
        visibleMonth = new Date(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth() - 1,
          1
        );
        renderDatePicker();
        return;
      }
      if (action === "next") {
        visibleMonth = new Date(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth() + 1,
          1
        );
        renderDatePicker();
        return;
      }
      const dateToken = target.dataset.calDate;
      if (!dateToken) {
        return;
      }
      const parsed = new Date(`${dateToken}T12:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }
      if (startOfDay(parsed).getTime() <= todayStart.getTime()) {
        return;
      }
      selectedDate = parsed;
      visibleMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      renderDatePicker();
      updateSummary();
      syncQuery();
    };

    const updateVisualState = () => {
      cards.forEach((card) => {
        const active = card.dataset.experience === selected;
        const hovered = card.dataset.hovered === "true";

        card.classList.toggle("ring-2", active);
        card.classList.toggle("ring-primary", active);
        card.classList.toggle("ring-offset-2", active);
        card.classList.toggle("ring-offset-surface", active);
        card.classList.toggle("shadow-2xl", active);
        applyCardAppearance(card, active ? "active" : hovered ? "hover" : "inactive");

        const existing = card.querySelector(
          "[data-selected-badge='true']"
        ) as HTMLElement | null;
        if (active && !existing) {
          card.appendChild(createSelectedBadge());
        }
        if (!active && existing) {
          existing.remove();
        }
      });
    };

    const syncQuery = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("experience", selected);
      url.searchParams.set("date", formatDateToken(selectedDate));
      url.searchParams.set("time", selectedTime);
      url.searchParams.set("guests", String(selectedGuests));
      window.history.replaceState({}, "", url.toString());
    };

    const applySelection = (next: ExperienceKey) => {
      selected = next;
      updateVisualState();
      updateSummary();
      syncQuery();
    };

    const clickHandlers = cards.map((card) => {
      const handler = () => {
        const value = card.dataset.experience as ExperienceKey | undefined;
        if (!value) {
          return;
        }
        applySelection(value);
      };
      card.addEventListener("click", handler);
      return { card, handler };
    });

    const hoverHandlers = cards.map((card) => {
      const enter = () => {
        if (card.dataset.experience === selected) {
          return;
        }
        card.dataset.hovered = "true";
        updateVisualState();
      };
      const leave = () => {
        if (card.dataset.hovered) {
          delete card.dataset.hovered;
          updateVisualState();
        }
      };
      card.addEventListener("mouseenter", enter);
      card.addEventListener("mouseleave", leave);
      return { card, enter, leave };
    });

    const requested = new URLSearchParams(window.location.search).get("experience");
    if (requested && EXPERIENCE_ORDER.includes(requested as ExperienceKey)) {
      selected = requested as ExperienceKey;
    }

    const requestedDate = new URLSearchParams(window.location.search).get("date");
    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      const parsed = new Date(`${requestedDate}T12:00:00`);
      if (
        !Number.isNaN(parsed.getTime()) &&
        startOfDay(parsed).getTime() > todayStart.getTime()
      ) {
        selectedDate = parsed;
        visibleMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }

    const requestedTime = new URLSearchParams(window.location.search).get("time");
    if (requestedTime) {
      const normalized = normalizeTimeLabel(requestedTime);
      const matched = timeSlots.find((slot) => !slot.soldOut && slot.label === normalized);
      if (matched) {
        selectedTimeSlotLabel = matched.label;
        selectedTime = matched.label;
      } else if (/^\d{2}:\d{2}$/.test(normalized)) {
        selectedTime = normalized;
      }
    }
    const requestedGuests = new URLSearchParams(window.location.search).get("guests");
    if (requestedGuests && /^\d+$/.test(requestedGuests)) {
      const parsedGuests = Number(requestedGuests);
      if (parsedGuests >= 1 && parsedGuests <= 6) {
        selectedGuests = parsedGuests;
      }
    }

    applySelection(selected);
    updateTimeSlotsVisual();
    renderDatePicker();
    applySummarySticky();
    calendarContainer?.addEventListener("click", onCalendarClick);
    window.addEventListener("resize", applySummarySticky);

    const timeClickHandlers = timeSlots.map((slot) => {
      const handler = () => {
        if (slot.soldOut) {
          return;
        }
        selectedTimeSlotLabel = slot.label;
        selectedTime = slot.label;
        updateTimeSlotsVisual();
        updateSummary();
        syncQuery();
      };
      slot.element.addEventListener("click", handler);
      return { slot, handler };
    });

    const changeHandler = (event: Event) => {
      event.preventDefault();
      selectDateHeading?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    changeControl?.addEventListener("click", changeHandler);

    const onDecreaseGuests = () => {
      if (selectedGuests <= 1) {
        return;
      }
      selectedGuests -= 1;
      updateSummary();
      syncQuery();
    };
    const onIncreaseGuests = () => {
      if (selectedGuests >= 6) {
        return;
      }
      selectedGuests += 1;
      updateSummary();
      syncQuery();
    };
    const onContinueClick = (event: Event) => {
      if (!selectedTimeSlotLabel) {
        event.preventDefault();
      }
    };
    guestDecreaseButton?.addEventListener("click", onDecreaseGuests);
    guestIncreaseButton?.addEventListener("click", onIncreaseGuests);
    continueControl?.addEventListener("click", onContinueClick);

    return () => {
      clickHandlers.forEach(({ card, handler }) => {
        card.removeEventListener("click", handler);
      });
      hoverHandlers.forEach(({ card, enter, leave }) => {
        card.removeEventListener("mouseenter", enter);
        card.removeEventListener("mouseleave", leave);
      });
      timeClickHandlers.forEach(({ slot, handler }) => {
        slot.element.removeEventListener("click", handler);
      });
      calendarContainer?.removeEventListener("click", onCalendarClick);
      window.removeEventListener("resize", applySummarySticky);
      changeControl?.removeEventListener("click", changeHandler);
      guestDecreaseButton?.removeEventListener("click", onDecreaseGuests);
      guestIncreaseButton?.removeEventListener("click", onIncreaseGuests);
      continueControl?.removeEventListener("click", onContinueClick);
    };
  }, [enabled]);

  return null;
}
