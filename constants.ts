export const LINKS = {
  TELEGRAM: "https://t.me/JubairSensei",
  YOUTUBE: "https://youtube.com/@jubairsensei?si=UDecDkx9aVk_RtSA",
};

// Cloudflare speed test endpoints are reliable for high bandwidth
// Using a large file size to keep the stream open as long as possible per request
export const DOWNLOAD_URL = "https://speed.cloudflare.com/__down?bytes=50000000"; // 50MB chunks
