// The Funniest Out-of-Office — a make.fun bounty entry.
//
// What this program does: it carries one sentence from this file to
// /output/entry.txt, and nothing else. The sentence is an out-of-office
// auto-reply, and its joke is a bait-and-switch: the first half is the
// most ordinary OOO anyone has ever written ("out of office until
// Monday"), and the second half hands every urgent email to a
// houseplant — a stand-in described like a colleague ("strong
// boundaries") that cannot even log in ("no password"), so nothing will
// be answered and nobody will say so out loud.
//
// Nothing here is creative at run time. The line is fixed below; the
// program's only job is to prove that the bytes on disk are exactly
// those bytes. It checks the line against the bounty gate, writes it,
// reads it back, and refuses to finish unless the round-trip matches
// character for character. Plain Node 22+, zero dependencies, no
// network, no arguments, no input:
//
//   node main.ts
//
// Exit code 0 means the entry on disk is the entry in this file.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// The entry itself
// ---------------------------------------------------------------------------

// Exactly one line, 120 characters, no trailing newline in the file.
// The judge reads whatever lands in /output/entry.txt, so this string
// literal IS the submission: change a word here and the entry changes.
// Everything else in this file exists only to guard that fact.
const ENTRY_LINE =
  "I'm out of office until Monday. Urgent emails go to my replacement: a houseplant with strong boundaries and no password.";

// ---------------------------------------------------------------------------
// The gate, as a table of named rules
// ---------------------------------------------------------------------------

// The bounty gate, sealed by the house: /output/entry.txt must hold
// UTF-8 text of 1 to 140 characters, a single line, and more than
// whitespace. An entry that fails any of these never reaches the judge,
// so each rule is named here and reported by name when it breaks.
const LIMITS = { minChars: 1, maxChars: 140 } as const;
const ENTRY_PATH = "/output/entry.txt";

// A rule is a name plus a test that returns a human-readable reason when
// the line breaks it, or null when the line is fine. Keeping the rules
// in a table instead of scattered if-statements means a future edit to
// the line gets a failure that names the rule, not a bare crash.
type Rule = { name: string; test: (line: string) => string | null };

const RULES: Rule[] = [
  {
    name: "length",
    test: (line) =>
      line.length < LIMITS.minChars || line.length > LIMITS.maxChars
        ? `line is ${line.length} characters, gate allows ${LIMITS.minChars}-${LIMITS.maxChars}`
        : null,
  },
  {
    name: "padding",
    test: (line) =>
      line.trim() !== line
        ? "line must not have leading or trailing whitespace"
        : null,
  },
  {
    name: "single-line",
    test: (line) =>
      /[\r\n]/.test(line) ? "line must not contain a line break" : null,
  },
  {
    name: "blank",
    test: (line) =>
      line.trim().length === 0 ? "line must not be only whitespace" : null,
  },
];

// Walk the table in order and throw on the first broken rule. The order
// is deliberate: size first, then shape, then content — the order a
// reader would notice the problem in.
function assertValid(raw: string): string {
  for (const rule of RULES) {
    const reason = rule.test(raw);
    if (reason !== null) {
      throw new Error(`gate failed (${rule.name}): ${reason}`);
    }
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Writing the entry, with a read-back proof
// ---------------------------------------------------------------------------

// Write the validated line to /output/entry.txt, then read the file back
// and compare it to the line character for character. A write that
// silently truncates, re-encodes, or appends a newline would otherwise
// pass unnoticed — the comparison is the only proof that what is on disk
// is what is above.
function emitEntry(line: string): void {
  mkdirSync("/output", { recursive: true });
  writeFileSync(ENTRY_PATH, line, "utf8");
  const onDisk = readFileSync(ENTRY_PATH, "utf8");
  if (onDisk !== line) {
    throw new Error(
      `read-back mismatch: disk holds ${onDisk.length} characters, entry has ${line.length}`,
    );
  }
  if (/[\r\n]/.test(onDisk)) {
    throw new Error("entry file must not contain a line break");
  }
}

function main(): void {
  const line = assertValid(ENTRY_LINE);
  emitEntry(line);
  console.log(`wrote ${ENTRY_PATH} (${line.length} characters, 1 line)`);
  console.log(line);
}

main();
