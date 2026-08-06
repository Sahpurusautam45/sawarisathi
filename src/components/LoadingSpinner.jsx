function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">

        <div className="w-14 h-14 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto"></div>

        <p className="mt-5 text-gray-600 font-medium">
          Loading...
        </p>

      </div>
    </div>
  );
}

export default LoadingSpinner;