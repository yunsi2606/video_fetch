import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VidFetch – Download Videos từ YouTube, TikTok, Facebook & Shopee",
  description: "Tải video chất lượng cao từ YouTube, TikTok, Facebook Reels và Shopee. Chọn chất lượng 1080p, 720p, 480p hoặc chỉ audio MP3. Miễn phí, nhanh chóng.",
  keywords: ["video downloader", "tải video youtube", "tải video tiktok", "facebook reels downloader", "shopee video download"],
  openGraph: {
    title: "VidFetch – Video Downloader",
    description: "Tải video từ YouTube, TikTok, Facebook, Shopee chất lượng cao",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
