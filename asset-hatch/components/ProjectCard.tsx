import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  id: string;
  name: string;
  phase: 'planning' | 'style' | 'generation' | 'export';
  created_at: string;
}

export function ProjectCard({ id, name, phase, created_at }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Link href={`/project/${id}/planning`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-xl">{name}</CardTitle>
          <CardDescription>Created {formatDate(created_at)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge className="capitalize">{phase}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
