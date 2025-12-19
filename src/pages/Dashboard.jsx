export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Orders" value="—" />
        <Card title="Total Products" value="—" />
        <Card title="Low Stock" value="—" />
        <Card title="Open Tickets" value="—" />
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-2">Next steps</h3>
        <ul className="list-disc pl-5 text-gray-700">
          <li>Create Categories</li>
          <li>Add Products + Images</li>
          <li>View Orders + Update Status</li>
          <li>Reply to Support Tickets</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
