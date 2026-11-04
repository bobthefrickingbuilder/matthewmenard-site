// "Copy" buttons: data-copy="id" copies that element's text. The button stays hidden without
// JavaScript or clipboard access, since it could not work.

// Older browsers and some embedded ones refuse the Clipboard API; copying a selection still works.
function legacyCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.className = "visually-hidden";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

for (const button of document.querySelectorAll("[data-copy]")) {
  const source = document.getElementById(button.dataset.copy);
  const wrap = button.closest("[data-copy-wrap]") || button;
  const status = wrap.querySelector("[data-copy-status]");
  if (!source || !navigator.clipboard) continue;
  wrap.hidden = false;

  let timer;
  button.addEventListener("click", async () => {
    const text = source.textContent.trim().replace(/\s+/g, " ");
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = legacyCopy(text);
    }
    if (status) status.textContent = copied ? "Copied." : "Could not copy. Select the text and copy it instead.";
    clearTimeout(timer);
    timer = setTimeout(() => { if (status) status.textContent = ""; }, 3000);
  });
}
