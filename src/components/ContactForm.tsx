"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import styles from "./Site.module.scss";

const fields = ["name", "email", "phone", "company", "message"] as const;
const subscribeHydration = () => () => {};
type Field = (typeof fields)[number];
const limits = {
  name: 120,
  email: 254,
  phone: 40,
  company: 120,
  message: 3000,
};
const labels = {
  name: "Nome completo",
  email: "E-mail",
  phone: "Telefone / WhatsApp",
  company: "Empresa (opcional)",
  message: "Mensagem",
};
const placeholders = {
  name: "Seu nome",
  email: "seu e-mail",
  phone: "seu telefone",
  company: "seu empresa (opcional)",
  message: "qual é o seu objetivo?",
};
function validate(values: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {};
  for (const key of fields) {
    const value = values[key].trim();
    if (!value && key !== "company") errors[key] = "Preencha este campo.";
    else if ([...value].length > limits[key])
      errors[key] = `Use até ${limits[key]} caracteres.`;
    else if (
      value &&
      ((key === "name" && [...value].length < 2) ||
        (key === "message" && [...value].length < 10))
    )
      errors[key] = "Informe mais detalhes.";
    else if (
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]|<[^>]*>/u.test(value)
    )
      errors[key] = "Use somente texto.";
    else if (
      key === "email" &&
      !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value)
    )
      errors[key] = "Informe um e-mail válido.";
    else if (
      key === "phone" &&
      (!/^\+?[0-9 ()-]+$/.test(value) ||
        !/^[0-9]{8,15}$/.test(value.replace(/\D/g, "")))
    )
      errors[key] = "Informe de 8 a 15 dígitos.";
  }
  return errors;
}
export function ContactForm({
  endpoint,
  label,
}: {
  endpoint: string;
  label: string;
}) {
  const ready = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => controller.current?.abort();
  }, []);
  function focusError(next: Partial<Record<Field, string>>) {
    const first = fields.find((field) => next[field]);
    if (first)
      (form.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const values = Object.fromEntries(
      new FormData(event.currentTarget),
    ) as Record<Field | "website", string>;
    const next = validate(values);
    setErrors(next);
    setStatus("");
    if (Object.keys(next).length) {
      focusError(next);
      return;
    }
    busy.current = true;
    setPending(true);
    setStatus("Enviando sua mensagem…");
    controller.current = new AbortController();
    const timeout = setTimeout(() => controller.current?.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.current.signal,
      });
      const result = await response.json();
      if (
        response.ok &&
        result.ok === true &&
        result.code === "CONTACT_ACCEPTED"
      ) {
        form.current?.reset();
        setStatus("Sua mensagem foi enviada. Obrigado pelo contato!");
      } else if (result.code === "VALIDATION_ERROR" && result.fieldErrors) {
        const serverErrors: Partial<Record<Field, string>> = {};
        for (const key of fields)
          if (result.fieldErrors[key])
            serverErrors[key] = "Confira o preenchimento deste campo.";
        setErrors(serverErrors);
        focusError(serverErrors);
        setStatus("Confira os campos indicados.");
      } else if (response.status === 429) {
        const seconds = Number(response.headers.get("Retry-After"));
        setStatus(
          `Limite de tentativas atingido. Tente novamente${seconds > 0 ? ` em ${Math.ceil(seconds / 60)} minuto(s)` : " mais tarde"}.`,
        );
      } else
        setStatus(
          "Não foi possível enviar agora. Seus dados foram mantidos; tente novamente mais tarde.",
        );
    } catch {
      setStatus(
        "Não foi possível confirmar o envio. Confira sua conexão e tente novamente quando estiver disponível.",
      );
    } finally {
      clearTimeout(timeout);
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <form
      ref={form}
      className={styles.form}
      method="post"
      onSubmit={submit}
      noValidate
      aria-label="Formulário de contato"
      aria-busy={pending}
    >
      <fieldset disabled={!ready || pending}>
        <legend className={styles.srOnly}>Envie sua mensagem</legend>
        <div className={styles.formGrid}>
          {fields.map((field) => (
            <div
              key={field}
              className={`${styles.formField} ${field === "email" || field === "phone" ? styles.half : ""}`}
            >
              <label htmlFor={`contact-${field}`}>{labels[field]}</label>
              {field === "message" ? (
                <textarea
                  id={`contact-${field}`}
                  name={field}
                  rows={5}
                  required
                  maxLength={limits[field]}
                  placeholder={placeholders[field]}
                  aria-invalid={Boolean(errors[field])}
                  aria-describedby={
                    errors[field] ? `error-${field}` : undefined
                  }
                />
              ) : (
                <input
                  id={`contact-${field}`}
                  name={field}
                  type={
                    field === "email"
                      ? "email"
                      : field === "phone"
                        ? "tel"
                        : "text"
                  }
                  autoComplete={
                    {
                      name: "name",
                      email: "email",
                      phone: "tel",
                      company: "organization",
                      message: "off",
                    }[field]
                  }
                  required={field !== "company"}
                  maxLength={limits[field]}
                  placeholder={placeholders[field]}
                  aria-invalid={Boolean(errors[field])}
                  aria-describedby={
                    errors[field] ? `error-${field}` : undefined
                  }
                />
              )}{" "}
              {errors[field] && (
                <p id={`error-${field}`} className={styles.fieldError}>
                  {errors[field]}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button className={styles.button} type="submit">
          {pending ? "Enviando…" : label || "Enviar mensagem"}
        </button>
      </fieldset>
      <p className={styles.formStatus} role="status" aria-live="polite">
        {status}
      </p>
      <noscript>
        <p>
          Ative o JavaScript para enviar o formulário ou utilize os canais de
          contato ao lado.
        </p>
      </noscript>
    </form>
  );
}
