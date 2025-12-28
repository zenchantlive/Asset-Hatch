// -----------------------------------------------------------------------------
// NextAuth Type Augmentation
// Extends NextAuth types to include user.id on session
// -----------------------------------------------------------------------------

import { DefaultSession } from "next-auth";

declare module "next-auth" {
    /**
     * Extend the Session interface to include user.id
     * This matches the jwt and session callbacks in auth.ts
     */
    interface Session {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}
