# GLSL chunks

The reusable shader functions the body, sun, effect and simulation shaders
`#include` — noise, curl, fbm, fresnel, glow — registered on three's global
`ShaderChunk` registry so no material has to duplicate the source.

`registerShaderChunks()` is idempotent and safe to call repeatedly, but **it
must run before any material that includes a chunk compiles**. That is why
callers invoke it at module scope rather than in an effect; see
`components/scene/README.md`.

## There is no codegen step any more

The legacy's `scripts/build/glsl.js` walked this directory at build time and
generated a barrel of string imports. Turbopack's raw-loader rule (see
`next.config.js`) makes that unnecessary — the `.glsl` files import directly
as strings.

## The identifiers are snake_case on purpose

The file disables the `camelcase` lint rule, with a reason attached. Chunk
identifiers must match the names used in `#include <name>` directives inside
the `.glsl` sources, which are snake_case by GLSL convention. **Renaming them
here breaks the shader includes**, and the failure is a compile error inside a
shader rather than anything TypeScript will catch.
