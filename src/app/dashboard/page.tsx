// -----------------------------------------------------------------------------
// Dashboard Page
// Server component showing user's projects from Prisma
// -----------------------------------------------------------------------------

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { CreateProjectButton } from "@/components/dashboard/CreateProjectButton";

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DashboardPage() {
    // Get current session (server-side)
    const session = await auth();

    // Redirect to home if not authenticated
    if (!session?.user?.id) {
        redirect("/");
    }

    // Fetch user's projects from Prisma
    const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: {
            _count: {
                select: {
                    generatedAssets: true,
                    styleAnchors: true,
                },
            },
        },
    });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                                Your Projects
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Manage your game asset projects
                            </p>
                        </div>
                    </div>

                    <CreateProjectButton />
                </header>

                {/* Projects grid */}
                <main>
                    {projects.length === 0 ? (
                        // Empty state
                        <div className="text-center py-20 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
                            <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-4">
                                No projects yet
                            </p>
                            <p className="text-zinc-400 dark:text-zinc-500 mb-6">
                                Create your first project to start generating game assets.
                            </p>
                            <CreateProjectButton size="lg">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Project
                            </CreateProjectButton>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/project/${project.id}/planning?mode=${project.phase}`}
                                    className="block"
                                >
                                    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-primary/50 hover:shadow-lg transition-all">
                                        {/* Project name */}
                                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                            {project.name}
                                        </h3>

                                        {/* Phase badge */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${project.phase === "planning"
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                    : project.phase === "style"
                                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                                        : project.phase === "generation"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                                                    }`}
                                            >
                                                {project.phase.charAt(0).toUpperCase() +
                                                    project.phase.slice(1)}
                                            </span>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                                            <span>
                                                {project._count.generatedAssets} assets
                                            </span>
                                            <span>
                                                {project._count.styleAnchors} style anchors
                                            </span>
                                        </div>

                                        {/* Last updated */}
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4">
                                            Updated{" "}
                                            {new Date(project.updatedAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
