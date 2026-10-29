import { FunctionComponent } from "react";
import { isProduction } from "@/env";
import styles from "./styles.module.css";

/** Renders nothing in production. */
const DebugViewport: FunctionComponent = () => {
  if (isProduction) return null;

  return <div className={styles.debug} aria-hidden="true" />;
};

export default DebugViewport;
