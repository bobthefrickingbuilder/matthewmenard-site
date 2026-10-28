// "Request a change" button for website clients' own sites. Paste this on every page of a client's site:
//   <script src="https://www.matthewmenardmusic.com/js/request-button.js" defer></script>
// Visitors never see it. It shows only in a browser where the client has opened their site once with
// ?requests=on (their request page gives them that link); ?requests=off hides it again.
// It opens their request page here, which remembers their private link (public/js/alterations.js).

(() => {
  const FLAG = "mm-requests";
  const choice = new URLSearchParams(location.search).get("requests");
  try {
    if (choice === "on") localStorage.setItem(FLAG, "1");
    if (choice === "off") localStorage.removeItem(FLAG);
    if (localStorage.getItem(FLAG) !== "1") return;
  } catch {
    return;
  }

  function add() {
    const link = document.createElement("a");
    link.href = "https://www.matthewmenardmusic.com/alterations";
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Request a change";
    link.title = "Only you see this button. Send Matthew a change for this website.";
    Object.assign(link.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      zIndex: "2147483647",
      padding: "10px 16px",
      borderRadius: "999px",
      background: "#1f3d33",
      color: "#ffffff",
      font: "600 15px/1.2 system-ui, -apple-system, 'Segoe UI', sans-serif",
      textDecoration: "none",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
    });
    link.addEventListener("focus", () => (link.style.outline = "3px solid #e2a76f"));
    link.addEventListener("blur", () => (link.style.outline = ""));
    document.body.append(link);
  }

  if (document.body) add();
  else document.addEventListener("DOMContentLoaded", add);
})();
