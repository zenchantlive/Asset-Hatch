"use client";

// -----------------------------------------------------------------------------
// User Menu
// Dropdown menu showing user info and sign out option
// -----------------------------------------------------------------------------

import { signOut } from "next-auth/react";
import { type Session } from "next-auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface UserMenuProps {
    // The current user session
    session: Session;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UserMenu({ session }: UserMenuProps) {
    // Get user info from session
    const user = session.user;
    const userName = user?.name || user?.email || "User";
    const userEmail = user?.email || "";
    const userImage = user?.image;

    // Handle sign out
    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
                    {userImage ? (
                        // User avatar image
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={userImage}
                            alt={userName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        // Default user icon
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
                {/* User info section */}
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        {userEmail && (
                            <p className="text-xs leading-none text-muted-foreground">
                                {userEmail}
                            </p>
                        )}
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Dashboard link */}
                <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </Link>
                </DropdownMenuItem>

                {/* Settings link */}
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Sign out button */}
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
