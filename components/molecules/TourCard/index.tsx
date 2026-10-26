import type { FunctionComponent } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { difficultyKey, type TourSummary } from "@/lib/tours";
import styles from "./styles.module.css";

export interface TourCardProps {
  tour: TourSummary;
  /** Translated labels; the card is a server component and takes them ready. */
  labels: {
    difficulty: string;
    duration: string;
    recommended: string;
  };
}

const TourCard: FunctionComponent<TourCardProps> = ({ tour, labels }) => {
  const preview = tour.tourPreview?.[0];

  return (
    <Link
      className={styles.card}
      href={`/guided-experiences/${tour.slug}`}
      aria-label={`${tour.title}. ${labels.difficulty}. ${labels.duration}.`}
    >
      <div className={styles.hero}>
        {preview?.url && (
          <Image
            className={styles.image}
            src={preview.url}
            alt={preview.alt ?? ""}
            width={preview.width ?? 600}
            height={preview.height ?? 338}
            sizes="(max-width: 48rem) 100vw, 20rem"
          />
        )}
        {tour.featuredTour && (
          <span className={styles.ribbon}>{labels.recommended}</span>
        )}
      </div>

      <div className={styles.text}>
        <p className={styles.meta} aria-hidden>
          <span className={styles.chipPrimary}>{labels.difficulty}</span>
          <span className={styles.chip}>{labels.duration}</span>
        </p>
        <h2 className={styles.title}>{tour.title}</h2>
      </div>
    </Link>
  );
};

export { difficultyKey };
export default TourCard;
