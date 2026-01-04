// -----------------------------------------------------------------------------
// Dashboard Page
// Server component showing user's projects from Prisma
// -----------------------------------------------------------------------------

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Settings } from "lucide-react";
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
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-12 p-6 rounded-lg glass-panel">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-white/90">
                                Your Projects
                            </h1>
                            <p className="text-white/60">
                                Manage your game asset projects
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/settings">
                            <Button variant="ghost" size="icon" title="Settings" className="text-white/70 hover:text-white">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </Link>
                        <CreateProjectButton />
                    </div>
                </header>

                {/* Projects grid */}
                <main>
                    {projects.length === 0 ? (
                        // Empty state
                        <div className="text-center py-20 border border-dashed border-glass-border rounded-lg glass-panel">
                            <p className="text-xl text-white/70 mb-4">
                                No projects yet
                            </p>
                            <p className="text-white/50 mb-6">
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
                                    <div className="p-6 glass-interactive rounded-lg transition-all">
                                        {/* Project name */}
                                        <h3 className="text-xl font-semibold text-white/90 mb-2">
                                            {project.name}
                                        </h3>

                                        {/* Phase badge */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${project.phase === "planning"
                                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                    : project.phase === "style"
                                                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                                        : project.phase === "generation"
                                                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                                            : "bg-white/10 text-white/70 border border-white/20"
                                                    }`}
                                            >
                                                {project.phase.charAt(0).toUpperCase() +
                                                    project.phase.slice(1)}
                                            </span>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex gap-4 text-sm text-white/60">
                                            <span>
                                                {project._count.generatedAssets} assets
                                            </span>
                                            <span>
                                                {project._count.styleAnchors} style anchors
                                            </span>
                                        </div>

                                        {/* Last updated */}
                                        <p className="text-xs text-white/40 mt-4">
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
