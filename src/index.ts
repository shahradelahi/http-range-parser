import type {
  ContentRangeOptions,
  IndexedRange,
  ParseResult,
  Range,
  RangeArray,
  RangeParserOptions,
  RangeStatusCode,
} from './typings.js';

const HTTP_TOKEN_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

function parsePos(str: string, start: number, end: number): number {
  if (start >= end) {
    return NaN;
  }
  let val = 0;
  for (let i = start; i < end; i++) {
    const code = str.charCodeAt(i);
    if (code < 48 || code > 57) {
      return NaN;
    }
    val = val * 10 + (code - 48);
    if (val > Number.MAX_SAFE_INTEGER) {
      return NaN;
    }
  }
  return val;
}

/**
 * Combine overlapping and adjacent ranges while preserving original order.
 *
 * @example
 * combineRanges([{ start: 0, end: 10 }, { start: 5, end: 20 }]);
 * // [{ start: 0, end: 20, index: 0 }]
 */
export function combineRanges(ranges: readonly Range[]): IndexedRange[] {
  if (ranges.length === 0) {
    return [];
  }

  const ordered: IndexedRange[] = ranges
    .map((range, index) => ({
      start: range.start,
      end: range.end,
      index,
    }))
    .sort((a, b) => a.start - b.start);

  let j = 0;
  for (let i = 1; i < ordered.length; i++) {
    const range = ordered[i]!;
    const current = ordered[j]!;

    if (range.start > current.end + 1) {
      ordered[++j] = range;
    } else {
      current.end = Math.max(current.end, range.end);
      current.index = Math.min(current.index, range.index);
    }
  }

  ordered.length = j + 1;

  return ordered.sort((a, b) => a.index - b.index);
}

/**
 * Parse HTTP Range header string for representation size.
 *
 * @example
 * parse(1000, 'bytes=0-499');
 * // { code: 0, type: 'bytes', ranges: [{ start: 0, end: 499 }] }
 */
export function parse(size: number, str: string, options?: RangeParserOptions): ParseResult {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  if (!Number.isSafeInteger(size) || size < 0) {
    throw new TypeError(`Invalid size: ${size}`);
  }

  if (options?.maxHeaderLength !== undefined && str.length > options.maxHeaderLength) {
    return { code: 1, type: '', ranges: [] };
  }

  const eqIndex = str.indexOf('=');
  if (eqIndex === -1) {
    return { code: 1, type: '', ranges: [] };
  }

  const type = str.slice(0, eqIndex).toLowerCase();
  const rawRanges = str.slice(eqIndex + 1);

  let code: 0 | 1 | 2 | 3 = 0;
  const ranges: Range[] = [];
  let nonEmptyCount = 0;

  let segStart = 0;
  const len = rawRanges.length;

  while (segStart <= len) {
    let commaIndex = rawRanges.indexOf(',', segStart);
    if (commaIndex === -1) {
      commaIndex = len;
    }

    let startIdx = segStart;
    let endIdx = commaIndex;

    while (
      startIdx < endIdx &&
      (rawRanges.charCodeAt(startIdx) === 32 || rawRanges.charCodeAt(startIdx) === 9)
    ) {
      startIdx++;
    }
    while (
      endIdx > startIdx &&
      (rawRanges.charCodeAt(endIdx - 1) === 32 || rawRanges.charCodeAt(endIdx - 1) === 9)
    ) {
      endIdx--;
    }

    segStart = commaIndex + 1;

    if (startIdx >= endIdx) {
      continue;
    }

    nonEmptyCount++;

    if (options?.maxRanges !== undefined && nonEmptyCount > options.maxRanges) {
      code |= 1;
      break;
    }

    const dashIndex = rawRanges.indexOf('-', startIdx);
    if (dashIndex === -1 || dashIndex >= endIdx) {
      code |= 1;
      continue;
    }

    const secondDash = rawRanges.indexOf('-', dashIndex + 1);
    if (secondDash !== -1 && secondDash < endIdx) {
      code |= 1;
      continue;
    }

    let start: number;
    let end: number;

    if (dashIndex === startIdx) {
      if (endIdx === dashIndex + 1) {
        code |= 1;
        continue;
      }
      const suffixLength = parsePos(rawRanges, dashIndex + 1, endIdx);
      if (Number.isNaN(suffixLength)) {
        code |= 1;
        continue;
      }
      if (size === 0) {
        if (suffixLength > 0) {
          continue;
        }
        code |= 2;
        continue;
      }
      start = Math.max(size - suffixLength, 0);
      end = size - 1;
    } else {
      start = parsePos(rawRanges, startIdx, dashIndex);
      if (Number.isNaN(start)) {
        code |= 1;
        continue;
      }

      if (endIdx === dashIndex + 1) {
        end = size - 1;
      } else {
        end = parsePos(rawRanges, dashIndex + 1, endIdx);
        if (Number.isNaN(end)) {
          code |= 1;
          continue;
        }
        if (start > end) {
          code |= 1;
          continue;
        }
        if (end > size - 1) {
          end = size - 1;
        }
      }
    }

    if (start > end) {
      code |= 2;
      continue;
    }

    ranges.push({ start, end });
  }

  if (nonEmptyCount === 0) {
    return { code: 1, type, ranges: [] };
  }

  let finalRanges = ranges;
  if (options?.combine && ranges.length > 1) {
    finalRanges = combineRanges(ranges).map((r) => ({
      start: r.start,
      end: r.end,
    }));
  }

  return {
    code: code as RangeStatusCode,
    type,
    ranges: finalRanges,
  };
}

/**
 * Alias for `parse`.
 */
export const parseRange = parse;

/**
 * Format range object into HTTP Range header string.
 *
 * @example
 * format({ type: 'bytes', ranges: [{ start: 0, end: 499 }] });
 * // 'bytes=0-499'
 */
export function format(obj: { type: string; ranges: readonly Range[] }): string {
  if (
    typeof obj !== 'object' ||
    obj === null ||
    typeof obj.type !== 'string' ||
    !HTTP_TOKEN_REGEX.test(obj.type)
  ) {
    throw new TypeError('Invalid range type');
  }

  if (!Array.isArray(obj.ranges) || obj.ranges.length === 0) {
    throw new TypeError('At least one range is required');
  }

  const parts: string[] = [];
  for (let i = 0; i < obj.ranges.length; i++) {
    const range = obj.ranges[i];
    if (
      !range ||
      typeof range.start !== 'number' ||
      typeof range.end !== 'number' ||
      !Number.isSafeInteger(range.start) ||
      !Number.isSafeInteger(range.end) ||
      range.start < 0 ||
      range.end < range.start
    ) {
      throw new TypeError('Invalid range');
    }
    parts.push(`${range.start}-${range.end}`);
  }

  return `${obj.type}=${parts.join(',')}`;
}

/**
 * Format Content-Range response header string.
 *
 * @example
 * formatContentRange({ start: 0, end: 499, size: 1000 });
 * // 'bytes 0-499/1000'
 */
export function formatContentRange(options: ContentRangeOptions): string {
  const type = options.type ?? 'bytes';
  if (!HTTP_TOKEN_REGEX.test(type)) {
    throw new TypeError('Invalid range type');
  }

  const { start, end, size } = options;

  if (size !== '*' && (!Number.isSafeInteger(size) || size < 0)) {
    throw new TypeError(`Invalid size: ${size}`);
  }

  if (start === undefined && end === undefined) {
    return `${type} */${size}`;
  }

  if (
    typeof start !== 'number' ||
    typeof end !== 'number' ||
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start
  ) {
    throw new TypeError('Invalid range bounds');
  }

  if (typeof size === 'number' && end >= size) {
    throw new TypeError(`Range end ${end} exceeds or equals size ${size}`);
  }

  return `${type} ${start}-${end}/${size}`;
}

/**
 * Parse Content-Range header string.
 *
 * @example
 * parseContentRange('bytes 0-499/1000');
 * // { type: 'bytes', start: 0, end: 499, size: 1000 }
 */
export function parseContentRange(str: string): {
  type: string;
  start?: number;
  end?: number;
  size: number | '*';
} | null {
  if (typeof str !== 'string') {
    return null;
  }

  const spaceIndex = str.indexOf(' ');
  if (spaceIndex === -1) {
    return null;
  }

  const type = str.slice(0, spaceIndex).toLowerCase();
  if (!HTTP_TOKEN_REGEX.test(type)) {
    return null;
  }

  const rest = str.slice(spaceIndex + 1).trim();
  const slashIndex = rest.indexOf('/');
  if (slashIndex === -1) {
    return null;
  }

  const rangePart = rest.slice(0, slashIndex);
  const sizePart = rest.slice(slashIndex + 1);

  let size: number | '*';
  if (sizePart === '*') {
    size = '*';
  } else {
    size = parsePos(sizePart, 0, sizePart.length);
    if (Number.isNaN(size)) {
      return null;
    }
  }

  if (rangePart === '*') {
    return { type, size };
  }

  const dashIndex = rangePart.indexOf('-');
  if (dashIndex === -1) {
    return null;
  }

  const start = parsePos(rangePart, 0, dashIndex);
  const end = parsePos(rangePart, dashIndex + 1, rangePart.length);

  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    return null;
  }

  if (typeof size === 'number' && end >= size) {
    return null;
  }

  return { type, start, end, size };
}

export default parse;

export type {
  ContentRangeOptions,
  IndexedRange,
  ParseResult,
  Range,
  RangeArray,
  RangeParserOptions,
  RangeStatusCode,
};
