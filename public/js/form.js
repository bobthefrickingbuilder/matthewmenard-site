// Progressive enhancement for [data-form] forms. Without JS they post normally and the server
// redirects. With JS: inline errors tied to fields, no page reload, result announced to screen readers.

const ERROR_ID = (field) => `${field.id}-error`;

function setError(form, name, message) {
  const field = form.elements[name];
  const input = field instanceof RadioNodeList ? field[0] : field;
  if (!input) return;
  const wrapper = input.closest(".field") || input.closest(".choice");
  let error = document.getElementById(ERROR_ID(input));
  if (!message) {
    input.removeAttribute("aria-invalid");
    wrapper?.classList.remove("field--error");
    error?.remove();
    input.setAttribute("aria-describedby", (input.getAttribute("aria-describedby") || "").replace(ERROR_ID(input), "").trim());
    return;
  }
  if (!error) {
    error = document.createElement("p");
    error.className = "error-message";
    error.id = ERROR_ID(input);
    if (wrapper?.classList.contains("field")) wrapper.append(error);
    else (wrapper || input).after(error);
    input.setAttribute("aria-describedby", `${input.getAttribute("aria-describedby") || ""} ${error.id}`.trim());
  }
  error.textContent = message;
  input.setAttribute("aria-invalid", "true");
  wrapper?.classList.add("field--error");
}

function messageFor(input) {
  const label = input.closest(".field, .choice")?.querySelector("label, legend")?.textContent.replace(/\(required\)/, "").trim() || "This field";
  if (input.validity.valueMissing) return input.dataset.error || `${label} is required.`;
  if (input.validity.typeMismatch && input.type === "email") return "Enter a full email address, like name@example.com.";
  if (input.validity.tooLong) return `${label} is too long.`;
  return input.validationMessage;
}

for (const form of document.querySelectorAll("[data-form]")) {
  const status = form.querySelector("[data-form-status]");
  const submit = form.querySelector('[type="submit"]');
  form.noValidate = true;
  if (form.elements.t) form.elements.t.value = Date.now();

  form.addEventListener("input", (event) => {
    if (event.target.getAttribute("aria-invalid") === "true" && event.target.checkValidity()) setError(form, event.target.name, null);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
    for (const el of form.elements) if (el.name && el.willValidate) setError(form, el.name, null);
    if (invalid.length) {
      invalid.forEach((el) => setError(form, el.name, messageFor(el)));
      status.textContent = `${invalid.length} ${invalid.length === 1 ? "field needs" : "fields need"} attention.`;
      invalid[0].focus();
      return;
    }

    submit.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const fieldErrors = Object.entries(data.errors || {}).filter(([name]) => form.elements[name]);
        fieldErrors.forEach(([name, message]) => setError(form, name, message));
        throw new Error(data.message || data.errors?.form || (fieldErrors.length ? "Check the highlighted fields." : "The form could not be sent."));
      }
      const done = document.createElement("div");
      done.className = "status status--success";
      done.tabIndex = -1;
      done.textContent = form.dataset.success || "Thank you. Your message was sent.";
      form.replaceWith(done);
      done.focus();
    } catch (error) {
      status.textContent = `${error.message} You can also email mmenardproduction@gmail.com.`;
      submit.disabled = false;
    }
  });
}
