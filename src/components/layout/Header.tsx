"use client";

// -----------------------------------------------------------------------------
// Global Header
// Client component with branding, navigation, and auth controls
// -----------------------------------------------------------------------------

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { UserMenu, SignInModal, RegisterModal } from "@/components/auth";
import { usePathname } from "next/navigation";

export function Header() {
    const { data: session, status } = useSession();
    const isLoading = status === "loading";
    const isAuthenticated = !!session?.user;
    const pathname = usePathname();

    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    // Hide header on project workspace routes if they have their own header?
    // User asked for a "beautiful header for the app". 
    // We'll keep it simple for now and show it everywhere.

    return (
        <>
            <header className="sticky top-0 z-50 w-full h-[var(--header-height)] border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    {/* Branding */}
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold font-heading text-zinc-900 dark:text-zinc-50 tracking-tight">
                                Asset Hatch
                            </span>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex gap-6">
                            {isAuthenticated && (
                                <Link
                                    href="/dashboard"
                                    className={`text-sm font-medium transition-colors hover:text-primary ${pathname?.startsWith("/dashboard")
                                        ? "text-zinc-900 dark:text-zinc-50"
                                        : "text-zinc-500 dark:text-zinc-400"
                                        }`}
                                >
                                    Dashboard
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* User Controls */}
                    <div className="flex items-center gap-4">
                        {/* Storage Info Tooltip - Only show when authenticated */}
                        {isAuthenticated && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-red-500/30 backdrop-blur-sm hover:bg-white/10 hover:border-red-500/40 transition-all duration-200">
                                            <Info className="h-4 w-4 text-red-400/80" />
                                            <span className="text-xs font-medium text-white/70">
                                                Browser Storage
                                            </span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="bottom"
                                        className="max-w-[280px] bg-zinc-900/95 backdrop-blur-xl border-white/10 shadow-2xl"
                                    >
                                        <div className="space-y-1.5">
                                            <p className="font-semibold text-white">💾 Local Storage</p>
                                            <p className="text-xs text-white/80 leading-relaxed">
                                                Your generated images are stored in your browser. Export your projects before clearing browser data.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {isLoading ? (
                            <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-md" />
                        ) : isAuthenticated ? (
                            <UserMenu session={session} />
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => setIsSignInOpen(true)}>
                                    Sign In
                                </Button>
                                <Button size="sm" onClick={() => setIsRegisterOpen(true)}>
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Auth Modals - now global */}
            <SignInModal
                isOpen={isSignInOpen}
                onClose={() => setIsSignInOpen(false)}
                onSwitchToRegister={() => {
                    setIsSignInOpen(false);
                    setIsRegisterOpen(true);
                }}
            />
            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSwitchToSignIn={() => {
                    setIsRegisterOpen(false);
                    setIsSignInOpen(true);
                }}
            />
        </>
    );
}
