// API route for managing user settings (API key, etc.)
// Handles GET (fetch current settings) and PATCH (update settings)

import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating settings update request
const updateSettingsSchema = z.object({
    openRouterApiKey: z.string().optional().nullable(),
});

// GET: Fetch current user settings
export async function GET() {
    try {
        // Get authenticated session
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch user with API key
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                // Return whether key exists, not the key itself (security)
                openRouterApiKey: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Return settings with masked API key
        return NextResponse.json({
            hasApiKey: !!user.openRouterApiKey,
            // Show last 4 characters if key exists
            apiKeyPreview: user.openRouterApiKey
                ? `sk-or-...${user.openRouterApiKey.slice(-4)}`
                : null,
        });
    } catch (error) {
        console.error("[Settings GET] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PATCH: Update user settings
export async function PATCH(request: NextRequest) {
    try {
        // Get authenticated session
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const result = updateSettingsSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid request", details: result.error.format() },
                { status: 400 }
            );
        }

        const { openRouterApiKey } = result.data;

        // If API key is provided, validate it with OpenRouter
        if (openRouterApiKey) {
            const isValid = await validateOpenRouterKey(openRouterApiKey);
            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid OpenRouter API key" },
                    { status: 400 }
                );
            }
        }

        // Update user settings
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                openRouterApiKey: openRouterApiKey ?? null,
            },
        });

        return NextResponse.json({
            success: true,
            hasApiKey: !!openRouterApiKey,
        });
    } catch (error) {
        console.error("[Settings PATCH] Error:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}

// Validate OpenRouter API key by making a test request
async function validateOpenRouterKey(apiKey: string): Promise<boolean> {
    try {
        // Use the models endpoint to validate the key
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        return response.ok;
    } catch {
        return false;
    }
}
