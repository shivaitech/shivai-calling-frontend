/**
 * The card's intro video: a YouTube or Vimeo link, or a direct link to a video file. Parsed into
 * what the card needs to play it inline (an embed id or the file's address).
 */
export type CardVideo =
  | { kind: "youtube"; id: string; vertical: boolean }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; src: string };

const YOUTUBE = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i;
const VIMEO = /vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d{5,})/i;
const FILE = /^https:\/\/[^\s?#]+\.(?:mp4|webm|mov|m4v)(?:[?#]\S*)?$/i;

export function parseVideo(input?: string | null): CardVideo | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const yt = YOUTUBE.exec(url);
  if (yt) return { kind: "youtube", id: yt[1], vertical: /\/shorts\//i.test(url) };
  const vm = VIMEO.exec(url);
  if (vm) return { kind: "vimeo", id: vm[1] };
  if (FILE.test(url)) return { kind: "file", src: url };
  return null;
}

/** The link saved for a video, always https. */
export const videoLink = (input: string) => {
  const raw = input.trim();
  return /^https?:\/\//i.test(raw) ? raw.replace(/^http:/i, "https:") : `https://${raw}`;
};

export const VIDEO_HELP = "Paste a YouTube or Vimeo link, or a link to an .mp4 video.";
