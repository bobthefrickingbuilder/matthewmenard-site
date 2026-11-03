// Music Theory Fundamentals: the chapters that unlock with a coffee (lib/donations.js).
// Part 1 is free and lives in public/teaching/. These files live in private-book/ and are only
// served by /api/donate to a paid donation of UNLOCK cents or more.
//
// To add a chapter: put the PDF in private-book/, add a line below, list it on public/teaching.html,
// and rebuild the ZIP. Everyone who has already given sees it on their link automatically.

const UNLOCK = 500; // $5: any coffee, once or monthly.

const PARTS = [
  { part: 2, title: "Meter, Half Steps, and Key Signatures" },
  { part: 3, title: "Intervals and Triads" },
];

const CHAPTERS = [
  [8, 2, "Beat, Meter, and Time Signatures", "beat-meter-and-time-signatures", 3],
  [9, 2, "More Time Signatures and Beaming", "more-time-signatures-and-beaming", 2],
  [10, 2, "Pickup Measures", "pickup-measures", 3],
  [11, 2, "Half Steps, Whole Steps, and Accidentals", "half-steps-whole-steps-and-accidentals", 2],
  [12, 2, "The Major Scale and Key Signatures", "the-major-scale-and-key-signatures", 2],
  [13, 2, "Reading Key Signatures", "reading-key-signatures", 3],
  [14, 3, "Tonic, Scale Degrees, and Key", "tonic-scale-degrees-and-key", 2],
  [15, 3, "Intervals", "intervals", 3],
  [16, 3, "Interval Quality", "interval-quality", 3],
  [17, 3, "Triads", "triads", 2],
  [18, 3, "Major and Minor Triads", "major-and-minor-triads", 2],
  [19, 3, "Primary Chords and Chord Symbols", "primary-chords-and-chord-symbols", 2],
].map(([n, part, title, slug, pages]) => {
  const nn = String(n).padStart(2, "0");
  return { id: `ch${nn}`, n, part, title, pages, file: `music-theory-ch${nn}-${slug}.pdf` };
});

const ZIP = { id: "zip", title: "Parts 2 and 3 (ZIP)", file: "music-theory-fundamentals-parts-2-3.zip" };

const FILES = Object.fromEntries([...CHAPTERS, ZIP].map((f) => [f.id, f]));

module.exports = { UNLOCK, PARTS, CHAPTERS, ZIP, FILES };
