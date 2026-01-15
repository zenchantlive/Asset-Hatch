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
 * Helper to fetch a URL as a Buffer
 */
async function fetchAsBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * POST /api/export
 *
 * Request body: {
 *   projectId: string,
 *   assets: Array<{ id: string, imageBlob: string (base64) }>
 * }
 * Returns: ZIP file as blob
 *
 * Note: Images must be sent from client IndexedDB since they're no longer in database
 */
export async function POST(req: NextRequest) {
    try {
        // Parse request body (now includes images from client)
        const { projectId, assets: clientAssets } = await req.json();

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

        // Fetch all approved 2D assets
        const generatedAssets = await prisma.generatedAsset.findMany({
            where: {
                projectId: projectId,
                status: 'approved',
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Fetch all approved 3D assets
        const generated3DAssets = await prisma.generated3DAsset.findMany({
            where: {
                projectId: projectId,
                approvalStatus: 'approved',
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        if (generatedAssets.length === 0 && generated3DAssets.length === 0) {
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

        // Parse markdown plan if it exists
        let parsedAssets: any[] = [];
        if (entitiesFile) {
            const { parsePlan } = await import('@/lib/plan-parser');
            parsedAssets = parsePlan(entitiesFile.content, {
                mode: 'granular',
                projectId: projectId,
            });
        }

        // Fetch style anchor (optional)
        const styleAnchor = await prisma.styleAnchor.findFirst({
            where: { projectId: projectId },
            orderBy: { createdAt: 'desc' },
        });

        // Build export manifest
        const manifest: any = {
            project: {
                id: project.id,
                name: project.name,
                mode: project.mode,
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
            assets3d: [],
        };

        // Create ZIP archive
        const zip = new JSZip();

        // Add style anchor if exists
        if (styleAnchor) {
            zip.file('style_anchor.png', styleAnchor.referenceImageBlob);
        }

        // Process each generated 2D asset
        for (const generatedAsset of generatedAssets) {
            const parsedAsset = parsedAssets.find(a => a.id === generatedAsset.assetId);
            if (!parsedAsset) continue;

            const semanticId = generateSemanticId(parsedAsset);
            const categoryFolder = getCategoryFolder(parsedAsset.category);
            const filePath = `${categoryFolder}/${semanticId}.png`;

            const resolution = project.baseResolution || '32x32';
            const [width, height] = resolution.split('x').map((n: string) => parseInt(n, 10));
            const frameCount = parsedAsset.variant?.frameCount || 1;

            let metadata: any;
            try {
                metadata = generatedAsset.metadata ? JSON.parse(generatedAsset.metadata) : { model: 'flux.2-pro', seed: 0 };
            } catch (e) {
                metadata = { model: 'flux.2-pro', seed: 0 };
            }

            const assetMetadata: ExportAssetMetadata = {
                id: semanticId,
                semanticName: `${parsedAsset.category} - ${parsedAsset.name}${parsedAsset.variant?.name ? ` (${parsedAsset.variant.name})` : ''}`,
                path: filePath,
                category: parsedAsset.category.toLowerCase().replace(/s$/, ''),
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

            manifest.assets.push(assetMetadata);

            const clientAsset = clientAssets?.find((a: any) => a.id === generatedAsset.id);
            if (clientAsset && clientAsset.imageBlob) {
                const imageBuffer = Buffer.from(clientAsset.imageBlob, 'base64');
                zip.file(filePath, imageBuffer);
            }
        }

        // Process each generated 3D asset
        for (const asset of generated3DAssets) {
            const isSkybox = asset.assetId.endsWith('-skybox');
            
            if (isSkybox && asset.draftModelUrl) {
                try {
                    const buffer = await fetchAsBuffer(asset.draftModelUrl);
                    const filePath = `skybox/${asset.assetId}.jpg`;
                    zip.file(filePath, buffer);
                    
                    manifest.assets3d.push({
                        id: asset.assetId,
                        type: 'skybox',
                        path: filePath,
                        prompt: asset.promptUsed,
                    });
                } catch (err) {
                    console.error(`Failed to fetch skybox: ${err}`);
                }
            } else {
                const modelFolder = `models/${asset.assetId}`;
                const assetMetadata: any = {
                    id: asset.assetId,
                    type: 'model',
                    folder: modelFolder,
                    prompt: asset.promptUsed,
                    files: {},
                };

                if (asset.draftModelUrl) {
                    try {
                        const buffer = await fetchAsBuffer(asset.draftModelUrl);
                        const path = `${modelFolder}/draft.glb`;
                        zip.file(path, buffer);
                        assetMetadata.files.draft = path;
                    } catch (err) {}
                }

                if (asset.riggedModelUrl) {
                    try {
                        const buffer = await fetchAsBuffer(asset.riggedModelUrl);
                        const path = `${modelFolder}/rigged.glb`;
                        zip.file(path, buffer);
                        assetMetadata.files.rigged = path;
                    } catch (err) {}
                }

                if (asset.animatedModelUrls) {
                    try {
                        const animUrls = JSON.parse(asset.animatedModelUrls);
                        assetMetadata.files.animations = {};
                        for (const [preset, url] of Object.entries(animUrls)) {
                            try {
                                const buffer = await fetchAsBuffer(url as string);
                                const animName = preset.replace('preset:', '');
                                const path = `${modelFolder}/animations/${animName}.glb`;
                                zip.file(path, buffer);
                                assetMetadata.files.animations[animName] = path;
                            } catch (err) {}
                        }
                    } catch (err) {}
                }

                manifest.assets3d.push(assetMetadata);
            }
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
