"use client";

// -----------------------------------------------------------------------------
// New Project Dialog
// Unified project creation dialog with start path selection (Phase 6)
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
import { Loader2, Plus, Gamepad2, Layers } from "lucide-react";
import { useAppTransition } from "@/components/ui/TransitionProvider";

interface NewProjectDialogProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  className?: string;
}

/**
 * NewProjectDialog - Unified project creation with start path selection
 *
 * Allows users to create a project starting with:
 * - Assets only (generate assets first, add game later)
 * - Game only (start game, add assets mid-development)
 * - Both together (create assets and game side by side)
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
  const [startWith, setStartWith] = useState<"assets" | "game">("assets");
  const [isLoading, setIsLoading] = useState(false);

  const { startTransition } = useAppTransition();

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      startTransition(`Hatching ${name.trim()}...`);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), mode, startWith }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      // Redirect based on user's choice
      // "Assets First" goes to the planning/generation interface
      // "Game First" goes directly to the studio (if gameId is available from response)
      const data = await response.json();
      const { projectId: createdProjectId, gameId } = data;

      console.log("🚀 Project created:", { createdProjectId, gameId, startWith });

      // Reset form
      setName("");
      setMode("3d");
      setStartWith("assets");
      setIsOpen(false);

      // Route based on what the user selected
      if (startWith === "game" && gameId) {
        console.log("➡️ Navigating to studio:", `/studio/${gameId}`);
        router.push(`/studio/${gameId}`);
      } else {
        console.log("➡️ Navigating to planning:", `/project/${createdProjectId}/planning`);
        router.push(`/project/${createdProjectId}/planning`);
      }
      // Note: router.refresh() removed - can cause race condition with router.push()
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
            Start creating assets, games, or both in one unified workspace.
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
          </div>

          {/* Start with selection - KEY FEATURE */}
          <div>
            <label className="text-sm font-medium mb-3 block">Start with</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStartWith("assets")}
                disabled={isLoading}
                className={`
                  flex flex-col items-center py-4 h-auto gap-2 rounded-lg border-2 transition-all
                  ${startWith === "assets"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                  }
                `}
              >
                <Layers className="h-6 w-6" />
                <span className="text-sm font-medium">Assets First</span>
              </button>
              <button
                type="button"
                onClick={() => setStartWith("game")}
                disabled={isLoading}
                className={`
                  flex flex-col items-center py-4 h-auto gap-2 rounded-lg border-2 transition-all
                  ${startWith === "game"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                  }
                `}
              >
                <Gamepad2 className="h-6 w-6" />
                <span className="text-sm font-medium">Game First</span>
              </button>

            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {startWith === "assets" &&
                "Generate assets first, then build your game with them"}
              {startWith === "game" &&
                "Start building your game, add assets later as needed"}
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
