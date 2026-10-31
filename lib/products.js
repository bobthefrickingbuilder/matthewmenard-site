// Every score for sale. The only place titles, prices, and files are set.
// amount is in cents. file is relative to private-scores/ (never served publicly).
// Choral scores: add licensed: true and amount becomes the price per copy (see lib/copies.js).

module.exports = {
  "when-i-am-dead": {
    id: "when-i-am-dead",
    title: "When I am dead, my dearest",
    amount: 400,
    currency: "cad",
    file: "when-i-am-dead.pdf",
    page: "/compositions/when-i-am-dead",
  },
  "golden-sunset": {
    id: "golden-sunset",
    title: "The Golden Sunset",
    amount: 400,
    currency: "cad",
    file: "golden-sunset.pdf",
    page: "/compositions/golden-sunset",
  },
};
