import { CustomersView } from '@/components/dashboard/customers/view';
import { DashboardLayout } from '@/components/dashboard/layout';

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <CustomersView />
    </DashboardLayout>
  );
}
