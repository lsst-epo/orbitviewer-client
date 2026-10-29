"use client";

import { useState, type FunctionComponent } from "react";
import Navigation from "@/components/organisms/Navigation";
import Share from "@/components/organisms/Share";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import useClientTranslation from "@/lib/i18n/client";
import { useSolarData } from "@/contexts/SolarData";
import styles from "./styles.module.css";

const Chrome: FunctionComponent<{
  locale: string;
  tour: boolean;
}> = ({ locale, tour }) => {
  const { quality, setQuality } = useSolarData();
  const { t } = useClientTranslation(locale);
  const [sharing, setSharing] = useState(false);

  return (
    <>
      <Link className={styles.logo} href="/" aria-label={t("logo.alt")}>
        <Image
          src="/images/orbitviewer-logo.svg"
          alt=""
          width={65}
          height={40}
          priority
        />
      </Link>

      <Navigation
        locale={locale}
        onShare={() => setSharing(true)}
        quality={tour ? undefined : quality}
        onQualityChange={tour ? undefined : setQuality}
      />
      <Share locale={locale} open={sharing} onClose={() => setSharing(false)} />
    </>
  );
};

export default Chrome;
