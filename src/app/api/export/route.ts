/**
 * Export API Route
 * 
 * Generates a ZIP file containing all approved assets organized by category
 * with a manifest.json file for AI-consumable metadata.
 * 
 * Per ADR-014: Single-Asset Strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { prisma } from '@/lib/prisma';
import { generateSemanticId, getCategoryFolder } from '@/lib/prompt-builder';
import type { ExportManifest, ExportAssetMetadata } from '@/lib/types';

/**
 * POST /api/export
 * 
 * Request body: { projectId: string }
 * Returns: ZIP file as blob
 */
export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            );
        }

        // Fetch project from database
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Fetch all approved assets
        const generatedAssets = await prisma.generatedAsset.findMany({
            where: {
                projectId: projectId,
                status: 'approved',
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        if (generatedAssets.length === 0) {
            return NextResponse.json(
                { error: 'No approved assets to export' },
                { status: 400 }
            );
        }

        // Fetch asset plan (entities.json) to get asset metadata
        const entitiesFile = await prisma.memoryFile.findUnique({
            where: {
                projectId_type: {
                    projectId: projectId,
                    type: 'entities.json',
                },
            },
        });

        if (!entitiesFile) {
            return NextResponse.json(
                { error: 'Asset plan not found' },
                { status: 404 }
            );
        }

        // Parse markdown plan using plan parser (entities.json is markdown, not JSON!)
        const { parsePlan } = await import('@/lib/plan-parser');
        const parsedAssets = parsePlan(entitiesFile.content, {
            mode: 'granular', // Generate individual assets
            projectId: projectId,
        });

        // Fetch style anchor (optional)
        const styleAnchor = await prisma.styleAnchor.findFirst({
            where: { projectId: projectId },
            orderBy: { createdAt: 'desc' },
        });

        // Build export manifest
        const manifest: ExportManifest = {
            project: {
                id: project.id,
                name: project.name,
                created: project.createdAt.toISOString(),
            },
            style: {
                artStyle: project.artStyle || 'Pixel Art',
                baseResolution: project.baseResolution || '32x32',
                perspective: project.perspective || 'Top-down',
                colorPalette: project.colorPalette || 'Vibrant',
                anchorImagePath: styleAnchor ? 'style_anchor.png' : undefined,
            },
            assets: [],
        };

        // Create ZIP archive
        const zip = new JSZip();

        // Add style anchor if exists
        if (styleAnchor) {
            zip.file('style_anchor.png', styleAnchor.referenceImageBlob);
        }

        // Process each generated asset
        for (const generatedAsset of generatedAssets) {
            // Find corresponding asset in parsed plan
            const parsedAsset = parsedAssets.find(a => a.id === generatedAsset.assetId);

            if (!parsedAsset) {
                console.warn(`Parsed asset not found for: ${generatedAsset.assetId}`);
                continue;
            }

            // Generate semantic ID
            const semanticId = generateSemanticId(parsedAsset);

            // Determine category folder
            const categoryFolder = getCategoryFolder(parsedAsset.category);

            // Construct file path
            const filePath = `${categoryFolder}/${semanticId}.png`;

            // Use project-wide resolution (individual asset resolution not yet supported in type)
            const resolution = project.baseResolution || '32x32';
            const [width, height] = resolution.split('x').map((n: string) => parseInt(n, 10));

            // Determine frame count (1 for single sprite, >1 for sprite sheet)
            const frameCount = parsedAsset.variant?.frameCount || 1;

            // Parse metadata (stored as JSON string in Prisma)
            let metadata: { model: string; seed: number };
            try {
                metadata = generatedAsset.metadata
                    ? JSON.parse(generatedAsset.metadata)
                    : { model: 'flux.2-pro', seed: 0 };
            } catch (e) {
                console.warn(`Failed to parse metadata for asset ${generatedAsset.id}:`, e);
                metadata = { model: 'flux.2-pro', seed: 0 }; // Fallback
            }

            // Build asset metadata
            const assetMetadata: ExportAssetMetadata = {
                id: semanticId,
                semanticName: `${parsedAsset.category} - ${parsedAsset.name}${parsedAsset.variant?.name ? ` (${parsedAsset.variant.name})` : ''}`,
                path: filePath,
                category: parsedAsset.category.toLowerCase().replace(/s$/, ''), // Singular
                tags: [
                    parsedAsset.category.toLowerCase(),
                    parsedAsset.name.toLowerCase(),
                    ...(parsedAsset.variant?.name ? [parsedAsset.variant.name.toLowerCase()] : []),
                ],
                dimensions: { width, height },
                frames: frameCount,
                aiDescription: parsedAsset.description,
                generationMetadata: {
                    prompt: generatedAsset.promptUsed || 'No prompt recorded',
                    seed: generatedAsset.seed || metadata.seed || 0,
                    model: metadata.model || 'flux.2-pro',
                },
            };

            // Add to manifest
            manifest.assets.push(assetMetadata);

            // Add asset image to ZIP
            zip.file(filePath, generatedAsset.imageBlob);
        }

        // Add manifest.json to ZIP root
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));

        // Generate ZIP blob
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });

        // Return ZIP as download
        return new NextResponse(zipBlob, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${project.name.replace(/\s+/g, '_')}_assets.zip"`,
                'Content-Length': zipBlob.size.toString(),
            },
        });

    } catch (error: unknown) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to export assets', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
