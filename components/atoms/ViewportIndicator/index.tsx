import styles from "./styles.module.css";
export function ViewportIndicator() {
  if (process.env.ENVIRONMENT === "prod") return null;
  return <span className={styles.indicator} aria-hidden="true" />;
}
