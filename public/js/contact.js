// お問い合わせフォーム。reCAPTCHA v3 のトークンを付けて /api/contact に送る（メール送信はサーバー側）
(function () {
  "use strict";

  const { RECAPTCHA_SITE_KEY } = window.SITE_CONFIG;
  const { t } = window.I18N;
  const API_URL = "/api/contact";
  // サーバー（app/contact.py の RECAPTCHA_ACTION）と揃える
  const RECAPTCHA_ACTION = "contact";
  // サーバー（app/schemas.py）と同じ上限
  const LIMITS = { name: 100, email: 254, message: 2000 };
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // サーバーが返すエラーコードのうち、特定の入力欄に表示するもの
  const FIELD_OF_CODE = {
    name_required: "name",
    name_too_long: "name",
    email_required: "email",
    invalid_email: "email",
    message_required: "message",
    message_too_long: "message",
  };

  const form = document.getElementById("contact-form");
  const submit = document.getElementById("contact-submit");
  const status = document.getElementById("contact-status");
  const fields = {
    name: document.getElementById("contact-name"),
    email: document.getElementById("contact-email"),
    message: document.getElementById("contact-message"),
  };

  // 言語を切り替えたときに表示し直せるよう、表示中のメッセージはキーで持つ
  const fieldErrors = {};
  let statusKey = null;
  let statusKind = "";

  function render() {
    for (const [name, input] of Object.entries(fields)) {
      const key = fieldErrors[name];
      document.getElementById(`contact-${name}-error`).textContent = key ? t(key) : "";
      input.setAttribute("aria-invalid", String(Boolean(key)));
    }
    status.textContent = statusKey ? t(statusKey) : "";
    status.className = `contact-status ${statusKind}`;
  }

  function setStatus(key, kind = "") {
    statusKey = key;
    statusKind = kind;
    render();
  }

  function validate(values) {
    const errors = {};
    if (!values.name) errors.name = "contact.error.name_required";
    else if (values.name.length > LIMITS.name) errors.name = "contact.error.name_too_long";
    if (!values.email) errors.email = "contact.error.email_required";
    else if (values.email.length > LIMITS.email || !EMAIL_PATTERN.test(values.email)) errors.email = "contact.error.invalid_email";
    if (!values.message) errors.message = "contact.error.message_required";
    else if (values.message.length > LIMITS.message) errors.message = "contact.error.message_too_long";
    return errors;
  }

  // reCAPTCHA は Google のスクリプトを読み込むため、フォームを操作し始めたときに初めて読み込む
  let recaptchaPromise = null;

  function loadRecaptcha() {
    if (!RECAPTCHA_SITE_KEY) return Promise.resolve(null);
    if (!recaptchaPromise) {
      recaptchaPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
        script.async = true;
        script.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha));
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

  async function getToken() {
    const grecaptcha = await loadRecaptcha();
    return grecaptcha ? grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION }) : "";
  }

  function setBusy(busy) {
    submit.disabled = busy;
    if (busy) setStatus("contact.sending");
  }

  form.addEventListener("focusin", () => loadRecaptcha().catch(() => {}), { once: true });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submit.disabled) return;

    const values = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      message: fields.message.value.trim(),
    };
    for (const name of Object.keys(fields)) delete fieldErrors[name];
    Object.assign(fieldErrors, validate(values));
    setStatus(null);
    const firstInvalid = Object.keys(fields).find((name) => fieldErrors[name]);
    if (firstInvalid) {
      fields[firstInvalid].focus();
      return;
    }

    setBusy(true);
    let token;
    try {
      token = await getToken();
    } catch {
      setBusy(false);
      setStatus("contact.error.recaptcha_load", "is-error");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, recaptcha_token: token, lang: window.I18N.lang }),
      });
      if (res.ok) {
        form.reset();
        setStatus("contact.success", "is-success");
        return;
      }
      const data = await res.json().catch(() => ({}));
      const code = data.code || "contact_failed";
      if (FIELD_OF_CODE[code]) {
        fieldErrors[FIELD_OF_CODE[code]] = `contact.error.${code}`;
        setStatus(null);
        fields[FIELD_OF_CODE[code]].focus();
      } else {
        const key = `contact.error.${code}`;
        setStatus(t(key) === key ? "contact.error.contact_failed" : key, "is-error");
      }
    } catch {
      setStatus("contact.error.network", "is-error");
    } finally {
      submit.disabled = false;
    }
  });

  // 入力し直したら、その欄のエラーを消す
  for (const [name, input] of Object.entries(fields)) {
    input.addEventListener("input", () => {
      if (!fieldErrors[name]) return;
      delete fieldErrors[name];
      render();
    });
  }

  window.I18N.onChange(render);
})();
