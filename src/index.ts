import type { IndexedRange, Range, RangeArray, RangeParserOptions } from './typings.js';

// -- Internal ------------------------

function combineRanges(ranges: RangeArray): RangeArray {
  // Map ranges to include original index, then sort by start position
  const ordered = ranges
    .map(
      (range, index): IndexedRange => ({
        start: range.start,
        end: range.end,
        index,
      })
    )
    .sort(sortByRangeStart);

  let j = 0,
    i = 1;

  // Combine overlapping or adjacent ranges
  for (; i < ordered.length; i++) {
    const range = ordered[i]!;
    const current = ordered[j]!;

    if (range.start > current.end + 1) {
      // next non-overlapping range found
      ordered[++j] = range;
    } else if (range.end > current.end) {
      // extend current range if needed
      current.end = range.end;
      current.index = Math.min(current.index, range.index);
    }
  }

  // Trim the ordered array to include only the combined ranges
  ordered.length = j + 1;

  // Restore original order based on index and remove the index property
  const combined = ordered.sort(sortByRangeIndex).map(
    (range): Range => ({
      start: range.start,
      end: range.end,
    })
  ) as RangeArray;

  // Copy range type
  combined.type = ranges.type;

  return combined;
}

/**
 * Sort function to sort ranges by index.
 */
function sortByRangeIndex(a: IndexedRange, b: IndexedRange): number {
  return a.index - b.index;
}

/**
 * Sort function to sort ranges by start position.
 */
function sortByRangeStart(a: IndexedRange, b: IndexedRange): number {
  return a.start - b.start;
}

// -- Exported ------------------------

/**
 * Parse "Range" header `str` relative to the given file `size`.
 *
 * @example
 * import { parseRange } from '@se-oss/range-parser';
 *
 * const size = 1000;
 * const str = 'bytes=500-999';
 * const result = parseRange(size, str); // [ { start: 500, end: 999 }, type: 'bytes' ]
 *
 * @param size - The size of the file.
 * @param str - The Range header string.
 * @param options - Optional configuration.
 * @returns Array of ranges if valid, -1 for unsatisfiable ranges, or -2 for malformed header.
 */
export function parseRange(
  size: number,
  str: string,
  options?: RangeParserOptions
): RangeArray | -1 | -2 {
  if (typeof (str as unknown) !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  const index = str.indexOf('=');

  if (index === -1) {
    return -2;
  }

  // split the range string
  const arr = str.slice(index + 1).split(',');
  const ranges: RangeArray = [] as RangeArray;

  // add ranges type (e.g., bytes)
  ranges.type = str.slice(0, index);

  // parse all ranges
  for (let i = 0; i < arr.length; i++) {
    const rangeParts = arr[i]!.split('-');
    let start = parseInt(rangeParts[0]!, 10);
    let end = parseInt(rangeParts[1]!, 10);

    // -nnn: suffix-byte-range-spec, meaning the last nnn bytes
    if (isNaN(start)) {
      start = size - end;
      end = size - 1;
      // nnn-: open-ended range from nnn to end
    } else if (isNaN(end)) {
      end = size - 1;
    }

    // limit last-byte-pos to current length
    if (end > size - 1) {
      end = size - 1;
    }

    // invalid or unsatisfiable range; skip it
    if (isNaN(start) || isNaN(end) || start > end || start < 0) {
      continue;
    }

    // add range
    ranges.push({ start, end });
  }

  if (ranges.length < 1) {
    // unsatisfiable range
    return -1;
  }

  return options && options.combine ? combineRanges(ranges) : ranges;
}

export default parseRange;

// -- Typings -------------------------

export type { RangeArray, Range, RangeParserOptions };
