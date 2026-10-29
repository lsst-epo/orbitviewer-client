import type { FunctionComponent, SVGProps } from "react";

const Filters: FunctionComponent<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 19V17H9V19H3ZM3 7V5H13V7H3ZM11 21V15H13V17H21V19H13V21H11ZM7 15V13H3V11H7V9H9V15H7ZM11 13V11H21V13H11ZM15 9V3H17V5H21V7H17V9H15Z" />
  </svg>
);

export default Filters;
