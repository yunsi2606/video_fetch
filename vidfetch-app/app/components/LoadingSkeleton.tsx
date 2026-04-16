import styles from './LoadingSkeleton.module.css';

export default function LoadingSkeleton() {
  return (
    <div className={styles.container + ' animate-fade-in'}>
      {/* Preview skeleton */}
      <div className={styles.preview}>
        <div className={styles.thumbnail} />
        <div className={styles.meta}>
          <div className={styles.badge} />
          <div className={styles.titleLine1} />
          <div className={styles.titleLine2} />
          <div className={styles.author} />
        </div>
      </div>

      {/* Quality skeleton */}
      <div className={styles.qualitySection}>
        <div className={styles.sectionLabel} />
        <div className={styles.qualityGrid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.qualityCard} />
          ))}
        </div>
        <div className={styles.sectionLabel} style={{ width: '80px' }} />
        <div className={styles.qualityGrid}>
          <div className={styles.qualityCard} style={{ width: '120px' }} />
        </div>
      </div>

      {/* Actions skeleton */}
      <div className={styles.actions}>
        <div className={styles.btnRow}>
          <div className={styles.btn} />
          <div className={styles.btn} />
        </div>
      </div>
    </div>
  );
}
