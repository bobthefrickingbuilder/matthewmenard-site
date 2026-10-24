import { runIntro } from "/js/intro.js";
import "/js/performances.js";

runIntro();

// Photo strip arrows. Without JS the strip still scrolls sideways by touch, trackpad, or keyboard.
const strip = document.querySelector(".strip");
const buttons = [...document.querySelectorAll("[data-strip]")];
if (strip && buttons.length) {
  const update = () => {
    const max = strip.scrollWidth - strip.clientWidth - 2;
    buttons[0].disabled = strip.scrollLeft <= 2;
    buttons[1].disabled = strip.scrollLeft >= max;
  };
  for (const button of buttons) {
    button.hidden = false;
    button.addEventListener("click", () => {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      strip.scrollBy({ left: Number(button.dataset.strip) * strip.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
    });
  }
  strip.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
}
