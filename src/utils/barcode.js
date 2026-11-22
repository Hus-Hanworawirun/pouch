/**
 * Barcode normalization and Thai keyboard transliteration utilities.
 * Resolves the issue where barcode scanners send keystrokes while the OS input language is Thai.
 */

// Mapping of Thai characters to English keys/digits (Kedmanee & Pattachote layouts)
const THAI_TO_ENG_MAP = {
  // Number row (Kedmanee unshifted & shifted)
  'ๅ': '1', '+': '1', '๑': '1', 'ๆ': '1',
  '/': '2', '๒': '2',
  '-': '3', '๒': '3',
  'ภ': '4', '๓': '4',
  'ถ': '5', '๔': '5', 'ก': '5',
  'ุ': '6', 'ู': '6',
  'ึ': '7', '฿': '7', 'ี': '7',
  'ค': '8', '๕': '8',
  'ต': '9', '๖': '9',
  'จ': '0', '๗': '0',
  'ข': '-', '๘': '-',
  'ช': '=', '๙': '=',

  // Thai numerical digits
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',

  // QWERTY Thai letter row equivalents (if alpha barcode scanned in Thai mode)
  'ไ': 'w', 'ำ': 'e', 'พ': 'r', 'ะ': 't', 'ั': 'y',
  'ร': 'i', 'น': 'o', 'ย': 'p', 'บ': '[', 'ล': ']',
  'ฟ': 'a', 'ห': 's', 'ด': 'f', 'เ': 'g', '้': 'h',
  '่': 'j', 'า': 'k', 'ส': 'l', 'ว': ';', 'ง': '\'',
  'ผ': 'z', 'ป': 'x', 'แ': 'c', 'อ': 'v', 'ิ': 'b',
  'ื': 'n', 'ท': 'm', 'ม': ',', 'ใ': '.', 'ฝ': '/'
};

/**
 * Transliterates a Thai-scanned string into its English barcode equivalent.
 * e.g., 'คคถจภีกภ-ๆตุ' -> '885047543196'
 */
export function normalizeBarcode(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .split('')
    .map(ch => THAI_TO_ENG_MAP[ch] || ch)
    .join('');
}

/**
 * Extracts the true character from a KeyboardEvent, prioritizing physical hardware code (e.code)
 * so it is immune to the active OS language layout (Thai / English).
 */
export function getCharFromKeyEvent(e) {
  if (!e) return '';

  // 1. Physical number keys on main row: Digit0 - Digit9
  if (e.code && e.code.startsWith('Digit')) {
    return e.code.replace('Digit', '');
  }

  // 2. Physical number keys on Numpad: Numpad0 - Numpad9
  if (e.code && e.code.startsWith('Numpad') && e.code !== 'NumpadEnter') {
    return e.code.replace('Numpad', '');
  }

  // 3. Physical letters on keyboard: KeyA - KeyZ
  if (e.code && e.code.startsWith('Key')) {
    return e.code.replace('Key', '');
  }

  // 4. Fallback to transliterating e.key if e.code is not standard
  if (e.key && e.key.length === 1) {
    return THAI_TO_ENG_MAP[e.key] || e.key;
  }

  return '';
}
