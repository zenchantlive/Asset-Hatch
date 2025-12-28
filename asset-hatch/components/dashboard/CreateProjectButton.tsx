"use client";

// -----------------------------------------------------------------------------
// Create Project Button
// Reusable component that opens a modal to create a new project
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
import { Plus, Loader2 } from "lucide-react";

interface CreateProjectButtonProps {
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    children?: React.ReactNode;
    className?: string;
}

export function CreateProjectButton({
    variant = "default",
    size = "default",
    children,
    className,
}: CreateProjectButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;

        try {
            setIsLoading(true);

            // Create project via API
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });

            if (!response.ok) {
                throw new Error("Failed to create project");
            }

            const { project } = await response.json();

            // Close modal and navigate
            setIsOpen(false);
            setName("");
            router.push(`/project/${project.id}/planning`);

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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Give your project a name to get started.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Input
                        placeholder="My Game Project"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && name.trim()) handleCreate();
                        }}
                        autoFocus
                        disabled={isLoading}
                    />
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
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
