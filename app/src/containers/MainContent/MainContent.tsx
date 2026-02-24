"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Revenue", value: "$45,231", change: "+20.1%", up: true },
  { label: "Subscriptions", value: "2,350", change: "+180.1%", up: true },
  { label: "Active Users", value: "12,234", change: "+19%", up: true },
  { label: "Bounce Rate", value: "23.4%", change: "-4.3%", up: false },
];

const recentItems = [
  { id: 1, title: "Payment received", desc: "Invoice #1234 — $250.00", time: "2m", dot: "bg-emerald-600" },
  { id: 2, title: "New user signup", desc: "jane.doe@example.com", time: "15m", dot: "bg-blue-600" },
  { id: 3, title: "Server alert resolved", desc: "CPU usage back to normal", time: "1h", dot: "bg-amber-500" },
  { id: 4, title: "Deployment complete", desc: "v2.4.1 pushed to production", time: "3h", dot: "bg-emerald-600" },
  { id: 5, title: "Feature flag enabled", desc: "Dark mode rolled out to 50%", time: "5h", dot: "bg-blue-600" },
];

const metrics = [
  { label: "Page Views", value: 78, color: "from-blue-600 to-blue-400" },
  { label: "Conversions", value: 54, color: "from-blue-700 to-indigo-500" },
  { label: "Retention", value: 92, color: "from-blue-500 to-cyan-400" },
  { label: "Satisfaction", value: 87, color: "from-indigo-600 to-blue-400" },
];

const systemStatus = [
  { label: "API", status: "Operational" },
  { label: "Database", status: "Operational" },
  { label: "CDN", status: "Degraded" },
];

export function MainContent() {
  return (
    <div className="min-h-full bg-gradient-to-br from-white via-blue-50/40 to-slate-50">
      <motion.div
        className="flex flex-col gap-10 p-8 lg:p-10 max-w-[1180px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-600 mb-4">
            Overview
          </p>
          <h1 className="text-[2.75rem] leading-[1.08] font-serif text-slate-950 tracking-tight">
            Dashboard
          </h1>
          <p className="text-[15px] text-slate-500 mt-3 max-w-lg leading-relaxed">
            Real-time metrics and recent activity across your application.
          </p>
          <div className="mt-6 flex items-center gap-2.5">
            <div className="h-[3px] w-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
            <div className="h-[3px] w-6 rounded-full bg-blue-300" />
            <div className="h-[3px] w-3 rounded-full bg-blue-200" />
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
              className="group relative bg-white rounded-lg border border-slate-200/90 hover:border-blue-400 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-lg bg-gradient-to-b from-blue-500 to-blue-700" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-3 pl-2.5">
                {stat.label}
              </p>
              <p className="text-[1.75rem] font-bold text-slate-900 tracking-tight font-mono pl-2.5">
                {stat.value}
              </p>
              <div className="mt-3 flex items-center gap-1.5 pl-2.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    stat.up
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-rose-50 text-rose-600 border border-rose-200/60"
                  }`}
                >
                  {stat.up ? "↑" : "↓"} {stat.change}
                </span>
                <span className="text-[11px] text-slate-400">vs last month</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two-column bottom section */}
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Activity list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="bg-white rounded-lg border border-slate-200/90 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-[0.08em]">
                Recent Activity
              </h2>
              <button className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.12em] hover:text-blue-800 transition-colors">
                View all
              </button>
            </div>
            <ul>
              {recentItems.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100/70 last:border-0 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`block w-2 h-2 rounded-full ${item.dot} ring-[3px] ring-slate-100`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-slate-400 tabular-nums whitespace-nowrap ml-4">
                    {item.time} ago
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Performance sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="bg-white rounded-lg border border-slate-200/90 p-5 flex flex-col gap-6"
          >
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-[0.08em]">
              Performance
            </h2>

            <div className="flex flex-col gap-4">
              {metrics.map((metric, i) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-slate-500">{metric.label}</span>
                    <span className="text-[12px] font-bold text-slate-800 tabular-nums font-mono">
                      {metric.value}%
                    </span>
                  </div>
                  <div className="h-[6px] w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{
                        delay: 0.65 + i * 0.1,
                        duration: 0.8,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex flex-col gap-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                System Status
              </h3>
              {systemStatus.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-600">{s.label}</span>
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold ${
                      s.status === "Operational" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.status === "Operational" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
