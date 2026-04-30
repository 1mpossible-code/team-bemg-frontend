# Security

## Reporting a vulnerability

If you discover a security issue, please open a GitHub issue with **minimal details** and request a private follow-up, or contact the maintainers out-of-band if available.

## Dependency security status

This project is built on Create React App (`react-scripts`) and its webpack toolchain. Some transitive vulnerabilities reported by `npm audit` can be difficult to fully eliminate without migrating off CRA (or doing major upgrades that are out of scope at end-of-project).

What we do instead:

- Keep direct dependencies updated when safe.
- Use npm `overrides` to pin patched transitive dependencies where possible.
- Generate an `npm audit` JSON report in CI (uploaded as an artifact) for visibility.

If you need to fully remediate remaining toolchain findings, the recommended path is to migrate off CRA (e.g. to Vite or Next.js) and re-audit.
