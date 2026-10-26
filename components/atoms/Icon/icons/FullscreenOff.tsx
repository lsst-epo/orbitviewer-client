import type { FunctionComponent, SVGProps } from "react";

const FullscreenOff: FunctionComponent<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M5 16H8V19H10V14H5V16ZM8 8H5V10H10V5H8V8ZM14 19H16V16H19V14H14V19ZM16 8V5H14V10H19V8H16Z" />
  </svg>
);

export default FullscreenOff;
