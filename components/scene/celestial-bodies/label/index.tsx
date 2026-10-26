"use client";

import { useRef, type CSSProperties, type FunctionComponent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Vector3 } from "three";
import Icon, { type IconName } from "@/components/atoms/Icon";
import type { SolarCategory } from "@/lib/solar/types";
import styles from "./styles.module.css";

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
        // Not drei's `center`: the disc is what sits on the object, and the
        // label offsets itself in CSS -- see README.
        // Over the scene but under the interface panels; drei's default of 16
        // put them over the splash scrim and the panels.
        zIndexRange={[2, 0]}
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
