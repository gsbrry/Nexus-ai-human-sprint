import { useRealData } from '@/lib/server/feature-flag';
import { RealAdmin } from '@/components/admin/RealAdmin';
import { MockAdmin } from '@/components/admin/MockAdmin';

export default async function AdminPage() {
  if (await useRealData()) return <RealAdmin />;
  return <MockAdmin />;
}
