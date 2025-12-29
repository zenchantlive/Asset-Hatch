// -----------------------------------------------------------------------------
// Auth.js v5 Configuration
// Provides authentication with GitHub OAuth and email/password credentials
// -----------------------------------------------------------------------------

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// =============================================================================
// VALIDATION SCHEMAS
// Zod schemas for validating user credentials
// =============================================================================

// Schema for validating sign-in credentials
const signInSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

// =============================================================================
// AUTH CONFIGURATION
// NextAuth configuration with providers and callbacks
// =============================================================================

export const { handlers, auth, signIn, signOut } = NextAuth({
    // Use Prisma adapter for database persistence
    adapter: PrismaAdapter(prisma),

    // Configure authentication providers
    providers: [
        // GitHub OAuth provider
        // Requires AUTH_GITHUB_ID and AUTH_GITHUB_SECRET env vars
        // allowDangerousEmailAccountLinking disabled for security:
        // Prevents account takeover where an attacker creates a GitHub account
        // with a victim's email and automatically links to their existing account.
        // Users must use the same sign-in method (OAuth or credentials) consistently.
        GitHub({
            allowDangerousEmailAccountLinking: false,
        }),

        // Email/password credentials provider
        Credentials({
            // Define the credential fields
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            // Authorize function validates credentials and returns user
            async authorize(credentials) {
                // Validate input with Zod schema
                const parsed = signInSchema.safeParse(credentials);
                if (!parsed.success) {
                    return null;
                }

                const { email, password } = parsed.data;

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                // Check if user exists and has a password (credentials user)
                if (!user?.hashedPassword) {
                    return null;
                }

                // Verify password with bcrypt
                const isValidPassword = await bcrypt.compare(
                    password,
                    user.hashedPassword
                );
                if (!isValidPassword) {
                    return null;
                }

                // Return user object for session
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],

    // Use JWT strategy for sessions (required for credentials provider)
    session: {
        strategy: "jwt",
    },

    // Custom pages for authentication
    pages: {
        signIn: "/", // Redirect to home page with modal
        error: "/", // Redirect errors to home page
    },

    // Callbacks to customize JWT and session
    callbacks: {
        // Add user ID to JWT token
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },

        // Add user ID to session from JWT token
        session({ session, token }) {
            if (token?.id && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },

        // Authorized callback handles route protection
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            const isOnProject = nextUrl.pathname.startsWith("/project");

            if (isOnDashboard || isOnProject) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
    },
});
