// Strips common AI disclaimers/preambles for "no bakwas" mode.
const PATTERNS: RegExp[] = [
  /^\s*(sure|certainly|of course|absolutely|great question|happy to help)[!,.\s-]+/i,
  /^\s*as an ai( language model)?[,.\s-]+/i,
  /^\s*i('?m| am)( just)? an ai[^.]*\.\s*/i,
  /^\s*i (cannot|can't|do not|don't have)( the ability| access)?[^.]*\.\s*/i,
  /\b(please note that|it'?s important to note that|keep in mind that)\b[^.]*\.\s*/gi,
  /\b(i hope this helps[^.]*|let me know if you[^.]*)\.?\s*$/gi,
  /\bdisclaimer:[^\n]*\n?/gi,
];

export function stripBS(text: string): string {
  let out = text;
  for (const p of PATTERNS) out = out.replace(p, "");
  return out.trim();
}