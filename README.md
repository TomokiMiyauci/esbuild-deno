# esbuild-deno

All in one solution using deno with [esbuild](https://github.com/evanw/esbuild).

This project provides a comprehensive way to reflect deno config in
[esbuild](https://github.com/evanw/esbuild) and bundle it with deno context.

Provides the following features:

- [Initialization of compiler options](#initialization-of-compiler-options)<!-- no toc -->
- [Import map resolution](#import-map-resolution)
- [Module specifier resolution](#module-specifier-resolution)

## Table of Contents <!-- omit in toc -->

- [Install](#install)
- [Usage](#usage)
  - [Deno Config as Value](#deno-config-as-value)
- [Documentation](#documentation)
  - [Initialization of Compiler Options](#initialization-of-compiler-options)
  - [Import Map Resolution](#import-map-resolution)
  - [Module Specifier Resolution](#module-specifier-resolution)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Install

deno:

```bash
deno add @miyauci/esbuild-deno
```

## Usage

The `config.location` is the deno config location. It can be `URL` object or
`string`.

```ts
import { denoPlugin } from "@miyauci/esbuild-deno";
import { build } from "esbuild";

await build({
  stdin: {
    contents: `import "jsr:@std/assert";`,
  },
  format: "esm",
  bundle: true,
  plugins: [denoPlugin({ config: { location: "path/to/deno.json" } })],
});
```

If only location is specified, deno config is automatically fetched.

### Deno Config as Value

You can specify the deno config as a value in `config.value`.

```ts
import { type DenoConfig, denoPlugin } from "@miyauci/esbuild-deno";
import { build } from "esbuild";

declare const location: URL | string;
const denoConfig = {
  compilerOptions: {
    jsx: "react-jsx",
  },
  imports: {
    "react": "npm:react",
  },
} satisfies DenoConfig;

await build({
  stdin: {
    contents: `const node = <div>Hello</div>;`,
    loader: "tsx",
    resolveDir: import.meta.dirname,
  },
  format: "esm",
  bundle: true,
  plugins: [
    denoPlugin({ config: { value: denoConfig, location } }),
  ],
});
```

## Documentation

Plugin adds the following functions, in the order listed.

### Initialization of Compiler Options

Deno config's `compilerOptions` field is reflected in esbuild's `tsConfigRaw`
field.

Note that if there are other plugins that reference `tsConfigRaw`, this plugin
should be added first.

```ts
import { denoPlugin } from "@miyauci/esbuild-deno";
import { build, type Plugin } from "esbuild";

declare const tsConfigRawDependantPlugin: Plugin;

await build({
  plugins: [denoPlugin(), tsConfigRawDependantPlugin],
});
```

### Import Map Resolution

Register the import-map key to esbuild `onResolve` hook.

The `imports` field in import-map is pre-extended. This behavior matches some
features added since Deno 1.40.0.

See
[Simpler imports in `deno.json`](https://deno.com/blog/v1.40#simpler-imports-in-denojson)
for details.

### Module Specifier Resolution

Add a hook to esbuild that resolves the following specifier:

- `jsr:`
- `npm:`
- `http:` or `https:`
- `data:`
- `node:`
- `file:`

See
[esbuild-deno-specifier](https://github.com/TomokiMiyauci/esbuild-deno-specifier)
for details.

## API

See [jsr doc](https://jsr.io/@miyauci/esbuild-deno) for all APIs.

## Contributing

See [contributing](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2024 Tomoki Miyauchi
