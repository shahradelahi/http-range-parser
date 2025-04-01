export interface Range {
  start: number;
  end: number;
}

export interface RangeArray extends Array<Range> {
  type?: string;
}

export interface RangeParserOptions {
  combine?: boolean;
}

/**
 * Combine overlapping & adjacent ranges.
 */
export interface IndexedRange extends Range {
  index: number;
}
