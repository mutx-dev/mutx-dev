import styles from './MarketingCore.module.css'

const WORDS = {
  contact: ['Talk', 'Plan', 'Ship'],
  download: ['Sign', 'Install', 'Run'],
  release: ['Build', 'Verify', 'Ship'],
} as const

export function OperationalVisual({ variant }: { variant: keyof typeof WORDS }) {
  return (
    <div className={styles.routePoster} aria-hidden="true">
      {WORDS[variant].map((word, index) => (
        <span key={word}><i>0{index + 1}</i>{word}</span>
      ))}
    </div>
  )
}
