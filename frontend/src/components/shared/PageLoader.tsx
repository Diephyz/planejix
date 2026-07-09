// Fallback do Suspense enquanto o chunk da página é baixado
export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" aria-label="Carregando" />
    </div>
  );
}
