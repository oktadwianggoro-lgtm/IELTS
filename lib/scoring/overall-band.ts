/**
 * Official IELTS overall band rounding rule (ielts.org, "How IELTS is
 * scored" — see docs/SCORING.md for the full citation): the overall band
 * is the average of the four skill bands; if that average ends in .25 it
 * rounds UP to the next half band, and if it ends in .75 it rounds UP to
 * the next whole band. Every other fractional remainder rounds to the
 * nearest half band in the ordinary way.
 *
 * That full rule is exactly equivalent to "round the average to the
 * nearest 0.5, with .25/.75 (exact halfway points on the 0.5 grid)
 * breaking upward" — which is plain round-half-up at the 0.5 grid.
 * Verified against ielts.org's own worked examples: 6.25 -> 6.5,
 * 6.75 -> 7.0, 6.125 -> 6.0 (see tests).
 *
 * Implemented in integer "half-band units" (band * 2) throughout, only
 * dividing back down to a real band at the very end, so the result is
 * never affected by floating-point rounding of values like 0.25.
 */
export function calculateOverallBand(
  skillBands: readonly [number, number, number, number],
): number {
  const sumInHalfBandUnits = skillBands.reduce((sum, band) => sum + Math.round(band * 2), 0);
  const roundedHalfBandUnits = Math.round(sumInHalfBandUnits / 4);
  return roundedHalfBandUnits / 2;
}
