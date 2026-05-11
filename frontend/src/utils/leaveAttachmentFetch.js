import { STORAGE_KEYS } from "../constants/storage";

/** Baris pengajuan cuti dari API punya lampiran blob dan/atau URL lama. */
export function leaveRowHasAttachment(row) {
  if (!row) return false;
  return !!(row.has_attachment || row.attachment_url);
}

export function legacyAttachmentHref(apiBaseUrl, row) {
  if (!row?.attachment_url || row.has_attachment) return null;
  if (typeof row.attachment_url !== "string") return null;
  if (row.attachment_url.startsWith("http")) return row.attachment_url;
  const base = (apiBaseUrl || "").replace(/\/$/, "");
  const path = row.attachment_url.startsWith("/")
    ? row.attachment_url
    : `/${row.attachment_url}`;
  return `${base}${path}`;
}

/**
 * Mengambil lampiran dengan header Authorization (wajib untuk BYTEA).
 * @param {'hrd'|'employee'} scope
 * @returns {{ objectURL: string, contentType: string }}
 */
export async function fetchLeaveAttachmentWithMeta(apiBaseUrl, scope, leaveId) {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const base = (apiBaseUrl || "").replace(/\/$/, "");
  const url = `${base}/${scope}/leaves/${leaveId}/attachment`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j.error) msg = j.error;
    } catch (_) {
      /* ignore */
    }
    throw new Error(msg);
  }
  const contentType = res.headers.get("Content-Type") || "";
  const blob = await res.blob();
  const objectURL = URL.createObjectURL(blob);
  return { objectURL, contentType };
}

/** Pratinjau gambar dari nama file / path / MIME. */
export function isImageAttachmentHint({ row, fetchedContentType }) {
  if (fetchedContentType && fetchedContentType.startsWith("image/")) return true;
  const nameOrPath =
    (row?.attachment_filename || row?.attachment_url || "").trim();
  if (!nameOrPath) return false;
  return /\.(jpe?g|png|gif|webp)$/i.test(nameOrPath);
}
