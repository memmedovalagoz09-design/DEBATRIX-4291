/** Turns any thrown API error into a short Azerbaijani message. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Xəta baş verdi. Yenidən cəhd edin.";
}
