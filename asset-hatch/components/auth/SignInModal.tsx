"use client";

// -----------------------------------------------------------------------------
// Sign In Modal
// Modal dialog for user authentication with GitHub OAuth and email/password
// -----------------------------------------------------------------------------

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Mail, Loader2 } from "lucide-react";

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface SignInModalProps {
    // Whether the modal is open
    isOpen: boolean;
    // Callback to close the modal
    onClose: () => void;
    // Callback to switch to register modal
    onSwitchToRegister: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SignInModal({
    isOpen,
    onClose,
    onSwitchToRegister,
}: SignInModalProps) {
    // Form state for email/password sign in
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Handle GitHub OAuth sign in
    const handleGitHubSignIn = async () => {
        setIsLoading(true);
        setError("");
        try {
            await signIn("github", { callbackUrl: "/dashboard" });
        } catch {
            setError("Failed to sign in with GitHub");
            setIsLoading(false);
        }
    };

    // Handle email/password sign in
    const handleCredentialsSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setIsLoading(false);
            } else {
                // Redirect to dashboard on success
                router.push("/dashboard");
            }
        } catch {
            setError("Sign in failed. Please try again.");
            setIsLoading(false);
        }
    };

    // Reset form state when modal closes
    const handleClose = () => {
        setEmail("");
        setPassword("");
        setError("");
        setIsLoading(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        Welcome Back
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Sign in to access your projects
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* GitHub OAuth Button */}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleGitHubSignIn}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Github className="mr-2 h-4 w-4" />
                        )}
                        Continue with GitHub
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                minLength={8}
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="mr-2 h-4 w-4" />
                            )}
                            Sign in with Email
                        </Button>
                    </form>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <p className="text-sm text-muted-foreground text-center">
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            className="text-primary hover:underline font-medium"
                            onClick={() => {
                                handleClose();
                                onSwitchToRegister();
                            }}
                            disabled={isLoading}
                        >
                            Sign up
                        </button>
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
