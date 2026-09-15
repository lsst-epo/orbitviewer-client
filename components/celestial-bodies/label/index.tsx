"use client";

import { useRef, type CSSProperties, type FunctionComponent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Vector3 } from "three";
import Icon, { type IconName } from "@/components/atoms/Icon";
import type { SolarCategory } from "@/lib/solar/types";
import styles from "./styles.module.css";

/**
 * The clickable name that floats beside a named body.
 *
 * Ported from `gfx/solar/SolarDomElement.ts` and `components/pointer.njk`,
 * which projected an absolutely positioned anchor over the canvas and moved
 * it every frame by writing `transform: translate(...)` from screen
 * coordinates it computed itself.
 *
 * drei's <Html> does the projection, so what is left is the part that was
 * actually bespoke: hiding the label when the body is behind the camera, and
 * standing down for the body that is already selected.
 *
 * The category glyph sits in a disc filled with the category's colour, as
 * `.canvas_pointer-icon` did. That is what makes one category tell apart from
 * another at a glance; drawn as a bare 14px outline, as this first was, every
 * glyph in the set collapses into the same grey smudge.
 *
 * The legacy's label was an `<a href>` into a per-object route. Selection is
 * a search param now, so this is a button -- it changes the view rather than
 * navigating, and a link that does not navigate is a lie to anyone using a
 * keyboard or a screen reader.
 */

export interface BodyLabelProps {
  id: string;
  name: string;
  category?: SolarCategory;
  /** Colour from Craft's objectTypes group. */
  color?: string | null;
  /** Scene radius, so the label clears the body's disc. */
  radius: number;
  onSelect: (id: string) => void;
}

/** Extra clearance above the body, as a multiple of its radius. */
const OFFSET = 1.6;

const BodyLabel: FunctionComponent<BodyLabelProps> = ({
  id,
  name,
  category,
  color,
  radius,
  onSelect,
}) => {
  const groupRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera);
  const world = useRef(new Vector3());
  const forward = useRef(new Vector3());

  /**
   * Hidden behind the camera. <Html> projects with the same matrix whether a
   * point is in front of the camera or behind it, so without this the label
   * reappears mirrored on the far side of the screen -- the bug the legacy
   * guarded against with `isBehindCamera()`.
   */
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    group.getWorldPosition(world.current);
    camera.getWorldDirection(forward.current);

    group.visible = world.current.sub(camera.position).dot(forward.current) > 0;
  });

  return (
    <group ref={groupRef} position={[0, radius * OFFSET, 0]}>
      <Html
        center
        // Labels sit over the scene but under the interface panels.
        zIndexRange={[10, 0]}
        // Without this the label swallows orbit drags that pass across it.
        pointerEvents="none"
      >
        <button
          type="button"
          className={styles.pointer}
          style={
            color ? ({ "--pointer-color": color } as CSSProperties) : undefined
          }
          onClick={() => onSelect(id)}
        >
          {category && (
            <span className={styles.chip} aria-hidden>
              <Icon name={category as IconName} className={styles.icon} />
            </span>
          )}
          <span className={styles.text}>{name}</span>
        </button>
      </Html>
    </group>
  );
};

export default BodyLabel;
