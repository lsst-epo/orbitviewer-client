/**
 * Render layers.
 *
 * three's layer mask lets the compositor render a subset of the scene by
 * switching the camera's layers, rather than reparenting objects into a
 * separate scene the way the legacy `RubinRenderer` did. Moving objects
 * between scenes each frame would fight React's ownership of the scene graph.
 */

/** Everything the main pass draws. three's default. */
export const DEFAULT_LAYER = 0;

/**
 * The sun's fire pass: its halo and magnetic field.
 *
 * Objects on this layer are invisible to the main camera and are drawn only
 * when the compositor switches the camera over, so they never appear
 * un-blurred.
 */
export const FIRE_LAYER = 1;
