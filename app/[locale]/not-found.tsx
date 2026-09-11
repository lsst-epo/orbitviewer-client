import { FunctionComponent } from "react";
import { Link } from "@/lib/i18n/navigation";

const NotFound: FunctionComponent = () => (
  <main>
    <h1>404</h1>
    <Link href="/">Orbit viewer</Link>
  </main>
);

export default NotFound;
