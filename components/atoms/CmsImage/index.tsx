import type { ImgHTMLAttributes } from "react";
/** Craft already transforms these assets to WebP at their requested width. */
export function CmsImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img loading="lazy" {...props} alt={props.alt ?? ""} />;
}
