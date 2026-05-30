export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading HireAI...</p>
      </div>
    </div>
  );
}
