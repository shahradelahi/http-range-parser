import { expect } from 'chai';

import parse from './index.js';

describe('parseRange(len, str)', () => {
  it('should reject non-string str', () => {
    expect(() => parse(200, {} as any)).to.throw(/argument str must be a string/);
  });

  it('should return -2 for invalid str', () => {
    expect(parse(200, 'malformed')).be.eq(-2);
  });

  it('should return -1 if all specified ranges are invalid', () => {
    expect(parse(200, 'bytes=500-20')).be.eq(-1);
    expect(parse(200, 'bytes=500-999')).be.eq(-1);
    expect(parse(200, 'bytes=500-999,1000-1499')).be.eq(-1);
  });

  it('should parse str', () => {
    const range = parse(1000, 'bytes=0-499');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 0, end: 499 });
  });

  it('should cap end at size', () => {
    const range = parse(200, 'bytes=0-499');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 0, end: 199 });
  });

  it('should parse str', () => {
    const range = parse(1000, 'bytes=40-80');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 40, end: 80 });
  });

  it('should parse str asking for last n bytes', () => {
    const range = parse(1000, 'bytes=-400');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 600, end: 999 });
  });

  it('should parse str with only start', () => {
    const range = parse(1000, 'bytes=400-');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 400, end: 999 });
  });

  it('should parse "bytes=0-"', () => {
    const range = parse(1000, 'bytes=0-');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 0, end: 999 });
  });

  it('should parse str with no bytes', () => {
    const range = parse(1000, 'bytes=0-0');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 0, end: 0 });
  });

  it('should parse str asking for last byte', () => {
    const range = parse(1000, 'bytes=-1');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 999, end: 999 });
  });

  it('should parse str with multiple ranges', () => {
    const range = parse(1000, 'bytes=40-80,81-90,-1');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(3);
    expect(range[0]).be.deep.eq({ start: 40, end: 80 });
    expect(range[1]).be.deep.eq({ start: 81, end: 90 });
    expect(range[2]).be.deep.eq({ start: 999, end: 999 });
  });

  it('should parse str with some invalid ranges', () => {
    const range = parse(200, 'bytes=0-499,1000-,500-999');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('bytes');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 0, end: 199 });
  });

  it('should parse non-byte range', () => {
    const range = parse(1000, 'items=0-5');
    if (typeof range === 'number') expect.fail('range should not be a number');
    expect(range.type).be.eq('items');
    expect(range.length).be.eq(1);
    expect(range[0]).be.deep.eq({ start: 0, end: 5 });
  });

  describe('when combine: true', () => {
    it('should combine overlapping ranges', () => {
      const range = parse(150, 'bytes=0-4,90-99,5-75,100-199,101-102', { combine: true });
      if (typeof range === 'number') expect.fail('range should not be a number');
      expect(range.type).be.eq('bytes');
      expect(range.length).be.eq(2);
      expect(range[0]).be.deep.eq({ start: 0, end: 75 });
      expect(range[1]).be.deep.eq({ start: 90, end: 149 });
    });

    it('should retain original order', () => {
      const range = parse(150, 'bytes=-1,20-100,0-1,101-120', { combine: true });
      if (typeof range === 'number') expect.fail('range should not be a number');
      expect(range.type).be.eq('bytes');
      expect(range.length).be.eq(3);
      expect(range[0]).be.deep.eq({ start: 149, end: 149 });
      expect(range[1]).be.deep.eq({ start: 20, end: 120 });
      expect(range[2]).be.deep.eq({ start: 0, end: 1 });
    });
  });
});
