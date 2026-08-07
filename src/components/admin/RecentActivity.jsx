function RecentActivity() {
  return (
    <div className="bg-white rounded-2xl shadow-md mt-8 p-6">

      <h2 className="text-xl font-bold">
        📈 Recent Activity
      </h2>

      <div className="mt-5 space-y-4">

        <div className="flex justify-between border-b pb-3">
          <span>✅ Vehicle Verified</span>
          <span className="text-gray-500">Just now</span>
        </div>

        <div className="flex justify-between border-b pb-3">
          <span>❌ Vehicle Rejected</span>
          <span className="text-gray-500">10 min ago</span>
        </div>

        <div className="flex justify-between">
          <span>👤 New User Registered</span>
          <span className="text-gray-500">30 min ago</span>
        </div>

      </div>

    </div>
  );
}

export default RecentActivity;