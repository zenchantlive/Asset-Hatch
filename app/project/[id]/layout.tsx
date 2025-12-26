'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, Project } from '@/lib/db';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { use } from 'react';

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = useLiveQuery(() => db.projects.get(id));

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Project not found
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Link>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {project.name}
              </h1>
            </div>
            <Badge className="capitalize">{project.phase}</Badge>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
