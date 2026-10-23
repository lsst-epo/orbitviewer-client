import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import styles from "./styles.module.css";

export function OrbitviewerLogo() {
  return (
    <Link href="/explorer" className={styles.logo} aria-label="Orbitviewer">
      <Image
        src="/images/orbitviewer-logo.svg"
        alt="Orbitviewer"
        width={62}
        height={38}
        priority
      />
    </Link>
  );
}
