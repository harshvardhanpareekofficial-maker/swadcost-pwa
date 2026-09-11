/**
 * Mill-number parsing for Chrome Web Speech (en-IN / hi-IN).
 * Accepts Hindi + English words, Devanagari digits, and short unit tags.
 * Rejects a number buried in a long leftover sentence.
 */

const SMALL: Record<string, number> = {
  zero: 0,
  oh: 0,
  o: 0,
  nought: 0,
  nil: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  four: 4,
  for: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,

  // Romanized Hindi
  shunya: 0,
  shoonya: 0,
  sunya: 0,
  ek: 1,
  do: 2,
  teen: 3,
  tin: 3,
  char: 4,
  chaar: 4,
  panch: 5,
  paanch: 5,
  chhe: 6,
  chah: 6,
  cheh: 6,
  saat: 7,
  sat: 7,
  aath: 8,
  ath: 8,
  nau: 9,
  das: 10,
  dus: 10,
  gyarah: 11,
  gyaarah: 11,
  barah: 12,
  terah: 13,
  chaudah: 14,
  chaudha: 14,
  pandrah: 15,
  pandra: 15,
  solah: 16,
  satrah: 17,
  atharah: 18,
  unnis: 19,
  bees: 20,
  tees: 30,
  chalis: 40,
  chaalis: 40,
  pachaas: 50,
  pachas: 50,
  saath: 60,
  satar: 70,
  sathar: 70,
  assi: 80,
  nabbe: 90,
  nabbey: 90,

  // Devanagari
  शून्य: 0,
  एक: 1,
  दो: 2,
  तीन: 3,
  चार: 4,
  पांच: 5,
  पाँच: 5,
  छह: 6,
  छे: 6,
  सात: 7,
  आठ: 8,
  नौ: 9,
  दस: 10,
  ग्यारह: 11,
  बारह: 12,
  तेरह: 13,
  चौदह: 14,
  पंद्रह: 15,
  सोलह: 16,
  सत्रह: 17,
  अठारह: 18,
  उन्नीस: 19,
  बीस: 20,
  तीस: 30,
  चालीस: 40,
  पचास: 50,
  साठ: 60,
  सत्तर: 70,
  अस्सी: 80,
  नब्बे: 90,
}

/** Common fused Hindi mill numbers (21–99) plus a few shop-floor favourites. */
const HINDI_COMPOUND: Record<string, number> = {
  ikkis: 21,
  ikkees: 21,
  इक्कीस: 21,
  bais: 22,
  baais: 22,
  बाईस: 22,
  teis: 23,
  tees23: 23,
  तेईस: 23,
  chaubis: 24,
  choubis: 24,
  चौबीस: 24,
  pachis: 25,
  pachees: 25,
  पच्चीस: 25,
  chabbis: 26,
  छब्बीस: 26,
  sattais: 27,
  सत्ताईस: 27,
  atthais: 28,
  अट्ठाईस: 28,
  untees: 29,
  उनतीस: 29,
  iktees: 31,
  इकतीस: 31,
  battees: 32,
  बत्तीस: 32,
  taintees: 33,
  तैंतीस: 33,
  chauntees: 34,
  चौंतीस: 34,
  paintees: 35,
  पैंतीस: 35,
  chattees: 36,
  छत्तीस: 36,
  saintis: 37,
  सैंतीस: 37,
  adhtis: 38,
  अड़तीस: 38,
  untalis: 39,
  उनतालीस: 39,
  iktalis: 41,
  इकतालीस: 41,
  bayalis: 42,
  बयालीस: 42,
  taintalis: 43,
  तैंतालीस: 43,
  chavalis: 44,
  चवालीस: 44,
  paintalis: 45,
  पैंतालीस: 45,
  chiyalis: 46,
  छियालीस: 46,
  saintalis: 47,
  सैंतालीस: 47,
  adhtalis: 48,
  अड़तालीस: 48,
  unchas: 49,
  उनचास: 49,
  ikyavan: 51,
  इक्यावन: 51,
  bawan: 52,
  बावन: 52,
  tirpan: 53,
  तिरपन: 53,
  chauwan: 54,
  चौवन: 54,
  pachpan: 55,
  पचपन: 55,
  chhappan: 56,
  छप्पन: 56,
  satavan: 57,
  सत्तावन: 57,
  athavan: 58,
  अट्ठावन: 58,
  unnath: 59,
  उनसठ: 59,
  iksath: 61,
  इकसठ: 61,
  basath: 62,
  बासठ: 62,
  tirsath: 63,
  तिरसठ: 63,
  chausath: 64,
  चौंसठ: 64,
  painsath: 65,
  painsathh: 65,
  पैंसठ: 65,
  chhiyasath: 66,
  छियासठ: 66,
  satsath: 67,
  सड़सठ: 67,
  arsath: 68,
  अड़सठ: 68,
  unhattar: 69,
  उनहत्तर: 69,
  ikhattar: 71,
  इकहत्तर: 71,
  bahattar: 72,
  बहत्तर: 72,
  tihattar: 73,
  तिहत्तर: 73,
  chauhattar: 74,
  चौहत्तर: 74,
  pachhattar: 75,
  पचहत्तर: 75,
  chhihattar: 76,
  छिहत्तर: 76,
  sathattar: 77,
  सतहत्तर: 77,
  athhattar: 78,
  अठहत्तर: 78,
  unasi: 79,
  उनासी: 79,
  ikyasi: 81,
  इक्यासी: 81,
  bayasi: 82,
  बयासी: 82,
  tirasi: 83,
  तिरासी: 83,
  chaurasi: 84,
  चौरासी: 84,
  pachasi: 85,
  पचासी: 85,
  chhiyasi: 86,
  छियासी: 86,
  satasi: 87,
  सतासी: 87,
  athasi: 88,
  अठासी: 88,
  navasi: 89,
  नवासी: 89,
  ikyanve: 91,
  इक्यानवे: 91,
  banve: 92,
  बानवे: 92,
  tiranve: 93,
  तिरानवे: 93,
  chauranve: 94,
  चौरानवे: 94,
  pachanve: 95,
  पचानवे: 95,
  chhiyanve: 96,
  छियानवे: 96,
  satanve: 97,
  सत्तानवे: 97,
  athanve: 98,
  अट्ठानवे: 98,
  ninyanve: 99,
  निन्यानवे: 99,
}

const HUNDRED = new Set(['hundred', 'sau', 'so', 'सौ'])
const THOUSAND = new Set(['thousand', 'hazaar', 'hazar', 'हजार'])
const POINT = new Set(['point', 'dot', 'dashamlav', 'deshamlav', 'दशमलव', 'पॉइंट', 'प्वाइंट'])
const SKIP = new Set(['and', 'a', 'the'])

const UNIT_TOKENS = new Set([
  'percent',
  'percentage',
  'pratisat',
  'pratishat',
  'प्रतिशत',
  'inch',
  'inches',
  'इंच',
  'pick',
  'picks',
  'पिक',
  'reed',
  'रीड',
  'rupee',
  'rupees',
  'rs',
  'dent',
  'dents',
  'count',
  'काउंट',
  'ne',
  'rate',
  'दर',
  'wastage',
  'वेस्टेज',
])

const UNIT_RE =
  /\b(percent|percentage|pratisat|pratishat|inch|inches|picks?|reed|rupees?|rs|dents?|count|ne|rate|wastage)\b/gi

function normalizeDigits(input: string): string {
  return input
    .replace(/[०-९]/g, (ch) => String(ch.charCodeAt(0) - 0x0966))
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 0x0660))
}

function tokenValue(token: string): number | null {
  if (/^\d+(?:\.\d+)?$/.test(token)) {
    const n = Number(token)
    return Number.isFinite(n) ? n : null
  }
  if (HINDI_COMPOUND[token] !== undefined) return HINDI_COMPOUND[token]
  return SMALL[token] ?? null
}

function isSingleDigitToken(token: string): boolean {
  const v = tokenValue(token)
  return v !== null && v >= 0 && v <= 9 && !HUNDRED.has(token) && !THOUSAND.has(token)
}

/** 0–99 from one or two mill tokens (sixty five / साठ पांच). */
function parseSmall(tokens: string[]): number | null {
  if (tokens.length === 0 || tokens.length > 2) return null
  if (tokens.length === 1) {
    const v = tokenValue(tokens[0])
    if (v === null || v < 0 || v > 99) return null
    return v
  }
  const a = tokenValue(tokens[0])
  const b = tokenValue(tokens[1])
  if (a === null || b === null) return null
  if (a >= 20 && a % 10 === 0 && b > 0 && b < 10) return a + b
  if (isSingleDigitToken(tokens[0]) && isSingleDigitToken(tokens[1])) {
    return a * 10 + b
  }
  return null
}

function parseDigitRun(tokens: string[]): number | null {
  if (tokens.length < 2 || tokens.length > 6) return null
  let digits = ''
  for (const t of tokens) {
    if (!isSingleDigitToken(t)) return null
    digits += String(tokenValue(t))
  }
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

function parseIntWords(tokens: string[]): number | null {
  if (tokens.length === 0 || tokens.length > 6) return null
  if (tokens.length === 1) {
    const v = tokenValue(tokens[0])
    if (v === null || v < 0) return null
    return v
  }

  const thousandAt = tokens.findIndex((t) => THOUSAND.has(t))
  if (thousandAt !== -1) {
    const left = tokens.slice(0, thousandAt)
    const right = tokens.slice(thousandAt + 1)
    const thousands = left.length === 0 ? 1 : parseSmall(left) ?? parseDigitRun(left)
    if (thousands === null || thousands < 1 || thousands > 999) return null
    const rest = right.length === 0 ? 0 : parseIntWords(right)
    if (rest === null) return null
    return thousands * 1000 + rest
  }

  const hundredAt = tokens.findIndex((t) => HUNDRED.has(t))
  if (hundredAt !== -1) {
    const left = tokens.slice(0, hundredAt)
    const right = tokens.slice(hundredAt + 1)
    const hundreds = left.length === 0 ? 1 : parseSmall(left)
    if (hundreds === null || hundreds < 1 || hundreds > 9) return null
    const rest = right.length === 0 ? 0 : parseSmall(right) ?? parseDigitRun(right)
    if (rest === null) return null
    return hundreds * 100 + rest
  }

  // “one twenty” / “one twenty five” → 120 / 125 (common for reed / L2L)
  if (tokens.length >= 2) {
    const head = tokenValue(tokens[0])
    const rest = tokens.length === 2 ? tokenValue(tokens[1]) : parseSmall(tokens.slice(1))
    if (head !== null && rest !== null && head >= 1 && head <= 9 && rest >= 10 && rest <= 99) {
      return head * 100 + rest
    }
  }

  // “one oh two” / “एक जीरो दो”
  if (tokens.length === 3) {
    const a = tokenValue(tokens[0])
    const b = tokenValue(tokens[1])
    const c = tokenValue(tokens[2])
    const middleOh = tokens[1] === 'oh' || tokens[1] === 'zero' || tokens[1] === 'o' || tokens[1] === 'शून्य'
    if (a !== null && b !== null && c !== null && middleOh && a >= 1 && a <= 9 && c >= 0 && c <= 9) {
      return a * 100 + b * 10 + c
    }
  }

  const run = parseDigitRun(tokens)
  if (run !== null) return run

  return parseSmall(tokens)
}

function parseFracTokens(tokens: string[]): number | null {
  if (tokens.length === 0 || tokens.length > 4) return null
  let digits = ''
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      digits += t
      continue
    }
    const v = tokenValue(t)
    if (v === null || v > 9) return null
    digits += String(v)
  }
  if (!digits) return null
  const frac = Number(`0.${digits}`)
  return Number.isFinite(frac) ? frac : null
}

function tokenize(stripped: string): string[] {
  return stripped
    .split(' ')
    .filter((t) => t && !SKIP.has(t) && !UNIT_TOKENS.has(t))
}

export function parseSpokenTokens(stripped: string): number | null {
  const tokens = tokenize(stripped)
  if (tokens.length === 0) return null

  const pointAt = tokens.findIndex((t) => POINT.has(t))
  if (pointAt !== -1) {
    const left = tokens.slice(0, pointAt)
    const right = tokens.slice(pointAt + 1)
    const intPart = left.length === 0 ? 0 : parseIntWords(left)
    const frac = parseFracTokens(right)
    if (intPart === null || frac === null) return null
    return intPart + frac
  }

  return parseIntWords(tokens)
}

/**
 * Accept a spoken mill number only when the utterance is essentially numeric.
 * Does not pull a digit out of a long misheard sentence.
 */
export function extractSpokenNumber(transcript: string): number | null {
  const cleaned = normalizeDigits(transcript)
    .replace(/,/g, ' ')
    .replace(/([a-z])-([a-z])/gi, '$1 $2')
    .replace(/[^\p{L}\p{M}\p{N}.\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  if (!cleaned) return null
  const stripped = cleaned
    .replace(UNIT_RE, ' ')
    .replace(/(\d)\.(?=\s|$)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  if (!stripped) return null
  const n = parseSpokenTokens(stripped)
  if (n === null || !Number.isFinite(n) || n < 0 || n > 1_000_000) return null
  return n
}

/** Prefer the first alternative that parses as a mill number (Chrome maxAlternatives). */
export function extractSpokenNumberFromAlternatives(transcripts: string[]): number | null {
  for (const t of transcripts) {
    const n = extractSpokenNumber(t)
    if (n !== null) return n
  }
  return null
}

/** Chrome on Android/desktop over HTTPS. Hindi UI language → hi-IN, else Indian English. */
export function preferredSpeechLang(navLang = typeof navigator !== 'undefined' ? navigator.language : 'en-IN'): string {
  return navLang.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN'
}
