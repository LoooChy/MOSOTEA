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

type BookingValidateEnhancerProps = {
  enabled: boolean;
};

type FieldUi = {
  input: HTMLInputElement;
  icon: HTMLDivElement;
  message: HTMLParagraphElement;
};

function buildContactHint(totalGuests: number): string {
  return `当前填写：1 位联系人信息（对应 ${totalGuests} 位客人）`;
}

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

export function BookingValidateEnhancer({ enabled }: BookingValidateEnhancerProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const flow = parseBookingFlow(window.location.search);
    const experience = EXPERIENCE_META[flow.experience] ?? EXPERIENCE_META.authentic;
    const dateTimeText = formatDateTimeSummary(flow.date, flow.time);

    const summaryTitle = Array.from(document.querySelectorAll("h2")).find((node) =>
      /reservation summary/i.test(node.textContent ?? "")
    ) as HTMLElement | undefined;
    const summaryRoot = summaryTitle?.closest(".relative.z-10") as HTMLElement | null;
    if (summaryRoot) {
      const ritualValue = summaryRoot.querySelector(
        ".space-y-6 > div:nth-child(1) .font-headline.text-lg.text-primary"
      ) as HTMLElement | null;
      const dateTimeValue = summaryRoot.querySelector(
        ".space-y-6 > div:nth-child(2) .font-headline.text-lg.text-primary"
      ) as HTMLElement | null;
      const guestsValue = summaryRoot.querySelector(
        ".space-y-6 > div:nth-child(3) .font-headline.text-lg.text-primary"
      ) as HTMLElement | null;
      const totalValue = summaryRoot.querySelector(
        ".mt-12.pt-8 .font-headline.text-2xl"
      ) as HTMLElement | null;

      if (ritualValue) {
        ritualValue.textContent = experience.title;
      }
      if (dateTimeValue) {
        dateTimeValue.textContent = dateTimeText;
      }
      if (guestsValue) {
        guestsValue.textContent = `${flow.guests} ${flow.guests === 1 ? "Traveler" : "Travelers"}`;
      }
      if (totalValue) {
        totalValue.textContent = formatMoney(experience.unitPrice * flow.guests);
      }
    }

    const guestSectionTitle = Array.from(document.querySelectorAll("h1")).find((node) =>
      /guest information/i.test(node.textContent ?? "")
    ) as HTMLElement | undefined;
    const section = guestSectionTitle?.closest("section");
    const form = section?.querySelector("form") as HTMLElement | null;
    if (!form) {
      return;
    }

    const submitBlock = form.querySelector(".pt-6") as HTMLElement | null;
    form.innerHTML = `
      <div class="group">
        <label class="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3" for="contact_full_name">Full Name</label>
        <div class="relative">
          <input id="contact_full_name" type="text" maxlength="30" placeholder="E.g. Mei Ling" class="${INPUT_NEUTRAL_CLASS}" />
          <div data-field-icon="full_name" class="absolute right-4 top-1/2 -translate-y-1/2 hidden"></div>
        </div>
        <p data-field-message="full_name" class="mt-2 text-sm text-error font-body italic hidden"></p>
      </div>
      <div class="group">
        <label class="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3" for="contact_email">Email Address</label>
        <div class="relative">
          <input id="contact_email" type="email" placeholder="name@domain.com" class="${INPUT_NEUTRAL_CLASS}" />
          <div data-field-icon="email" class="absolute right-4 top-1/2 -translate-y-1/2 hidden"></div>
        </div>
        <p data-field-message="email" class="mt-2 text-sm text-error font-body italic hidden"></p>
      </div>
      <div class="group">
        <label class="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3" for="contact_phone">Phone Number</label>
        <div class="relative">
          <input id="contact_phone" type="tel" inputmode="numeric" pattern="[0-9]*" placeholder="0212345678" class="${INPUT_NEUTRAL_CLASS}" />
          <div data-field-icon="phone" class="absolute right-4 top-1/2 -translate-y-1/2 hidden"></div>
        </div>
        <p data-field-message="phone" class="mt-2 text-sm text-error font-body italic hidden"></p>
      </div>
      <div class="group">
        <label class="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3" for="contact_notes">Ritual Preferences (Optional)</label>
        <textarea id="contact_notes" rows="4" placeholder="Please mention any dietary requirements or preferences for your session..." class="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/20 focus:ring-0 focus:border-primary-container p-4 rounded-lg font-body text-on-surface transition-all duration-300 resize-none"></textarea>
      </div>
    `;
    if (submitBlock) {
      form.appendChild(submitBlock);
    }

    const fullNameInput = form.querySelector("#contact_full_name") as HTMLInputElement | null;
    const emailInput = form.querySelector("#contact_email") as HTMLInputElement | null;
    const phoneInput = form.querySelector("#contact_phone") as HTMLInputElement | null;
    const notesInput = form.querySelector("#contact_notes") as HTMLTextAreaElement | null;
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

    const proceedControls = (
      submitBlock
        ? Array.from(submitBlock.querySelectorAll<HTMLElement>("a[role='button'], a, button"))
        : []
    ).filter((node) => /proceed to confirmation/i.test(node.textContent ?? ""));
    const touched = {
      fullName: false,
      email: false,
      phone: false,
    };

    const setProceedEnabled = (isEnabled: boolean) => {
      proceedControls.forEach((control) => {
        control.classList.toggle("opacity-50", !isEnabled);
        control.classList.toggle("cursor-not-allowed", !isEnabled);
        control.classList.toggle("pointer-events-none", !isEnabled);
        control.setAttribute("aria-disabled", isEnabled ? "false" : "true");
        if (control instanceof HTMLButtonElement) {
          control.disabled = !isEnabled;
        }
      });
    };

    const syncProceedHref = () => {
      const nextFlow = {
        ...flow,
        fullName: fullNameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        notes: notesInput.value,
      };
      const href = buildBookingHref("/booking/confirm", nextFlow);
      proceedControls.forEach((control) => {
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
      setProceedEnabled(isValid);
      syncProceedHref();
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
      syncProceedHref();
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

    const onProceedClick = (event: Event) => {
      touched.fullName = true;
      touched.email = true;
      touched.phone = true;
      if (!validateForm(true)) {
        event.preventDefault();
      }
    };

    fullNameInput.addEventListener("input", onFullNameInput);
    emailInput.addEventListener("input", onEmailInput);
    phoneInput.addEventListener("input", onPhoneInput);
    notesInput.addEventListener("input", onNotesInput);
    fullNameInput.addEventListener("blur", onFullNameBlur);
    emailInput.addEventListener("blur", onEmailBlur);
    phoneInput.addEventListener("blur", onPhoneBlur);
    proceedControls.forEach((control) => control.addEventListener("click", onProceedClick));

    validateForm(false);

    return () => {
      fullNameInput.removeEventListener("input", onFullNameInput);
      emailInput.removeEventListener("input", onEmailInput);
      phoneInput.removeEventListener("input", onPhoneInput);
      notesInput.removeEventListener("input", onNotesInput);
      fullNameInput.removeEventListener("blur", onFullNameBlur);
      emailInput.removeEventListener("blur", onEmailBlur);
      phoneInput.removeEventListener("blur", onPhoneBlur);
      proceedControls.forEach((control) =>
        control.removeEventListener("click", onProceedClick)
      );
    };
  }, [enabled]);

  return null;
}
