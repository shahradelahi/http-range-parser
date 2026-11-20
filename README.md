<h1 align="center">
  <sup>@se-oss/range-parser</sup>
  <br>
  <a href="https://github.com/shahradelahi/http-range-parser/actions/workflows/ci.yml"><img src="https://github.com/shahradelahi/http-range-parser/actions/workflows/ci.yml/badge.svg?branch=main&event=push" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@se-oss/range-parser"><img src="https://img.shields.io/npm/v/@se-oss/range-parser.svg" alt="NPM Version"></a>
  <a href="/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat" alt="MIT License"></a>
  <a href="https://bundlephobia.com/package/@se-oss/range-parser"><img src="https://img.shields.io/bundlephobia/minzip/@se-oss/range-parser" alt="npm bundle size"></a>
  <a href="https://packagephobia.com/result?p=@se-oss/range-parser"><img src="https://packagephobia.com/badge?p=@se-oss/range-parser" alt="Install Size"></a>
</h1>

_@se-oss/range-parser_ is a lightweight, fast parser for [HTTP Range headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests). It supports multi-range requests, range combination.

---

- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#license)

## 📦 Installation

```bash
npm install @se-oss/range-parser
```

<details>
<summary>Install using your favorite package manager</summary>

**pnpm**

```bash
pnpm install @se-oss/range-parser
```

**yarn**

```bash
yarn add @se-oss/range-parser
```

</details>

## 📖 Usage

### Parsing Range Headers

Parse HTTP Range header strings with bitmask status codes for valid, malformed, or unsatisfiable ranges.

```ts
import parse from '@se-oss/range-parser';

const size = 1000;
const result = parse(size, 'bytes=500-999');
console.log(result);
// { code: 0, type: 'bytes', ranges: [ { start: 500, end: 999 } ] }
```

### Combining Overlapping Ranges

Merge overlapping or adjacent range requests inline or standalone.

```ts
import parse, { combineRanges } from '@se-oss/range-parser';

// Inline combine option
const multi = parse(150, 'bytes=0-4,90-99,5-75,100-199,101-102', {
  combine: true,
});
console.log(multi);
// { code: 0, type: 'bytes', ranges: [ { start: 0, end: 75 }, { start: 90, end: 149 } ] }

// Standalone combine
const combined = combineRanges([
  { start: 0, end: 10 },
  { start: 5, end: 20 },
]);
console.log(combined);
// [ { start: 0, end: 20, index: 0 } ]
```

### Formatting Range Headers

Format type and ranges back into an HTTP Range header string.

```ts
import { format } from '@se-oss/range-parser';

const header = format({
  type: 'bytes',
  ranges: [{ start: 0, end: 499 }],
});
console.log(header);
// 'bytes=0-499'
```

### Content-Range Helpers

Format and parse Content-Range headers for partial content responses.

```ts
import { formatContentRange, parseContentRange } from '@se-oss/range-parser';

// Format 206 response header
const contentRange = formatContentRange({ start: 0, end: 499, size: 1000 });
console.log(contentRange);
// 'bytes 0-499/1000'

// Parse response header
const parsed = parseContentRange('bytes 0-499/1000');
console.log(parsed);
// { type: 'bytes', start: 0, end: 499, size: 1000 }
```

## 📚 Documentation

For all configuration options, please see [the API docs](https://www.jsdocs.io/package/@se-oss/range-parser).

## 🤝 Contributing

Want to contribute? Awesome! To show your support is to star the project, or to raise issues on [GitHub](https://github.com/shahradelahi/http-range-parser).

Thanks again for your support, it is much appreciated! 🙏

## License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi) and [contributors](https://github.com/shahradelahi/http-range-parser/graphs/contributors).
