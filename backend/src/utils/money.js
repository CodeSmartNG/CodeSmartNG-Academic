/**
 * Naira is the display currency; kobo is the storage unit.
 * 1 Naira = 100 kobo.
 * All money fields in the DB are integers (kobo).
 */

export const nairaToKobo = (naira) => {
  const n = Number(naira);
  if (isNaN(n)) throw new Error("Invalid amount");
  return Math.round(n * 100);
};

export const koboToNaira = (kobo) => {
  const k = Number(kobo);
  if (isNaN(k)) return 0;
  return k / 100;
};

export const formatNaira = (kobo) => {
  const naira = koboToNaira(kobo);
  return `₦${naira.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
