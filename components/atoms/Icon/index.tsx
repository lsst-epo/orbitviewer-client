import IconComposer from "@rubin-epo/epo-react-lib/IconComposer";
/** Preserve the original viewer artwork where the shared library has no equivalent. */
export function Icon({ name }: { name: string }) {
  if (name === "check")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="m5 12 4 4L19 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  if (name === "search")
    return <IconComposer icon="Search" aria-hidden="true" />;
  return (
    <svg width="24" height="24" aria-hidden="true" fill="currentColor">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
