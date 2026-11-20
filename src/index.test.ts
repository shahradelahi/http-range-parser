import { describe, expect, it } from 'vitest';

import parse, {
  combineRanges,
  format,
  formatContentRange,
  parseContentRange,
  parseRange,
} from './index.js';

describe('parse(size, str, options)', () => {
  it('should reject non-string str', () => {
    expect(() => parse(200, {} as any)).to.throw(/argument str must be a string/);
  });

  it('should reject invalid size values', () => {
    expect(() => parse(-1, 'bytes=0-10')).to.throw(/Invalid size: -1/);
    expect(() => parse(1.5, 'bytes=0-10')).to.throw(/Invalid size: 1.5/);
    expect(() => parse(NaN, 'bytes=0-10')).to.throw(/Invalid size: NaN/);
    expect(() => parse(Infinity, 'bytes=0-10')).to.throw(/Invalid size: Infinity/);
    expect(() => parse(Number.MAX_SAFE_INTEGER + 1, 'bytes=0-10')).to.throw(/Invalid size/);
  });

  it('should return code 1 for malformed header without equals', () => {
    expect(parse(200, 'malformed')).to.deep.eq({
      code: 1,
      type: '',
      ranges: [],
    });
  });

  it('should return code 2 if all specified ranges are unsatisfiable', () => {
    expect(parse(200, 'bytes=500-999')).to.deep.eq({
      code: 2,
      type: 'bytes',
      ranges: [],
    });
    expect(parse(200, 'bytes=500-999,1000-1499')).to.deep.eq({
      code: 2,
      type: 'bytes',
      ranges: [],
    });
  });

  it('should return code 1 for reversed bounds (e.g., 500-20)', () => {
    expect(parse(200, 'bytes=500-20')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });
  });

  it('should return code 3 when header has both malformed and unsatisfiable ranges', () => {
    expect(parse(200, 'bytes=500-20,600-700')).to.deep.eq({
      code: 3,
      type: 'bytes',
      ranges: [],
    });
  });

  it('should parse valid range str', () => {
    const result = parse(1000, 'bytes=0-499');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [{ start: 0, end: 499 }],
    });
  });

  it('should lowercase range unit type', () => {
    const result = parse(1000, 'BYTES=0-499');
    expect(result.type).to.eq('bytes');
  });

  it('should cap end at size - 1', () => {
    const result = parse(200, 'bytes=0-499');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [{ start: 0, end: 199 }],
    });
  });

  it('should parse suffix range asking for last n bytes', () => {
    const result = parse(1000, 'bytes=-400');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [{ start: 600, end: 999 }],
    });
  });

  it('should clamp suffix range larger than size to start at 0', () => {
    const result = parse(100, 'bytes=-101');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [{ start: 0, end: 99 }],
    });
  });

  it('should handle suffix range on empty file (size === 0)', () => {
    const result = parse(0, 'bytes=-1');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [],
    });

    const unsatisfiable = parse(0, 'bytes=0-');
    expect(unsatisfiable).to.deep.eq({
      code: 2,
      type: 'bytes',
      ranges: [],
    });
  });

  it('should parse open-ended range', () => {
    const result = parse(1000, 'bytes=400-');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [{ start: 400, end: 999 }],
    });
  });

  it('should parse bytes=0-0', () => {
    const result = parse(1000, 'bytes=0-0');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [{ start: 0, end: 0 }],
    });
  });

  it('should parse multiple ranges', () => {
    const result = parse(1000, 'bytes=40-80,81-90,-1');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [
        { start: 40, end: 80 },
        { start: 81, end: 90 },
        { start: 999, end: 999 },
      ],
    });
  });

  it('should report mixed valid and unsatisfiable/malformed ranges accurately', () => {
    const result = parse(200, 'bytes=0-499,1000-,500-999');
    expect(result).to.deep.eq({
      code: 2,
      type: 'bytes',
      ranges: [{ start: 0, end: 199 }],
    });
  });

  it('should flag malformed range entries', () => {
    expect(parse(200, 'bytes=x-100')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });

    expect(parse(200, 'bytes=100-x')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });

    expect(parse(200, 'bytes=100200')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });

    expect(parse(200, 'bytes=01a-150')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });

    expect(parse(200, 'bytes=+10-20')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });

    expect(parse(200, 'bytes=100-200-300')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });

    expect(parse(200, 'bytes=100--200')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });

    expect(parse(200, 'bytes=-100-150')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });

    expect(parse(200, 'bytes=-')).to.deep.eq({
      code: 1,
      type: 'bytes',
      ranges: [],
    });
  });

  it('should ignore empty elements surrounded by whitespace', () => {
    const result = parse(1000, 'bytes=, \t, 0-10, , 20-30');
    expect(result).to.deep.eq({
      code: 0,
      type: 'bytes',
      ranges: [
        { start: 0, end: 10 },
        { start: 20, end: 30 },
      ],
    });
  });

  it('should respect maxHeaderLength option', () => {
    const result = parse(1000, 'bytes=0-10,20-30', { maxHeaderLength: 10 });
    expect(result).to.deep.eq({
      code: 1,
      type: '',
      ranges: [],
    });
  });

  it('should respect maxRanges option', () => {
    const result = parse(1000, 'bytes=0-10,20-30,40-50', { maxRanges: 2 });
    expect(result.code).to.eq(1);
  });

  describe('combineRanges and option combine: true', () => {
    it('should combine overlapping ranges', () => {
      const result = parse(150, 'bytes=0-4,90-99,5-75,100-199,101-102', {
        combine: true,
      });
      expect(result).to.deep.eq({
        code: 0,
        type: 'bytes',
        ranges: [
          { start: 0, end: 75 },
          { start: 90, end: 149 },
        ],
      });
    });

    it('should retain original order when smaller ranges are absorbed', () => {
      const result = parse(150, 'bytes=50-60,200-300,0-100', {
        combine: true,
      });
      expect(result).to.deep.eq({
        code: 2,
        type: 'bytes',
        ranges: [{ start: 0, end: 100 }],
      });
    });

    it('should combine ranges without mutating input', () => {
      const input = Object.freeze([
        { start: 50, end: 60 },
        { start: 0, end: 100 },
      ]);
      const combined = combineRanges(input);
      expect(combined).to.deep.eq([{ start: 0, end: 100, index: 0 }]);
      expect(input[0]).to.deep.eq({ start: 50, end: 60 });
    });
  });

  it('should export parseRange aliased to parse', () => {
    expect(parseRange).to.eq(parse);
  });
});

describe('format(obj)', () => {
  it('should format valid type and ranges', () => {
    expect(
      format({
        type: 'bytes',
        ranges: [
          { start: 0, end: 99 },
          { start: 200, end: 299 },
        ],
      })
    ).to.eq('bytes=0-99,200-299');
  });

  it('should throw TypeError for invalid type', () => {
    expect(() => format({ type: 'invalid type', ranges: [{ start: 0, end: 1 }] })).to.throw(
      /Invalid range type/
    );
  });

  it('should throw TypeError for empty or missing ranges', () => {
    expect(() => format({ type: 'bytes', ranges: [] })).to.throw(/At least one range is required/);
  });

  it('should throw TypeError for invalid range bounds', () => {
    expect(() => format({ type: 'bytes', ranges: [{ start: 100, end: 50 }] })).to.throw(
      /Invalid range/
    );
    expect(() => format({ type: 'bytes', ranges: [{ start: -1, end: 50 }] })).to.throw(
      /Invalid range/
    );
  });
});

describe('formatContentRange(options) and parseContentRange(str)', () => {
  it('should format valid Content-Range headers', () => {
    expect(formatContentRange({ start: 0, end: 99, size: 1000 })).to.eq('bytes 0-99/1000');
    expect(formatContentRange({ type: 'items', start: 0, end: 9, size: '*' })).to.eq('items 0-9/*');
    expect(formatContentRange({ size: 1000 })).to.eq('bytes */1000');
  });

  it('should throw TypeError on invalid Content-Range parameters', () => {
    expect(() => formatContentRange({ start: 100, end: 50, size: 1000 })).to.throw(
      /Invalid range bounds/
    );
    expect(() => formatContentRange({ start: 0, end: 1000, size: 1000 })).to.throw(
      /exceeds or equals size/
    );
  });

  it('should parse valid Content-Range headers', () => {
    expect(parseContentRange('bytes 0-99/1000')).to.deep.eq({
      type: 'bytes',
      start: 0,
      end: 99,
      size: 1000,
    });
    expect(parseContentRange('bytes */1000')).to.deep.eq({
      type: 'bytes',
      size: 1000,
    });
    expect(parseContentRange('items 0-9/*')).to.deep.eq({
      type: 'items',
      start: 0,
      end: 9,
      size: '*',
    });
  });

  it('should return null for malformed Content-Range headers', () => {
    expect(parseContentRange('invalid')).to.be.null;
    expect(parseContentRange('bytes 100-50/1000')).to.be.null;
    expect(parseContentRange('bytes 0-1000/1000')).to.be.null;
    expect(parseContentRange('bytes abc/1000')).to.be.null;
  });
});
