/**
 * GLSL sources are imported as raw strings via the raw-loader rules declared
 * in next.config.js under `turbopack.rules`.
 */
declare module "*.glsl" {
  const content: string;
  export default content;
}

declare module "*.vert" {
  const content: string;
  export default content;
}

declare module "*.frag" {
  const content: string;
  export default content;
}
