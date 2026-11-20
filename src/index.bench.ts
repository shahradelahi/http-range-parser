import { bench, describe } from 'vitest';

import { combineRanges, parse } from './index.js';

describe('range-parser benchmarks', () => {
  bench('parse normal range', () => {
    parse(1000, 'bytes=0-499');
  });

  bench('parse multiple ranges', () => {
    parse(10000, 'bytes=0-499,500-999,1000-1499,2000-2499');
  });

  bench('parse suffix range', () => {
    parse(1000, 'bytes=-500');
  });

  bench('parse with combine', () => {
    parse(1000, 'bytes=0-499,200-300,500-700,600-800', { combine: true });
  });

  bench('parse malformed input', () => {
    parse(1000, 'bytes=abc-def,100--200,0-1e5');
  });

  bench('combineRanges directly', () => {
    combineRanges([
      { start: 0, end: 100 },
      { start: 50, end: 150 },
      { start: 200, end: 300 },
    ]);
  });
});
