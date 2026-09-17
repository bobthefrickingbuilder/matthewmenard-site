// Single source of truth for products, used by the serverless functions.
// Keep this in sync with the PRODUCTS object in /assets/site.js (client-side display copy).
// amount is in cents CAD.

module.exports = {
  "when-i-am-dead": {
    id: "when-i-am-dead",
    title: "When I am dead, my dearest",
    amount: 400,
    currency: "cad",
    fileUrl: "/files/when-i-am-dead.pdf",
  },
  "golden-sunset": {
    id: "golden-sunset",
    title: "The Golden Sunset",
    amount: 400,
    currency: "cad",
    fileUrl: "/files/golden-sunset.pdf",
  },
};
