# @se-oss/range-parser

## 2.0.0

### Major Changes

- 3d0f5ed: Change `parse` and `parseRange` return signature to return structured `{ code, type, ranges }` object.

### Minor Changes

- 3d0f5ed: Add `format()`, `formatContentRange()`, `parseContentRange()`, and standalone `combineRanges()` exports, plus DoS limits `maxRanges` and `maxHeaderLength`.

### Patch Changes

- 3d0f5ed: Fix `combineRanges` original ordering when absorbing smaller ranges, clamp suffix ranges larger than file size, and fix malformed digit scanning.
