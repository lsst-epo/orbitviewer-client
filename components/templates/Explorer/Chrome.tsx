"use client";

import { useState, type FunctionComponent } from "react";
import Navigation from "@/components/organisms/Navigation";
import Share from "@/components/organisms/Share";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import useClientTranslation from "@/lib/i18n/client";
import { useSolarData } from "@/contexts/SolarData";
import styles from "./chrome.module.css";

/**
 * The navigation and the share dialog.
 *
 * Together because the menu owns the share trigger, and because both need the
 * data contexts -- quality from SolarData, params and clock for the link.
 *
 * Present during a tour as well: a reader still needs a way out and a
 * language switch. The exploration-mode item is not offered there, since
 * swapping datasets mid-tour would reload the scene under the slide.
 */
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
