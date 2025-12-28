// -----------------------------------------------------------------------------
// Auth.js Route Handler
// Handles all authentication requests at /api/auth/*
// -----------------------------------------------------------------------------

import { handlers } from "@/auth";

// Export GET and POST handlers from Auth.js
export const { GET, POST } = handlers;
