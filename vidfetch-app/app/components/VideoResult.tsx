'use client';

import { useState } from 'react';
import { VideoInfo, DownloadOption } from '../types';
import styles from './VideoResult.module.css';

interface VideoResultProps {
  info: VideoInfo;
}

const PLATFORM_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  YouTube: { color: '#ff0000', bgColor: 'rgba(255,0,0,0.15)', icon: '▶' },
  TikTok: { color: '#69c9d0', bgColor: 'rgba(105,201,208,0.15)', icon: '♪' },
  Facebook: { color: '#1877f2', bgColor: 'rgba(24,119,242,0.15)', icon: 'f' },
  Shopee: { color: '#ee4d2d', bgColor: 'rgba(238,77,45,0.15)', icon: '🛍' },
  Unknown: { color: '#888', bgColor: 'rgba(128,128,128,0.15)', icon: '▶' },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getQualityBadge(quality: string): { text: string; class: string } {
  const q = quality.toLowerCase();
  if (q.includes('1080') || q === 'hd') return { text: 'HD', class: styles.badgeHD };
  if (q.includes('720')) return { text: 'HD', class: styles.badgeHD };
  if (q.includes('480') || q.includes('sd')) return { text: 'SD', class: styles.badgeSD };
  if (q.includes('360') || q.includes('low')) return { text: 'SD', class: styles.badgeSD };
  if (q === 'audio') return { text: 'MP3', class: styles.badgeAudio };
  if (q === 'wm') return { text: 'WM', class: styles.badgeWM };
  return { text: quality.toUpperCase(), class: styles.badgeSD };
}

export default function VideoResult({ info }: VideoResultProps) {
  const [selectedOption, setSelectedOption] = useState<DownloadOption | null>(
    info.downloadOptions[0] || null
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const platform = PLATFORM_CONFIG[info.platform] || PLATFORM_CONFIG.Unknown;

  const handleCopyLink = async () => {
    if (!selectedOption) return;
    try {
      await navigator.clipboard.writeText(selectedOption.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = selectedOption.url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleDownload = () => {
    if (!selectedOption || isDownloading) return;

    setIsDownloading(true);

    const safeTitle = info.title.replace(/[^\wáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ\s]/gi, '').trim();
    const filename = `${safeTitle}_${selectedOption.quality}.${selectedOption.ext || 'mp4'}`;

    // Use proxy API to force download (bypasses CORS)
    const proxyUrl = `/api/download?url=${encodeURIComponent(selectedOption.url)}&filename=${encodeURIComponent(filename)}`;

    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Reset after short delay
    setTimeout(() => setIsDownloading(false), 3000);
  };

  const videoOptions = info.downloadOptions.filter(o => o.type === 'video');
  const audioOptions = info.downloadOptions.filter(o => o.type === 'audio');

  return (
    <div className={styles.container + ' animate-fade-in-up'}>
      {/* Video preview */}
      <div className={styles.preview}>
        <div className={styles.thumbnailWrapper}>
          {!thumbnailError && info.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.thumbnailUrl}
              alt={info.title}
              className={styles.thumbnail}
              onError={() => setThumbnailError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={styles.thumbnailFallback}>
              <span>{platform.icon}</span>
            </div>
          )}
          {info.duration && (
            <span className={styles.duration}>{formatDuration(info.duration)}</span>
          )}
        </div>

        <div className={styles.meta}>
          <span
            className={styles.platformBadge}
            style={{ color: platform.color, background: platform.bgColor }}
          >
            <span>{platform.icon}</span>
            {info.platform}
          </span>

          <h2 className={styles.title}>{info.title}</h2>

          {info.author && (
            <p className={styles.author}>
              <span>👤</span> {info.author}
            </p>
          )}
        </div>
      </div>

      {/* Quality selector */}
      <div className={styles.qualitySection}>
        {/* Video options */}
        {videoOptions.length > 0 && (
          <>
            <p className={styles.sectionLabel}>
              🎬 Chọn chất lượng video
            </p>
            <div className={styles.qualityGrid}>
              {videoOptions.map((option, idx) => {
                const badge = getQualityBadge(option.quality);
                const isSelected = selectedOption?.url === option.url;
                return (
                  <button
                    key={idx}
                    id={`quality-option-${idx}`}
                    className={`${styles.qualityCard} ${isSelected ? styles.qualityCardActive : ''}`}
                    onClick={() => setSelectedOption(option)}
                    title={option.hasWatermark ? 'Có watermark TikTok' : undefined}
                  >
                    <div className={styles.qualityTop}>
                      <span className={`${styles.qualityBadge} ${badge.class}`}>{badge.text}</span>
                      {option.hasWatermark && <span className={styles.wmIcon}>WM</span>}
                    </div>
                    <span className={styles.qualityName}>{option.quality}</span>
                    <span className={styles.qualityLabel}>{option.label}</span>
                    {option.filesize && (
                      <span className={styles.filesize}>{formatFileSize(option.filesize)}</span>
                    )}
                    {isSelected && <span className={styles.selectedCheck}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Audio options */}
        {audioOptions.length > 0 && (
          <>
            <p className={styles.sectionLabel}>
              🎵 Âm thanh
            </p>
            <div className={styles.qualityGrid}>
              {audioOptions.map((option, idx) => {
                const isSelected = selectedOption?.url === option.url;
                return (
                  <button
                    key={`audio-${idx}`}
                    id={`audio-option-${idx}`}
                    className={`${styles.qualityCard} ${styles.audioCard} ${isSelected ? styles.qualityCardActive : ''}`}
                    onClick={() => setSelectedOption(option)}
                  >
                    <div className={styles.qualityTop}>
                      <span className={`${styles.qualityBadge} ${styles.badgeAudio}`}>MP3</span>
                    </div>
                    <span className={styles.qualityName}>Audio</span>
                    <span className={styles.qualityLabel}>{option.label}</span>
                    {option.filesize && (
                      <span className={styles.filesize}>{formatFileSize(option.filesize)}</span>
                    )}
                    {isSelected && <span className={styles.selectedCheck}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      {selectedOption && (
        <div className={styles.actions + ' animate-slide-down'}>
          <div className={styles.selectedInfo}>
            <span className={styles.selectedLabel}>Đã chọn:</span>
            <span className={styles.selectedValue}>{selectedOption.label}</span>
          </div>
          <div className={styles.btnRow}>
            <button
              id="download-btn"
              className={`${styles.downloadBtn} ${isDownloading ? styles.downloading : ''}`}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <><span className={styles.dlSpinner} /> Đang tải...</>
              ) : (
                <><span>⬇</span> Tải xuống</>
              )}
            </button>
            <button
              id="copy-link-btn"
              className={`${styles.copyBtn} ${copiedUrl ? styles.copied : ''}`}
              onClick={handleCopyLink}
            >
              {copiedUrl ? (
                <><span>✓</span> Đã sao chép!</>
              ) : (
                <><span>🔗</span> Sao chép link</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
