# @se-oss/range-parser

## 2.0.0

### Major Changes

- b01bb44: Change `parse` and `parseRange` return signature to return structured `{ code, type, ranges }` object.

### Minor Changes

- b01bb44: Add `format()`, `formatContentRange()`, `parseContentRange()`, and standalone `combineRanges()` exports, plus DoS limits `maxRanges` and `maxHeaderLength`.

### Patch Changes

- b01bb44: Fix `combineRanges` original ordering when absorbing smaller ranges, clamp suffix ranges larger than file size, and fix malformed digit scanning.
