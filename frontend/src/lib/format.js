/** Normalisasi nilai dari API (string vs objek Go/sql style) */
export function getStr(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && "String" in val) return val.String || "";
  return String(val);
}
