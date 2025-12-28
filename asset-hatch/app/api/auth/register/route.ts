// -----------------------------------------------------------------------------
// User Registration API Route
// Creates new users with email/password credentials
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// =============================================================================
// VALIDATION SCHEMA
// Zod schema for validating registration input
// =============================================================================

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(32, "Password must be less than 32 characters"),
});

// =============================================================================
// RESPONSE TYPES
// Type definitions for API responses
// =============================================================================

interface RegisterSuccessResponse {
    success: true;
    userId: string;
}

interface RegisterErrorResponse {
    success: false;
    error: string;
}

type RegisterResponse = RegisterSuccessResponse | RegisterErrorResponse;

// =============================================================================
// POST HANDLER
// Creates a new user with hashed password
// =============================================================================

export async function POST(
    request: Request
): Promise<NextResponse<RegisterResponse>> {
    try {
        // Parse request body
        const body: unknown = await request.json();

        // Validate input with Zod schema
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            // Return first validation error
            const firstError = parsed.error.issues[0]?.message || "Invalid input";
            return NextResponse.json(
                { success: false, error: firstError },
                { status: 400 }
            );
        }

        const { name, email, password } = parsed.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: "Email already registered" },
                { status: 409 }
            );
        }

        // Hash password with bcrypt (12 rounds)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user in database
        const user = await prisma.user.create({
            data: {
                name,
                email,
                hashedPassword,
            },
        });

        // Return success response
        return NextResponse.json({
            success: true,
            userId: user.id,
        });
    } catch (error: any) {
        // Handle duplicate email constraint
        if (error.code === "P2002") {
            return NextResponse.json(
                { success: false, error: "Email already registered" },
                { status: 409 }
            );
        }

        // Log other errors
        console.error("Registration error:", error);
        return NextResponse.json(
            { success: false, error: "Registration failed" },
            { status: 500 }
        );
    }
}
