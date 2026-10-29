import type { FunctionComponent } from "react";
import clsx from "clsx/lite";
import styles from "./styles.module.css";

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
      // Craft CKEditor output only. This is the one trusted-HTML boundary in
      // the app -- see README.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default RichText;
