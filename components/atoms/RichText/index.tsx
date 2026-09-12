import type { FunctionComponent } from "react";
import clsx from "clsx/lite";
import styles from "./styles.module.css";

/**
 * Craft CKEditor output.
 *
 * The CMS is the only source of this HTML, so it is trusted -- the same
 * assumption the legacy made with `| safe` in every template. It is
 * centralised here so the trust boundary is one file rather than a
 * `dangerouslySetInnerHTML` at every call site, and so the typography for
 * authored copy is defined once.
 *
 * Renders nothing at all when there is no content, rather than an empty
 * wrapper that would still take its margins.
 */

export interface RichTextProps {
  html?: string | null;
  className?: string;
  /** Larger type, for a page's opening paragraph. */
  size?: "default" | "lead";
}

const RichText: FunctionComponent<RichTextProps> = ({
  html,
  className,
  size = "default",
}) => {
  if (!html?.trim()) return null;

  return (
    <div
      className={clsx(
        styles.richText,
        size === "lead" && styles.lead,
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default RichText;
