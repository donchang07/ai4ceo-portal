// Design Ref: PRD 6.4 — Google Drive integration is URL-only in this MVP.
// No googleapis auto-upload / permission sync. Admin pastes a Drive share link;
// videos/materials store the URL and the UI renders a read-only embed slot.

const STANDARD_ROOT = "/ceo_ai_coding";

export function driveVideoFolderPath(cohortLabel: string): string {
  return `${STANDARD_ROOT}/ceo_${cohortLabel}기/강의비디오/`;
}

export function toDrivePreviewUrl(shareUrl: string | null | undefined): string | null {
  if (!shareUrl) return null;
  // Convert a Drive share link to a preview/embeddable URL when possible.
  const m = shareUrl.match(/\/d\/([A-Za-z0-9_-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return shareUrl;
}

export function isDriveUrl(url: string | null | undefined): boolean {
  return !!url && /drive\.google\.com/.test(url);
}
