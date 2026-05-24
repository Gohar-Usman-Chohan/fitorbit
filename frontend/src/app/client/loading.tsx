export default function ClientLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm text-gray-600">Loading page...</p>
      </div>
    </div>
  );
}
