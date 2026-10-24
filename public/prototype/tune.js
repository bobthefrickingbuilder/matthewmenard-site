// Prototype only: read timing overrides from the URL, run the intro, and fill the tuning form.
// Submitting the form reloads with ?intro&KEY=value…, which replays the intro with those values.

import { TIMING, runIntro } from "./intro.js";

const params = new URLSearchParams(location.search);
const overrides = {};
for (const [key, fallback] of Object.entries(TIMING)) {
  if (!params.has(key)) continue;
  const value = params.get(key);
  if (typeof fallback === "number") {
    if (value !== "" && Number.isFinite(Number(value))) overrides[key] = Number(value);
  } else if (value) {
    overrides[key] = value;
  }
}

runIntro(overrides);

const fields = document.querySelector("[data-tune-fields]");
if (fields) {
  for (const [key, fallback] of Object.entries(TIMING)) {
    const field = document.createElement("div");
    field.className = "field";
    const id = `tune-${key}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = key;
    const input = document.createElement("input");
    input.className = "input";
    input.id = id;
    input.name = key;
    input.value = overrides[key] ?? fallback;
    if (typeof fallback === "number") {
      input.type = "number";
      input.step = "any";
      input.inputMode = "decimal";
    }
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = `Default: ${fallback}`;
    field.append(label, input, hint);
    fields.append(field);
  }
}
