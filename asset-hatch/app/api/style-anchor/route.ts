/**
 * Style Anchor Fetch API
 * 
 * Returns style anchor data by ID, including the base64 image.
 * This is used by the client to fetch the generated image separately
 * from the chat flow to avoid sending huge base64 data through the LLM.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Get the style anchor ID from the query params
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Style anchor ID is required' },
                { status: 400 }
            );
        }

        // Fetch the style anchor from the database
        const styleAnchor = await prisma.styleAnchor.findUnique({
            where: { id },
        });

        if (!styleAnchor) {
            return NextResponse.json(
                { error: 'Style anchor not found' },
                { status: 404 }
            );
        }

        // Return the style anchor data with the image
        return NextResponse.json({
            id: styleAnchor.id,
            imageUrl: styleAnchor.referenceImageBase64,
            styleKeywords: styleAnchor.styleKeywords,
            lightingKeywords: styleAnchor.lightingKeywords,
            colorPalette: JSON.parse(styleAnchor.colorPalette),
            fluxModel: styleAnchor.fluxModel,
            createdAt: styleAnchor.createdAt,
        });
    } catch (error) {
        console.error('Failed to fetch style anchor:', error);
        return NextResponse.json(
            { error: 'Failed to fetch style anchor' },
            { status: 500 }
        );
    }
}
