'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './UrlInput.module.css';

interface UrlInputProps {
  onSubmit: (url: string, includeWatermark: boolean) => void;
  isLoading: boolean;
}

type Platform = 'YouTube' | 'TikTok' | 'Facebook' | 'Shopee' | null;

const PLATFORM_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  YouTube: { icon: '▶', color: '#ff0000', label: 'YouTube' },
  TikTok: { icon: '♪', color: '#69c9d0', label: 'TikTok' },
  Facebook: { icon: 'f', color: '#1877f2', label: 'Facebook' },
  Shopee: { icon: '🛍', color: '#ee4d2d', label: 'Shopee' },
};

function detectPlatform(url: string): Platform {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'YouTube';
  if (/tiktok\.com/i.test(url)) return 'TikTok';
  if (/facebook\.com|fb\.watch|fb\.me/i.test(url)) return 'Facebook';
  if (/shopee\.(vn|com|co\.id|sg|ph|com\.my|co\.th)/i.test(url)) return 'Shopee';
  return null;
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>(null);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlatform(detectPlatform(url));
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onSubmit(url.trim(), includeWatermark);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      inputRef.current?.focus();
    } catch {
      inputRef.current?.focus();
    }
  };

  const platformInfo = platform ? PLATFORM_ICONS[platform] : null;

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputRow}>
          {/* Platform indicator */}
          <div className={styles.platformIndicator}>
            {platformInfo ? (
              <span
                className={styles.platformIcon}
                style={{ color: platformInfo.color }}
                title={platformInfo.label}
              >
                {platformInfo.icon}
              </span>
            ) : (
              <span className={styles.linkIcon}>🔗</span>
            )}
          </div>

          <input
            ref={inputRef}
            id="video-url-input"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Dán link video từ YouTube, TikTok, Facebook hoặc Shopee..."
            className={styles.input}
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Paste button */}
          {!url && (
            <button
              type="button"
              onClick={handlePaste}
              className={styles.pasteBtn}
              disabled={isLoading}
              aria-label="Dán từ clipboard"
            >
              Dán
            </button>
          )}

          {/* Clear button */}
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className={styles.clearBtn}
              disabled={isLoading}
              aria-label="Xóa"
            >
              ✕
            </button>
          )}
        </div>

        {/* TikTok watermark option */}
        {platform === 'TikTok' && (
          <div className={styles.tiktokOptions + ' animate-slide-down'}>
            <label className={styles.checkboxLabel} htmlFor="watermark-toggle">
              <input
                id="watermark-toggle"
                type="checkbox"
                checked={includeWatermark}
                onChange={e => setIncludeWatermark(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxCustom} />
              <span>Bao gồm tùy chọn <strong>có watermark TikTok</strong></span>
            </label>
          </div>
        )}

        {/* Submit button */}
        <button
          id="fetch-video-btn"
          type="submit"
          disabled={!url.trim() || isLoading}
          className={styles.submitBtn}
        >
          {isLoading ? (
            <span className={styles.loadingSpinner} />
          ) : (
            <>
              <span className={styles.btnIcon}>⬇</span>
              Lấy link tải xuống
            </>
          )}
        </button>
      </form>

      {/* Supported platforms */}
      <div className={styles.platforms}>
        {Object.entries(PLATFORM_ICONS).map(([key, val]) => (
          <span key={key} className={styles.platformTag} style={{ '--platform-color': val.color } as any}>
            <span>{val.icon}</span>
            {val.label}
          </span>
        ))}
      </div>
    </div>
  );
}
