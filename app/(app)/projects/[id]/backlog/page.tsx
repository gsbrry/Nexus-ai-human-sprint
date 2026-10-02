import { useRealData } from '@/lib/server/feature-flag';
import { RealBacklog } from '@/components/sprints/RealBacklog';
import { MockProjectBacklog } from '@/components/projects/MockProjectBacklog';

export default async function ProjectBacklogPage({ params }: { params: { id: string } }) {
  // Mock project routes are keyed by project key, real ones by uuid.
  if (await useRealData()) return <RealBacklog projectId={params.id} />;
  return <MockProjectBacklog params={params} />;
}
