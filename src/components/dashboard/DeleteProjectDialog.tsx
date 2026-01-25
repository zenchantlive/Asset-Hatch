"use client";

// -----------------------------------------------------------------------------
// Delete Project Dialog
// Confirmation dialog for deleting a project
// -----------------------------------------------------------------------------

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Props for DeleteProjectDialog
 */
interface DeleteProjectDialogProps {
  /** Project ID to delete */
  projectId: string;
  /** Project name for display in confirmation */
  projectName: string;
}

/**
 * DeleteProjectDialog Component
 * 
 * Provides a secure confirmation flow for deleting projects.
 * Handles the API call and UI states (loading, error).
 */
export function DeleteProjectDialog({
  projectId,
  projectName,
}: DeleteProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Handles the deletion request
   */
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete project");
      }

      // Success
      setIsOpen(false);
      router.refresh(); // Refresh the dashboard to show updated list
    } catch (err) {
      console.error("Delete project error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/40 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          title="Delete project"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="glass-panel border-white/10 text-white sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()} // Prevent closing/navigation when clicking dialog
      >
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Project</DialogTitle>
          </div>
          <DialogDescription className="text-white/60">
            Are you sure you want to delete <span className="text-white font-medium">&quot;{projectName}&quot;</span>? 
            This action cannot be undone and will permanently remove all associated assets and game data.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
            className="text-white/60 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
