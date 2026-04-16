'use client';

import { useState } from 'react';
import UrlInput from './components/UrlInput';
import VideoResult from './components/VideoResult';
import LoadingSkeleton from './components/LoadingSkeleton';
import { VideoInfo } from './types';
import styles from './page.module.css';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const handleSubmit = async (url: string, includeWatermark: boolean) => {
    setIsLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await fetch('/api/fetch-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, includeWatermark }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy thông tin video');
      }

      setVideoInfo(data as VideoInfo);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi không mong muốn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background decorations */}
      <div className={styles.bgDecor1} aria-hidden />
      <div className={styles.bgDecor2} aria-hidden />

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoIcon}>⬇</div>
            <div>
              <h1 className={styles.logoText}>
                Vid<span className={styles.logoAccent}>Fetch</span>
              </h1>
              <p className={styles.logoSub}>Video Downloader</p>
            </div>
          </div>

          <p className={styles.tagline}>
            Tải video chất lượng cao từ <strong>YouTube</strong>, <strong>TikTok</strong>,{' '}
            <strong>Facebook</strong> & <strong>Shopee</strong> — miễn phí, nhanh chóng
          </p>
        </header>

        {/* Main input */}
        <main className={styles.main}>
          <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />

          {/* Error state */}
          {error && !isLoading && (
            <div className={styles.errorCard + ' animate-fade-in-up'} role="alert">
              <span className={styles.errorIcon}>⚠</span>
              <div>
                <p className={styles.errorTitle}>Không thể tải video</p>
                <p className={styles.errorMsg}>{error}</p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && <LoadingSkeleton />}

          {/* Results */}
          {videoInfo && !isLoading && <VideoResult info={videoInfo} />}
        </main>

        {/* How-to section */}
        {!videoInfo && !isLoading && !error && (
          <section className={styles.howTo + ' animate-fade-in'}>
            <h2 className={styles.howToTitle}>Cách sử dụng</h2>
            <div className={styles.steps}>
              {[
                { icon: '🔗', title: 'Sao chép link', desc: 'Copy link video từ YouTube, TikTok, Facebook hoặc Shopee' },
                { icon: '📋', title: 'Dán vào đây', desc: 'Dán link vào ô nhập phía trên rồi nhấn "Lấy link tải xuống"' },
                { icon: '🎬', title: 'Chọn chất lượng', desc: 'Chọn độ phân giải phù hợp: 1080p, 720p, 480p hoặc Audio MP3' },
                { icon: '⬇', title: 'Tải xuống', desc: 'Nhấn nút tải xuống hoặc sao chép link trực tiếp' },
              ].map((step, i) => (
                <div key={i} className={styles.step}>
                  <span className={styles.stepIcon}>{step.icon}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className={styles.footer}>
          <p>
            © 2025 VidFetch — Chỉ dùng cho mục đích cá nhân, tôn trọng bản quyền nội dung.
          </p>
        </footer>
      </div>
    </div>
  );
}
