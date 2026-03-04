import { getProjects } from '@/app/actions/projects';
import { ProjectList } from './_components/ProjectList';

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#242424]">Projects</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track progress, view live demos, and browse code.
                    </p>
                </div>
            </div>
            <ProjectList projects={projects} />
        </div>
    );
}
