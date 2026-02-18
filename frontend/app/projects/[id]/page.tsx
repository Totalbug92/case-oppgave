import { DashboardLayout } from '@/components/dashboard/layout';
import { ProjectDetailView } from '@/components/dashboard/projects/detail-view';
import { notFound } from 'next/navigation';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId) || projectId <= 0) {
    notFound();
  }

  return (
    <DashboardLayout>
      <ProjectDetailView projectId={projectId} />
    </DashboardLayout>
  );
}
