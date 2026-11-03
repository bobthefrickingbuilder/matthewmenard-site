// Teaching: the one-time coffee form. Shows the custom amount box only for "More",
// and keeps the button label in step ("Give $10 once"). Without JavaScript the form still works.

const form = document.querySelector("[data-once]");

if (form) {
  const custom = form.querySelector("[data-custom]");
  const input = custom.querySelector("input");
  const button = form.querySelector("[data-once-button]");
  custom.querySelector("label").textContent = "Amount (CAD)";

  const update = () => {
    const choice = form.querySelector('input[name="amount"]:checked')?.value;
    const more = choice === "more";
    custom.hidden = !more;
    input.required = more;
    const dollars = more ? Number(input.value) : Number(choice);
    button.textContent = dollars > 0 ? `Give $${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)} once` : "Give once";
  };

  form.addEventListener("change", update);
  input.addEventListener("input", update);
  form.addEventListener("change", (event) => {
    if (event.target.value === "more") input.focus();
  });
  update();
}
