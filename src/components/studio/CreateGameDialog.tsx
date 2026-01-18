// -----------------------------------------------------------------------------
// Create Game Dialog Component
// Modal for creating new games from the studio index page
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

/**
 * Props for CreateGameDialog
 */
interface CreateGameDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog should close */
    onOpenChange: (open: boolean) => void;
}

/**
 * CreateGameDialog - Modal for creating new games
 */
export function CreateGameDialog({ open, onOpenChange }: CreateGameDialogProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Game name is required');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const response = await fetch('/api/studio/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                }),
            });

            const data = await response.json();

            if (data.success && data.game) {
                // Success! Redirect to the new game editor
                router.push(`/studio/${data.game.id}`);
            } else {
                setError(data.error || 'Failed to create game');
                setIsCreating(false);
            }
        } catch (err) {
            setError('Network error - please try again');
            setIsCreating(false);
            console.error('Failed to create game:', err);
        }
    };

    // Reset form when dialog closes
    const handleOpenChange = (open: boolean) => {
        if (!open && !isCreating) {
            setName('');
            setDescription('');
            setError(null);
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Game</DialogTitle>
                    <DialogDescription>
                        Start a new game project with AI-assisted development.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Game Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Game Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Awesome Game"
                                disabled={isCreating}
                                autoFocus
                            />
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief description of your game idea..."
                                disabled={isCreating}
                                rows={3}
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating || !name.trim()}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Game'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
