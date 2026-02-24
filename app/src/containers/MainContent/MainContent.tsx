import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Total Revenue", value: "$45,231", change: "+20.1%", up: true },
  { label: "Subscriptions", value: "+2,350", change: "+180.1%", up: true },
  { label: "Active Users", value: "+12,234", change: "+19%", up: true },
  { label: "Bounce Rate", value: "23.4%", change: "-4.3%", up: false },
];

const recentItems = [
  { id: 1, title: "Payment received", desc: "Invoice #1234 — $250.00", time: "2m ago" },
  { id: 2, title: "New user signup", desc: "jane.doe@example.com", time: "15m ago" },
  { id: 3, title: "Server alert resolved", desc: "CPU usage back to normal", time: "1h ago" },
  { id: 4, title: "Deployment complete", desc: "v2.4.1 pushed to production", time: "3h ago" },
  { id: 5, title: "Feature flag enabled", desc: "Dark mode rolled out to 50%", time: "5h ago" },
];

export function MainContent() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your application metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs mt-1 ${stat.up ? "text-emerald-600" : "text-red-500"}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {recentItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
