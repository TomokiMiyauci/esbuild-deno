export interface ImportMap {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

export interface DenoConfig extends ImportMap {
  importMap?: string;
  nodeModulesDir?: boolean;
  compilerOptions?: CompilerOptions;
}

export interface CompilerOptions {
  /** Specify what JSX code is generated. */
  jsx?: JSX;

  /** Specify the JSX factory function used when targeting React JSX emit, e.g. 'React.createElement' or 'h'
   *
   * See more: https://www.typescriptlang.org/tsconfig#jsxFactory
   */
  jsxFactory?: string;

  /** Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g. 'React.Fragment' or 'Fragment'.
   *
   * See more: https://www.typescriptlang.org/tsconfig#jsxFragmentFactory
   */
  jsxFragmentFactory?: string;

  /** Specify module specifier used to import the JSX factory functions when using jsx: react-jsx*.
   *
   * See more: https://www.typescriptlang.org/tsconfig/#jsxImportSource
   */
  jsxImportSource?: string;
}

export type JSX =
  | "precompile"
  | "preserve"
  | "react"
  | "react-jsx"
  | "react-jsxdev"
  | "react-native";
