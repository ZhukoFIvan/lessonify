export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 6.343a9 9 0 000 12.728M9.172 9.172a5 5 0 000 7.071M12 12h.01" />
        </svg>
      </div>
      <h1 className="text-xl font-bold mb-2">Нет подключения</h1>
      <p className="text-sm opacity-60 max-w-xs">
        Проверьте интернет и попробуйте снова
      </p>
    </div>
  )
}
