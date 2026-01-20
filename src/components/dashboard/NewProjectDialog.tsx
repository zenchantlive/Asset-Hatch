"use client";

// -----------------------------------------------------------------------------
// New Project Dialog
// Unified project creation - always creates both asset and game modes (Phase 6)
// -----------------------------------------------------------------------------

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { Loader2, Plus } from "lucide-react";

interface NewProjectDialogProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  className?: string;
}

/**
 * NewProjectDialog - Unified project creation
 *
 * Creates a unified project with both asset and game modes linked together.
 * All projects now automatically include both modes for seamless integration.
 */
export function NewProjectDialog({
  variant = "default",
  size = "default",
  children,
  className,
}: NewProjectDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"2d" | "3d" | "hybrid">("3d");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      setIsLoading(true);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), mode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const { projectId, gameId } = await response.json();

      // Reset form
      setName("");
      setMode("3d");
      setIsOpen(false);

      // Always redirect to studio since both modes are created
      router.push(`/studio/${gameId}`);

      router.refresh();
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {children || (
            <>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a unified workspace with both asset generation and game development.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project name */}
          <div>
            <label className="text-sm font-medium mb-2 block">Project Name</label>
            <Input
              placeholder="My RPG Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) handleCreate();
              }}
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Mode selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Project Mode</label>
            <ModeToggle value={mode} onValueChange={setMode} disabled={isLoading} />
            <p className="text-sm text-muted-foreground mt-2">
              Your project will include both asset generation and game development tools, seamlessly linked together.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
