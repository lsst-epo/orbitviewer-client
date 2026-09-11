import IconComposer from "@rubin-epo/epo-react-lib/IconComposer";
/** Preserve the original viewer artwork where the shared library has no equivalent. */
export function Icon({ name }: { name: string }) {
  if (name === "search")
    return <IconComposer icon="Search" aria-hidden="true" />;
  return (
    <svg width="24" height="24" aria-hidden="true" fill="currentColor">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
