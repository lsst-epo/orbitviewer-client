import { FunctionComponent } from "react";
import { isProduction } from "@/env";
import styles from "./styles.module.css";

/**
 * Renders nothing in production. The legacy `head.njk` compared ENVIRONMENT
 * against "production" while `_debug.scss` compared against "prod" -- the
 * known bug called out in the port plan. "prod" is the single sentinel here.
 */
const DebugViewport: FunctionComponent = () => {
  if (isProduction) return null;

  return <div className={styles.debug} aria-hidden="true" />;
};

export default DebugViewport;
