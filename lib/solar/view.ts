export interface CameraView {
  position: [number, number, number];
  target: [number, number, number];
}

/** Reject malformed/out-of-range shared coordinates before touching the camera. */
export function parseCameraView(
  params: URLSearchParams,
): CameraView | undefined {
  const values = ["x", "y", "z", "tx", "ty", "tz"].map((key) => {
    const value = params.get(key);
    return value === null ? NaN : Number(value);
  });
  if (
    !values.every((value) => Number.isFinite(value) && Math.abs(value) <= 10000)
  )
    return;
  const [x, y, z, tx, ty, tz] = values;
  if (Math.hypot(x - tx, y - ty, z - tz) < 0.00001) return;
  return { position: [x, y, z], target: [tx, ty, tz] };
}
export function sharedViewUrl(
  url: string,
  mjd: number,
  camera: CameraView | null,
) {
  const result = new URL(url);
  result.searchParams.set("mjd", mjd.toFixed(6));
  if (camera) {
    const values = [...camera.position, ...camera.target];
    ["x", "y", "z", "tx", "ty", "tz"].forEach((key, index) =>
      result.searchParams.set(key, values[index].toPrecision(9)),
    );
  }
  return result.href;
}
