import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const projects = [
  { name: "API Gateway", status: "Active", progress: 87 },
  { name: "Mobile App v3", status: "Active", progress: 64 },
  { name: "Data Pipeline", status: "Paused", progress: 42 },
  { name: "Design System", status: "Active", progress: 95 },
];

const teamMembers = [
  { name: "Alice Chen", role: "Engineering", tasks: 12 },
  { name: "Bob Martinez", role: "Design", tasks: 8 },
  { name: "Carol Johnson", role: "Product", tasks: 5 },
  { name: "Dan Kim", role: "Engineering", tasks: 14 },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and track your team&apos;s projects.
        </p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {project.name}
                    </CardTitle>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        project.status === "Active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium tabular-nums">
                      {project.progress}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {teamMembers.map((member) => (
                  <li
                    key={member.name}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {member.tasks} tasks
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
