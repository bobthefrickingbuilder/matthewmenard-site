// Full-screen mobile menu: open/close, focus trap, Escape, scroll lock.
// Without JS the header nav stays visible and wraps (see .no-js in components.css).
// Also loads the site-wide motion layer.
import "/js/motion.js";
import "/js/palette-preview.js";

const toggle = document.querySelector("[data-menu-open]");
const menu = document.getElementById("mobile-menu");

if (toggle && menu) {
  const closeButton = menu.querySelector("[data-menu-close]");
  const focusable = () => menu.querySelectorAll("a[href], button:not([disabled])");

  function open() {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeButton.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function close() {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    toggle.focus();
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusable();
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toggle.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
}
