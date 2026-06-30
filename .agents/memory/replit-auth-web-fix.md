---
name: Replit Auth web lib fix
description: replit-auth-web is a composite lib, not a Vite artifact — it cannot use vite/client types or import.meta.env.
---

## Rule

The `lib/replit-auth-web` package is a composite TypeScript lib, NOT a Vite artifact. Its `tsconfig.json` must NOT include `"types": ["vite/client"]` because `vite` is not installed in that package.

**Why:** The lib is consumed by Vite artifacts, but is itself compiled by `tsc --build` as a composite lib. Adding `vite/client` to its types causes TS2688 ("Cannot find type definition file") because `vite` is not a dependency of the lib.

**How to apply:** The template file `lib/replit-auth-web/src/use-auth.ts` ships with `import.meta.env.BASE_URL` in the `login()` function. Remove that usage and replace with a hardcoded `"/"` or a passed-in base URL parameter instead. The tsconfig for this lib should remain as-is (no vite types).
