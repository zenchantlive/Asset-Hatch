'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, Project } from '@/lib/db';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-panel p-8">
          <h1 className="text-2xl font-bold mb-4">
            Project not found
          </h1>
          <Link
            href="/"
            className="text-primary hover:underline transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-panel border-b" style={{ height: 'var(--header-height)' }}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-2xl font-bold">
                {project.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="capitalize">{project.phase}</Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
