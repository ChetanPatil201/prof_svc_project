export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          ✅ Application is Running!
        </h1>
        <p className="text-gray-600">
          If you can see this page, the Next.js application is working correctly.
        </p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">
            <strong>Status:</strong> Basic Next.js setup is functional
          </p>
        </div>
      </div>
    </div>
  );
}
