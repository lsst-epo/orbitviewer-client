import type { ButtonHTMLAttributes } from "react";
import styles from "./styles.module.css";
// epo-react-lib's Button currently requires Styled Components. Keep this CSS
// module primitive until the library offers a compatible styling implementation.
export function Button({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${styles.button} ${className}`}
      type={type}
      {...props}
    />
  );
}
