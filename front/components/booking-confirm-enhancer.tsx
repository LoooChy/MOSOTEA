"use client";

import { useEffect } from "react";
import {
  INPUT_ERROR_CLASS,
  INPUT_NEUTRAL_CLASS,
  INPUT_VALID_CLASS,
  sanitizeEmail,
  sanitizeFullName,
  sanitizePhone,
  validateEmail,
  validateFullName,
  validatePhone,
  ValidationResult,
} from "@/lib/booking-contact";
import {
  buildBookingHref,
  EXPERIENCE_META,
  formatDateTimeSummary,
  formatMoney,
  parseBookingFlow,
} from "@/lib/booking-flow";

type BookingConfirmEnhancerProps = {
  enabled: boolean;
};

type FieldUi = {
  input: HTMLInputElement;
  icon: HTMLDivElement;
  message: HTMLParagraphElement;
};

function applyFieldState(
  ui: FieldUi,
  result: ValidationResult,
  shouldShowError: boolean,
  hasValue: boolean
) {
  if (result.valid && hasValue) {
    ui.input.className = INPUT_VALID_CLASS;
    ui.icon.className =
      "absolute right-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim";
    ui.icon.innerHTML =
      "<span class=\"material-symbols-outlined text-xl\" style=\"font-variation-settings: 'FILL' 1;\">check_circle</span>";
    ui.message.className = "mt-2 text-sm text-error font-body italic hidden";
    ui.message.textContent = "";
    return;
  }

  if (!result.valid && shouldShowError) {
    ui.input.className = INPUT_ERROR_CLASS;
    ui.icon.className = "absolute right-4 top-1/2 -translate-y-1/2 text-error";
    ui.icon.innerHTML =
      "<span class=\"material-symbols-outlined text-xl\" style=\"font-variation-settings: 'FILL' 1;\">error</span>";
    ui.message.className =
      "mt-2 text-sm text-error font-body italic flex items-center gap-1";
    ui.message.textContent = result.message;
    return;
  }

  ui.input.className = INPUT_NEUTRAL_CLASS;
  ui.icon.className = "absolute right-4 top-1/2 -translate-y-1/2 hidden";
  ui.icon.innerHTML = "";
  ui.message.className = "mt-2 text-sm text-error font-body italic hidden";
  ui.message.textContent = "";
}

export function BookingConfirmEnhancer({ enabled }: BookingConfirmEnhancerProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const completedBookingRef = window.localStorage.getItem("moso:booking-completed-ref");
    if (completedBookingRef) {
      window.location.replace("/");
      return;
    }

    const flow = parseBookingFlow(window.location.search);
    const bookingRef =
      flow.bookingRef.trim().length > 0
        ? flow.bookingRef.trim()
        : `MOSO-${Date.now()}-${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")}`;
    const experience = EXPERIENCE_META[flow.experience] ?? EXPERIENCE_META.authentic;
    const dateTimeText = formatDateTimeSummary(flow.date, flow.time);

    const summaryHeading = Array.from(document.querySelectorAll("h2")).find((node) =>
      /^summary$/i.test((node.textContent ?? "").trim())
    ) as HTMLElement | undefined;
    const summaryCard = summaryHeading?.closest(".bg-surface-container-low") as
      | HTMLElement
      | null;
    if (summaryCard) {
      const experienceValue = summaryCard.querySelector(
        "h3.font-headline.text-lg.text-primary"
      ) as HTMLElement | null;
      const detailRows = Array.from(
        summaryCard.querySelectorAll(".pt-8.space-y-4 > div")
      ) as HTMLElement[];
      const dateTimeValue = detailRows[0]?.querySelector("span:last-child") as
        | HTMLElement
        | null;
      const guestsValue = detailRows[1]?.querySelector("span:last-child") as
        | HTMLElement
        | null;
      const rateValue = detailRows[2]?.querySelector("span:last-child") as
        | HTMLElement
        | null;
      const totalValue = summaryCard.querySelector(
        ".text-4xl.font-headline.text-primary"
      ) as HTMLElement | null;

      if (experienceValue) {
        experienceValue.textContent = experience.title;
      }
      if (dateTimeValue) {
        dateTimeValue.textContent = dateTimeText;
      }
      if (guestsValue) {
        guestsValue.textContent = `${flow.guests} ${flow.guests === 1 ? "Person" : "Persons"}`;
      }
      if (rateValue) {
        rateValue.textContent = `${formatMoney(experience.unitPrice)} / person`;
      }
      if (totalValue) {
        totalValue.textContent = formatMoney(experience.unitPrice * flow.guests);
      }
    }

    const guestSectionTitle = Array.from(document.querySelectorAll("h2")).find((node) =>
      /guest information/i.test(node.textContent ?? "")
    ) as HTMLElement | undefined;
    const section = guestSectionTitle?.closest("section");
    const form = section?.querySelector("form") as HTMLElement | null;
    if (!form) {
      return;
    }

    form.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="group">
          <label class="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3" for="confirm_full_name">Full Name</label>
          <div class="relative">
            <input id="confirm_full_name" type="text" maxlength="30" placeholder="Li Wei" class="${INPUT_NEUTRAL_CLASS}" />
            <div data-field-icon="full_name" class="absolute right-4 top-1/2 -translate-y-1/2 hidden"></div>
          </div>
          <p data-field-message="full_name" class="mt-2 text-sm text-error font-body italic hidden"></p>
        </div>
        <div class="group">
          <label class="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3" for="confirm_email">Email Address</label>
          <div class="relative">
            <input id="confirm_email" type="email" placeholder="wei@presence.com" class="${INPUT_NEUTRAL_CLASS}" />
            <div data-field-icon="email" class="absolute right-4 top-1/2 -translate-y-1/2 hidden"></div>
          </div>
          <p data-field-message="email" class="mt-2 text-sm text-error font-body italic hidden"></p>
        </div>
      </div>
      <div class="group">
        <label class="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3" for="confirm_phone">Phone Number</label>
        <div class="relative">
          <input id="confirm_phone" type="tel" inputmode="numeric" pattern="[0-9]*" placeholder="0212345678" class="${INPUT_NEUTRAL_CLASS}" />
          <div data-field-icon="phone" class="absolute right-4 top-1/2 -translate-y-1/2 hidden"></div>
        </div>
        <p data-field-message="phone" class="mt-2 text-sm text-error font-body italic hidden"></p>
      </div>
      <div class="group">
        <label class="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3" for="confirm_notes">Special Requirements (Dietary, Accessibility, etc.)</label>
        <textarea id="confirm_notes" rows="4" placeholder="Please let us know if you have any tea sensitivities or require floor-seating adjustments..." class="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/20 focus:ring-0 focus:border-primary-container p-4 rounded-lg font-body text-on-surface transition-all duration-300 resize-none"></textarea>
      </div>
    `;

    const fullNameInput = form.querySelector("#confirm_full_name") as HTMLInputElement | null;
    const emailInput = form.querySelector("#confirm_email") as HTMLInputElement | null;
    const phoneInput = form.querySelector("#confirm_phone") as HTMLInputElement | null;
    const notesInput = form.querySelector("#confirm_notes") as HTMLTextAreaElement | null;
    const fullNameIcon = form.querySelector(
      "[data-field-icon='full_name']"
    ) as HTMLDivElement | null;
    const emailIcon = form.querySelector("[data-field-icon='email']") as HTMLDivElement | null;
    const phoneIcon = form.querySelector("[data-field-icon='phone']") as HTMLDivElement | null;
    const fullNameMessage = form.querySelector(
      "[data-field-message='full_name']"
    ) as HTMLParagraphElement | null;
    const emailMessage = form.querySelector(
      "[data-field-message='email']"
    ) as HTMLParagraphElement | null;
    const phoneMessage = form.querySelector(
      "[data-field-message='phone']"
    ) as HTMLParagraphElement | null;

    if (
      !fullNameInput ||
      !emailInput ||
      !phoneInput ||
      !notesInput ||
      !fullNameIcon ||
      !emailIcon ||
      !phoneIcon ||
      !fullNameMessage ||
      !emailMessage ||
      !phoneMessage
    ) {
      return;
    }

    fullNameInput.value = flow.fullName;
    emailInput.value = flow.email;
    phoneInput.value = flow.phone;
    notesInput.value = flow.notes;

    const fullNameUi: FieldUi = {
      input: fullNameInput,
      icon: fullNameIcon,
      message: fullNameMessage,
    };
    const emailUi: FieldUi = {
      input: emailInput,
      icon: emailIcon,
      message: emailMessage,
    };
    const phoneUi: FieldUi = {
      input: phoneInput,
      icon: phoneIcon,
      message: phoneMessage,
    };

    const confirmControls = Array.from(
      document.querySelectorAll<HTMLElement>("a[role='button'], a, button")
    ).filter((node) => /confirm booking/i.test(node.textContent ?? ""));
    const touched = {
      fullName: false,
      email: false,
      phone: false,
    };

    const setConfirmEnabled = (isEnabled: boolean) => {
      confirmControls.forEach((control) => {
        control.classList.toggle("opacity-50", !isEnabled);
        control.classList.toggle("cursor-not-allowed", !isEnabled);
        control.classList.toggle("pointer-events-none", !isEnabled);
        control.setAttribute("aria-disabled", isEnabled ? "false" : "true");
        if (control instanceof HTMLButtonElement) {
          control.disabled = !isEnabled;
        }
      });
    };

    const syncConfirmHref = () => {
      const nextFlow = {
        ...flow,
        bookingRef,
        fullName: fullNameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        notes: notesInput.value,
      };
      const href = buildBookingHref("/booking/success", nextFlow);
      confirmControls.forEach((control) => {
        if (control instanceof HTMLAnchorElement) {
          control.href = href;
        }
      });
    };

    const validateForm = (showAllErrors: boolean): boolean => {
      const fullNameValue = fullNameInput.value;
      const emailValue = emailInput.value.trim();
      const phoneValue = phoneInput.value;
      const fullNameResult = validateFullName(fullNameValue);
      const emailResult = validateEmail(emailValue);
      const phoneResult = validatePhone(phoneValue);

      applyFieldState(
        fullNameUi,
        fullNameResult,
        showAllErrors || touched.fullName,
        fullNameValue.trim().length > 0
      );
      applyFieldState(
        emailUi,
        emailResult,
        showAllErrors || touched.email,
        emailValue.length > 0
      );
      applyFieldState(
        phoneUi,
        phoneResult,
        showAllErrors || touched.phone,
        phoneValue.length > 0
      );

      const isValid = fullNameResult.valid && emailResult.valid && phoneResult.valid;
      setConfirmEnabled(isValid);
      syncConfirmHref();
      return isValid;
    };

    const onFullNameInput = () => {
      const next = sanitizeFullName(fullNameInput.value);
      if (next !== fullNameInput.value) {
        fullNameInput.value = next;
      }
      validateForm(false);
    };
    const onEmailInput = () => {
      const next = sanitizeEmail(emailInput.value);
      if (next !== emailInput.value) {
        emailInput.value = next;
      }
      validateForm(false);
    };
    const onPhoneInput = () => {
      const next = sanitizePhone(phoneInput.value);
      if (next !== phoneInput.value) {
        phoneInput.value = next;
      }
      validateForm(false);
    };
    const onNotesInput = () => {
      syncConfirmHref();
    };

    const onFullNameBlur = () => {
      touched.fullName = true;
      validateForm(false);
    };
    const onEmailBlur = () => {
      touched.email = true;
      validateForm(false);
    };
    const onPhoneBlur = () => {
      touched.phone = true;
      validateForm(false);
    };

    const onConfirmClick = (event: Event) => {
      touched.fullName = true;
      touched.email = true;
      touched.phone = true;
      const isValid = validateForm(true);
      if (!isValid) {
        event.preventDefault();
        return;
      }

      const currentTarget = event.currentTarget as HTMLElement | null;
      if (currentTarget instanceof HTMLAnchorElement && currentTarget.href) {
        // Use replace to prevent navigating back to confirm and resubmitting quickly.
        event.preventDefault();
        window.location.replace(currentTarget.href);
      }
    };

    fullNameInput.addEventListener("input", onFullNameInput);
    emailInput.addEventListener("input", onEmailInput);
    phoneInput.addEventListener("input", onPhoneInput);
    notesInput.addEventListener("input", onNotesInput);
    fullNameInput.addEventListener("blur", onFullNameBlur);
    emailInput.addEventListener("blur", onEmailBlur);
    phoneInput.addEventListener("blur", onPhoneBlur);
    confirmControls.forEach((control) => control.addEventListener("click", onConfirmClick));

    validateForm(false);

    return () => {
      fullNameInput.removeEventListener("input", onFullNameInput);
      emailInput.removeEventListener("input", onEmailInput);
      phoneInput.removeEventListener("input", onPhoneInput);
      notesInput.removeEventListener("input", onNotesInput);
      fullNameInput.removeEventListener("blur", onFullNameBlur);
      emailInput.removeEventListener("blur", onEmailBlur);
      phoneInput.removeEventListener("blur", onPhoneBlur);
      confirmControls.forEach((control) =>
        control.removeEventListener("click", onConfirmClick)
      );
    };
  }, [enabled]);

  return null;
}
