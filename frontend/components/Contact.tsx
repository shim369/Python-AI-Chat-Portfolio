"use client";

import { useRef, useState, type FormEvent } from "react";
import { RECAPTCHA_SITE_KEY } from "@/lib/config";
import { useI18n } from "@/lib/i18n";

const API_URL = "/api/contact";
// サーバー（app/contact.py の RECAPTCHA_ACTION）と揃える
const RECAPTCHA_ACTION = "contact";
// サーバー（app/schemas.py）と同じ上限
const LIMITS = { name: 100, email: 254, message: 2000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// サーバーが返すエラーコードのうち、特定の入力欄に表示するもの
const FIELD_OF_CODE: Record<string, FieldName> = {
  name_required: "name",
  name_too_long: "name",
  email_required: "email",
  invalid_email: "email",
  message_required: "message",
  message_too_long: "message",
};

type FieldName = "name" | "email" | "message";
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;
type Status = { key: string; kind: "" | "is-error" | "is-success" } | null;

declare global {
  interface Window {
    grecaptcha?: { ready: (cb: () => void) => void; execute: (key: string, opts: { action: string }) => Promise<string> };
  }
}

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name) errors.name = "contact.error.name_required";
  else if (values.name.length > LIMITS.name) errors.name = "contact.error.name_too_long";
  if (!values.email) errors.email = "contact.error.email_required";
  else if (values.email.length > LIMITS.email || !EMAIL_PATTERN.test(values.email)) errors.email = "contact.error.invalid_email";
  if (!values.message) errors.message = "contact.error.message_required";
  else if (values.message.length > LIMITS.message) errors.message = "contact.error.message_too_long";
  return errors;
}

// reCAPTCHA は Google のスクリプトを読み込むため、フォームを操作し始めたときに初めて読み込む
let recaptchaPromise: Promise<NonNullable<Window["grecaptcha"]> | null> | null = null;

function loadRecaptcha() {
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve(null);
  if (!recaptchaPromise) {
    recaptchaPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
      script.async = true;
      script.onload = () => window.grecaptcha!.ready(() => resolve(window.grecaptcha!));
      script.onerror = () => {
        // 次の送信時に読み込みをやり直せるようにする
        recaptchaPromise = null;
        script.remove();
        reject(new Error("failed to load reCAPTCHA"));
      };
      document.head.append(script);
    });
  }
  return recaptchaPromise;
}

export default function Contact() {
  const { t, lang } = useI18n();
  const [values, setValues] = useState<Values>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  // reCAPTCHA の読み込みはフォームに触れたときに始める
  const warm = () => void loadRecaptcha().catch(() => {});

  const update = (name: FieldName, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    // 入力し直したら、その欄のエラーを消す
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed: Values = { name: values.name.trim(), email: values.email.trim(), message: values.message.trim() };
    const found = validate(trimmed);
    setErrors(found);
    setStatus(null);
    const firstInvalid = (["name", "email", "message"] as FieldName[]).find((n) => found[n]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    setBusy(true);
    setStatus({ key: "contact.sending", kind: "" });
    let token = "";
    try {
      const grecaptcha = await loadRecaptcha();
      if (grecaptcha) token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION });
    } catch {
      setBusy(false);
      setStatus({ key: "contact.error.recaptcha_load", kind: "is-error" });
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trimmed, recaptcha_token: token, lang }),
      });
      if (res.ok) {
        setValues({ name: "", email: "", message: "" });
        setStatus({ key: "contact.success", kind: "is-success" });
        return;
      }
      const data = await res.json().catch(() => ({}));
      const code: string = data.code || "contact_failed";
      const field = FIELD_OF_CODE[code];
      if (field) {
        setErrors({ [field]: `contact.error.${code}` });
        setStatus(null);
        refs[field].current?.focus();
      } else {
        const key = `contact.error.${code}`;
        setStatus({ key: t(key) === key ? "contact.error.contact_failed" : key, kind: "is-error" });
      }
    } catch {
      setStatus({ key: "contact.error.network", kind: "is-error" });
    } finally {
      setBusy(false);
    }
  }


  const err = (name: FieldName) => (errors[name] ? t(errors[name]!) : "");

  return (
    <section id="contact" className="section">
      <div className="container contact-grid">
        <div className="contact-intro">
          <p className="eyebrow"><b data-kan="五">05</b><span>{t("nav.contact")}</span></p>
          <h2 className="section-title">{t("contact.heading")}</h2>
          <p className="section-lead">{t("contact.lead")}</p>
        </div>
        <form className="contact-form" id="contact-form" noValidate onSubmit={onSubmit} onFocus={warm}>
          <div className="field">
            <label htmlFor="contact-name">{t("contact.name")}</label>
            <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={100} required ref={refs.name}
              value={values.name} onChange={(e) => update("name", e.target.value)}
              aria-describedby="contact-name-error" aria-invalid={Boolean(errors.name)} />
            <p className="field-error" id="contact-name-error">{err("name")}</p>
          </div>
          <div className="field">
            <label htmlFor="contact-email">{t("contact.email")}</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required ref={refs.email}
              value={values.email} onChange={(e) => update("email", e.target.value)}
              aria-describedby="contact-email-error" aria-invalid={Boolean(errors.email)} />
            <p className="field-error" id="contact-email-error">{err("email")}</p>
          </div>
          <div className="field">
            <label htmlFor="contact-message">{t("contact.message")}</label>
            <textarea id="contact-message" name="message" rows={6} maxLength={2000} required ref={refs.message}
              value={values.message} onChange={(e) => update("message", e.target.value)}
              aria-describedby="contact-message-error" aria-invalid={Boolean(errors.message)} />
            <p className="field-error" id="contact-message-error">{err("message")}</p>
          </div>
          <div className="contact-actions">
            <button type="submit" className="btn btn-primary" id="contact-submit" disabled={busy}>{t("contact.submit")}</button>
            <p className={`contact-status ${status?.kind ?? ""}`} id="contact-status" role="status">{status ? t(status.key) : ""}</p>
          </div>
          {/* reCAPTCHA のバッジはチャットボタンと重なるため非表示にし、代わりに Google の規定の文言を表示する */}
          <p className="recaptcha-note">
            <span>{t("contact.recaptcha1")}</span>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">{t("contact.privacy")}</a>
            <span>{t("contact.recaptcha2")}</span>
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener">{t("contact.terms")}</a>
            <span>{t("contact.recaptcha3")}</span>
          </p>
        </form>
      </div>
    </section>
  );
}
