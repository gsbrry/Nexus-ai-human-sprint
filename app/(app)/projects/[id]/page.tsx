import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from '@/components/tasks/TaskList';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import {
  activeSprintForProject,
  projectByKey,
  tasksForProject,
  tasksForSprint,
  userById,
} from '@/lib/mock/yallo';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = projectByKey(params.id);
  if (!project) notFound();

  const sprint = activeSprintForProject(project.id);
  const allTasks = tasksForProject(project.id);
  const sprintTasks = sprint ? tasksForSprint(sprint.id) : [];
  const backlog = allTasks.filter((t) => !t.sprint_id);

  const donePoints = sprintTasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0);
  const totalPoints = sprintTasks.reduce((s, t) => s + (t.story_points ?? 0), 0);

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-8">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-3.5" />
        All projects
      </Link>

      {/* Project header */}
      <div className="flex items-start gap-5">
        <div
          className="size-14 rounded-md border-[1.5px] flex items-center justify-center font-mono text-[15px] font-bold shrink-0"
          style={{
            color: project.color,
            background: `${project.color}22`,
            borderColor: `${project.color}66`,
          }}
        >
          {project.key}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">P-02 · Project detail</div>
          <h1 className="text-3xl font-extrabold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground max-w-[640px]">{project.description}</p>
          <div className="flex items-center gap-2 pt-1">
            {project.members.slice(0, 8).map((id) => {
              const u = userById(id)!;
              return <OwnerAvatar key={id} user={u} size={26} />;
            })}
          </div>
        </div>
        <Link
          href={`/projects/${project.key.toLowerCase()}/backlog`}
          className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-gold hover:text-gold-light border border-gold/30 rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
        >
          T-05 · Backlog →
        </Link>
      </div>

      {/* Active sprint */}
      {sprint && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-6 mb-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="gold">Active sprint</Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {format(new Date(sprint.start_date), 'dd MMM')} →{' '}
                    {format(new Date(sprint.end_date), 'dd MMM')}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">{sprint.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
                  <Target className="size-4 text-gold shrink-0 mt-0.5" />
                  {sprint.goal}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2">
                <span>Burndown</span>
                <span>
                  {donePoints} / {totalPoints} pts
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#0A0A0A] border border-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                  style={{ width: `${Math.min(100, (donePoints / Math.max(1, totalPoints)) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sprint tasks */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Sprint tasks</div>
            <h2 className="text-lg font-bold tracking-tight">In this sprint</h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {sprintTasks.length} tasks
          </div>
        </div>
        <TaskList tasks={sprintTasks} emptyMessage="No tasks in this sprint." />
      </div>

      {/* Backlog */}
      {backlog.length > 0 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Backlog</div>
          <TaskList tasks={backlog} />
        </div>
      )}
    </div>
  );
}
