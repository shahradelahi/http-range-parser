# @se-oss/range-parser

[![CI](https://github.com/shahradelahi/http-range-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/shahradelahi/http-range-parser/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/@se-oss/range-parser.svg)](https://www.npmjs.com/package/@se-oss/range-parser)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](/LICENSE)
[![Install Size](https://packagephobia.com/badge?p=@se-oss/range-parser)](https://packagephobia.com/result?p=@se-oss/range-parser)

_@se-oss/range-parser_ is a lightweight, fast parser for [HTTP Range headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests). It supports multi-range requests, range combination.

---

- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Credits](#-credits)
- [License](#license)

## 📦 Installation

```bash
npm i @se-oss/range-parser
```

## 📖 Usage

```typescript
import { parseRange } from '@se-oss/range-parser';

const size = 1000;
const str = 'bytes=500-999';
console.log(parseRange(size, str));
// [ { start: 500, end: 999 }, type: 'bytes' ]

const multi = 'bytes=0-4,90-99,5-75,100-199,101-102';
console.log(parse(150, multi, { combine: true }));
// [ { start: 0, end: 75 }, { start: 90, end: 149 }, type: 'bytes' ]
```

## 📚 Documentation

For all configuration options, please see [the API docs](https://www.jsdocs.io/package/@se-oss/range-parser).

##### API

<!-- prettier-ignore -->
```typescript
/**
 * Parse "Range" header `str` relative to the given file `size`.
 *
 * @param size - The size of the file.
 * @param str - The Range header string.
 * @param options - Optional configuration.
 * @returns Array of ranges if valid, -1 for unsatisfiable ranges, or -2 for malformed header.
 */
declare function parseRange(size: number, str: string, options?: RangeParserOptions): RangeArray | -1 | -2;
```

## 🤝 Contributing

Want to contribute? Awesome! To show your support is to star the project, or to raise issues on [GitHub](https://github.com/shahradelahi/http-range-parser).

Thanks again for your support, it is much appreciated! 🙏

## 🙌 Credits

This package is a [TypeScript](https://www.typescriptlang.org/) port of [jshttp/range-parser](https://github.com/jshttp/range-parser/) with support for both [CommonJS](https://nodejs.org/api/modules.html) and [ECMAScript](https://nodejs.org/api/esm.html) modules.

## License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi) and [contributors](https://github.com/shahradelahi/http-range-parser/graphs/contributors).
