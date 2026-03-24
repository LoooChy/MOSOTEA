"use client";

import { FormEvent, useEffect, useState } from "react";
import { ADMIN_AUTH_COOKIE_KEY, ADMIN_AUTH_STORAGE_KEY } from "@/lib/admin-auth";
import { ADMIN_DEFAULT_AUTH_PATH } from "@/lib/design-routes";

function isAuthenticated(): boolean {
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "1";
}

function markAuthenticated() {
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "1");
  document.cookie = `${ADMIN_AUTH_COOKIE_KEY}=1; Path=/; Max-Age=2592000; SameSite=Lax`;
}

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      window.location.replace(ADMIN_DEFAULT_AUTH_PATH);
      return;
    }
    setReady(true);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const account = username.trim();
    const passwordValue = password.trim();
    if (account.length === 0 || passwordValue.length === 0) {
      setError("Please enter account and password.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: account, password: passwordValue }),
      });
      if (!response.ok) {
        let message = "Invalid account or password.";
        try {
          const payload = (await response.json()) as { error?: unknown };
          if (typeof payload.error === "string" && payload.error.trim().length > 0) {
            message = payload.error;
          }
        } catch {
          // Keep default message.
        }
        setError(message);
        return;
      }
      markAuthenticated();
      window.location.replace(ADMIN_DEFAULT_AUTH_PATH);
    } catch {
      setError("Unable to login right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return null;
  }

  const hasError = Boolean(error);
  const inputErrorClass = hasError ? "ring-1 ring-error/40 bg-error-container/50" : "";

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary-fixed-dim selection:text-primary min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img
          alt=""
          className="w-full h-full object-cover scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoCI1jUL3IAjrrZ6__94iHfa7GOIVkM1gN2vmjZdTKy2aVGKz8OdZwqcujYb_exiRFqYVXEQCtZflD4aCVqLCyURaM3NhsZFiTNGO4OM3VkVAW7y68rXSLElUnFM-YtPEokOGEIYg6cwstQapcwhABKwVEl0a1JjhfcnWdjnDJAmfIvDwyEefXlfUT_1s7_GdPjTa2IlKOhlsBIH268nKJy7f-4K1l7J5e3BnN1wEnKEkpmWNujd1gvxZYiJubxcM-p2yLI41UcBuK"
        />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-grain pointer-events-none" />
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-on-surface/5 overflow-hidden flex flex-col items-center">
          <div className="w-full pt-12 pb-8 px-10 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container/10">
              <span className="material-symbols-outlined text-primary text-3xl">spa</span>
            </div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-primary mb-2">
              Sanctuary Admin
            </h1>
            <p className="font-body text-sm text-secondary tracking-widest uppercase">MOSO TEA</p>
          </div>

          <form className="w-full px-10 pb-12 space-y-8" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label
                className="font-label text-xs uppercase tracking-[0.15em] text-secondary font-semibold ml-1"
                htmlFor="username"
              >
                Account
              </label>
              <div className="relative group">
                <input
                  id="username"
                  className={`w-full bg-surface-container-low border-none rounded-lg py-4 pl-4 pr-12 text-on-surface font-body focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-highest transition-all duration-300 placeholder:text-outline-variant/60 ${inputErrorClass}`}
                  placeholder="mosotea"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (error) {
                      setError(null);
                    }
                  }}
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">
                  alternate_email
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  className="font-label text-xs uppercase tracking-[0.15em] text-secondary font-semibold"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="text-[10px] uppercase tracking-wider text-secondary/60 hover:text-primary transition-colors font-semibold"
                  href="#"
                  onClick={(event) => event.preventDefault()}
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <input
                  id="password"
                  className={`w-full bg-surface-container-low border-none rounded-lg py-4 pl-4 pr-12 text-on-surface font-body focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-highest transition-all duration-300 placeholder:text-outline-variant/60 ${inputErrorClass}`}
                  placeholder="••••••••••"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) {
                      setError(null);
                    }
                  }}
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">
                  lock
                </span>
              </div>
            </div>

            {error ? (
              <p className="text-xs text-error font-label tracking-wide px-1">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold tracking-widest uppercase text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-1px] transition-all duration-500 ease-out-expo active:scale-[0.98] ${
                submitting ? "opacity-70 pointer-events-none" : ""
              }`}
            >
              Enter Sanctuary
            </button>
          </form>

          <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div className="py-6 text-center">
            <p className="text-[10px] font-label uppercase tracking-[0.2em] text-secondary/40">
              © 2024 MOSO TEA. A New Zealand &amp; Taiwan Collaboration.
            </p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-12 right-12 z-0 opacity-10 mix-blend-multiply pointer-events-none">
        <span className="material-symbols-outlined text-[12rem]">energy_savings_leaf</span>
      </div>
    </div>
  );
}
