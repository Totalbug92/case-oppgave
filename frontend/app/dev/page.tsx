import { DashboardLayout } from '@/components/dashboard/layout';
import { DevApiView } from '@/components/dashboard/dev/view';

export default function DevPage() {
  return (
    <DashboardLayout>
      <DevApiView />
    </DashboardLayout>
  );
}
