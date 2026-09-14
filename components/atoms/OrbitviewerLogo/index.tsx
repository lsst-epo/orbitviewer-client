import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import styles from "./styles.module.css";

export function OrbitviewerLogo({ toolbar = false }: { toolbar?: boolean }) {
  return (
    <Link
      href="/explorer"
      className={styles.logo}
      data-toolbar={toolbar}
      aria-label="Orbitviewer"
    >
      <Image
        src="/images/orbitviewer-logo.svg"
        alt="Orbitviewer"
        width={65}
        height={40}
        priority
      />
    </Link>
  );
}
