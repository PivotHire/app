import { getProjectById } from '@/app/actions/projects';
import { ProjectHeader } from './_components/ProjectHeader';
import { ProjectTabs } from './_components/ProjectTabs';

interface ProjectDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const { id } = await params;
    const project = await getProjectById(id);

    return (
        <div className="space-y-6">
            <ProjectHeader project={project} />
            <ProjectTabs project={project} />
        </div>
    );
}
