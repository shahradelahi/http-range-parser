export interface Range {
  start: number;
  end: number;
}

export interface RangeArray extends Array<Range> {
  type?: string;
}

export interface IndexedRange extends Range {
  index: number;
}

export type RangeStatusCode = 0 | 1 | 2 | 3;

export interface ParseResult {
  code: RangeStatusCode;
  type: string;
  ranges: Range[];
}

export interface RangeParserOptions {
  combine?: boolean;
  maxRanges?: number;
  maxHeaderLength?: number;
}

export interface ContentRangeOptions {
  type?: string;
  start?: number;
  end?: number;
  size: number | '*';
}
