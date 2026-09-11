/**
 * Aliased in next.config.js to epo-react-lib's dist/localeStrings directory.
 */
declare module "@epo-locale-strings/*" {
  const content: Record<string, unknown>;
  export default content;
}
