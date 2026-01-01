import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function dataUrlToBuffer(dataUrl: string): Buffer {
    // supports "data:image/png;base64,...."
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    return Buffer.from(base64, 'base64');
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            projectId: string;
            referenceImageName: string;
            referenceImageBase64DataUrl: string;
            styleKeywords: string;
            lightingKeywords: string;
            colorPalette: string[];
            fluxModel: string;
            aiSuggested?: boolean;
        };

        if (!body.projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }
        if (!body.referenceImageBase64DataUrl) {
            return NextResponse.json({ error: 'referenceImageBase64DataUrl is required' }, { status: 400 });
        }

        const imageBytes = dataUrlToBuffer(body.referenceImageBase64DataUrl);

        const created = await prisma.styleAnchor.create({
            data: {
                projectId: body.projectId,
                referenceImageName: body.referenceImageName,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                referenceImageBlob: imageBytes as any,
                // Store base64 too to match schema expecting it and potential display needs
                referenceImageBase64: body.referenceImageBase64DataUrl,
                styleKeywords: body.styleKeywords,
                lightingKeywords: body.lightingKeywords,
                colorPalette: JSON.stringify(body.colorPalette ?? []),
                fluxModel: body.fluxModel,
                aiSuggested: body.aiSuggested ?? false,
            },
        });

        return NextResponse.json({ success: true, styleAnchor: { id: created.id } });
    } catch (err) {
        console.error('Failed to create style anchor:', err);
        return NextResponse.json(
            { error: 'Failed to create style anchor' },
            { status: 500 }
        );
    }
}
