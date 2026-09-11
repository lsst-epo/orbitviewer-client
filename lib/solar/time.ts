/**
 * Julian date conversions.
 *
 * Replaces the legacy `SolarTime` class. That class cached its last result in
 * a private field that nothing read back, so these are plain functions.
 */

const JD_UNIX_EPOCH = 2440587.5;
const MJD_OFFSET = 2400000.5;
const MS_PER_DAY = 86400000;

export const JD2MJD = (jd: number): number => jd - MJD_OFFSET;

export const MJD2JD = (mjd: number): number => mjd + MJD_OFFSET;

/** Julian Date for a JavaScript Date. */
export const dateToJD = (date: Date = new Date()): number =>
  date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;

/** Modified Julian Date for a JavaScript Date. This is the `d` the propagators take. */
export const dateToMJD = (date: Date = new Date()): number =>
  JD2MJD(dateToJD(date));

export const JD2Date = (jd: number): Date =>
  new Date((jd - JD_UNIX_EPOCH) * MS_PER_DAY);

export const MJD2Date = (mjd: number): Date => JD2Date(MJD2JD(mjd));
