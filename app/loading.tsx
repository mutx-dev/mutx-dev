export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f0e8] text-[#0a0a09]" role="status" aria-label="Loading MUTX">
      <div className="grid grid-cols-2 border-l border-t border-[#0a0a09] bg-[#ff4d00] font-[family:var(--font-site-body)] text-5xl font-bold tracking-[-.08em]">
        {['M', 'U', 'T', 'X'].map((letter, index) => (
          <span key={letter} className={`grid h-24 w-24 place-items-center border-b border-r border-[#0a0a09] ${index === 1 || index === 2 ? 'bg-[#0a0a09] text-[#f3f0e8]' : ''}`}>{letter}</span>
        ))}
      </div>
    </div>
  )
}
