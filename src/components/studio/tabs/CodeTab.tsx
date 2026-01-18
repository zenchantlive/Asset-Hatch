// -----------------------------------------------------------------------------
// Code Tab Component
// Monaco editor with file explorer for viewing and editing Babylon.js code
// Multi-file support: Displays file explorer sidebar and Monaco tabs for editing
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStudio } from '@/lib/studio/context';
import { Button } from '@/components/ui/button';
import { Play, FileCode, X, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { GameFileData } from '@/lib/studio/types';

// Dynamically import Monaco to avoid SSR issues
let Editor: typeof import('@monaco-editor/react').Editor | null = null;

/**
 * CodeTab - Monaco editor with file explorer for multi-file editing
 */
export function CodeTab() {
    const { 
        files, 
        activeFileId, 
        setActiveFileId, 
        updateFileContent, 
        refreshPreview 
    } = useStudio();
    
    const [isEditorLoaded, setIsEditorLoaded] = useState(false);
    const [editorComponent, setEditorComponent] = useState<typeof import('@monaco-editor/react').Editor | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

    // Get currently active file
    const activeFile = files.find((f) => f.id === activeFileId) || null;

    // Dynamically import Monaco editor on mount
    useEffect(() => {
        import('@monaco-editor/react').then((module) => {
            Editor = module.Editor;
            setEditorComponent(() => module.Editor);
            setIsEditorLoaded(true);
        });
    }, []);

    // Configure Monaco before mount
    const handleEditorWillMount = useCallback((monaco: Monaco) => {
        // Add Babylon.js type definitions
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        });

        // Add Babylon.js as external library
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
            `declare namespace BABYLON {
        class Engine {
          constructor(canvas: HTMLCanvasElement, antialias?: boolean);
          runRenderLoop(renderFunction: () => void): void;
          resize(): void;
          getFps(): number;
        }
        class Scene {
          constructor(engine: Engine);
          render(): void;
          registerBeforeRender(callback: () => void): void;
        }
        class ArcRotateCamera {
          constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene);
          attachControl(canvas: HTMLCanvasElement, noPreventDefault?: boolean): void;
        }
        class HemisphericLight {
          constructor(name: string, direction: Vector3, scene: Scene);
          intensity: number;
        }
        class Vector3 {
          constructor(x: number, y: number, z: number);
          static Zero(): Vector3;
        }
        class MeshBuilder {
          static CreateBox(name: string, options: any, scene: Scene): Mesh;
          static CreateSphere(name: string, options: any, scene: Scene): Mesh;
          static CreateGround(name: string, options: any, scene: Scene): Mesh;
        }
        class Mesh {
          position: Vector3;
          rotation: Vector3;
          scaling: Vector3;
        }
      }`,
            'babylon.d.ts'
        );
    }, []);

    // Handle code changes in active file
    const handleEditorChange = useCallback((value: string | undefined) => {
        if (activeFile && value !== undefined) {
            updateFileContent(activeFile.id, value);
        }
    }, [activeFile, updateFileContent]);

    // Handle run button click
    const handleRun = useCallback(() => {
        refreshPreview();
    }, [refreshPreview]);

    // Toggle folder expansion
    const toggleFolder = useCallback((folderId: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback((fileId: string) => {
        setActiveFileId(fileId);
    }, [setActiveFileId]);

    // Loading state
    if (!isEditorLoaded || !editorComponent) {
        return (
            <div className="h-full flex items-center justify-center bg-studio-code-bg">
                <p className="text-sm text-muted-foreground">Loading editor...</p>
            </div>
        );
    }

    const EditorComponent = editorComponent;

    return (
        <div className="h-full flex">
            {/* File Explorer Sidebar */}
            <div className="w-48 border-r border-studio-panel-border bg-studio-panel-bg flex flex-col">
                {/* Header */}
                <div className="h-12 border-b border-studio-panel-border px-3 flex items-center">
                    <span className="text-sm font-medium">Files</span>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Root folder - contains all files */}
                    <div className="mb-2">
                        {/* Root toggle */}
                        <button
                            onClick={() => toggleFolder('root')}
                            className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-white/5 rounded cursor-pointer"
                        >
                            {expandedFolders.has('root') ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <Folder className="w-4 h-4 text-yellow-500" />
                            <span>root</span>
                        </button>

                        {/* Files in root */}
                        {expandedFolders.has('root') && (
                            <div className="ml-4 mt-1 space-y-0.5">
                                {files.map((file) => (
                                    <button
                                        key={file.id}
                                        onClick={() => handleFileSelect(file.id)}
                                        className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded cursor-pointer transition-colors ${
                                            activeFileId === file.id
                                                ? 'bg-primary/20 text-primary'
                                                : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <FileCode className="w-4 h-4" />
                                        <span className="truncate">{file.name}</span>
                                    </button>
                                ))}
                                
                                {files.length === 0 && (
                                    <div className="px-2 py-1 text-xs text-muted-foreground">
                                        No files yet
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* File count footer */}
                <div className="h-8 border-t border-studio-panel-border px-3 flex items-center text-xs text-muted-foreground">
                    {files.length} file{files.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar with tab */}
                <div className="h-12 border-b border-studio-panel-border flex items-center bg-studio-panel-bg">
                    {/* Active file tab */}
                    {activeFile ? (
                        <div className="flex items-center gap-2 px-4 h-full bg-primary/10 border-b-2 border-primary">
                            <FileCode className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">{activeFile.name}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                                (order: {activeFile.orderIndex})
                            </span>
                        </div>
                    ) : (
                        <div className="px-4 h-full flex items-center text-sm text-muted-foreground">
                            No file selected
                        </div>
                    )}

                    <div className="flex-1" />

                    {/* Run button */}
                    <Button
                        size="sm"
                        onClick={handleRun}
                        className="mr-4 gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Play className="h-4 w-4" />
                        Run
                    </Button>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 bg-studio-code-bg">
                    {activeFile ? (
                        <EditorComponent
                            height="100%"
                            defaultLanguage="javascript"
                            value={activeFile.content}
                            onChange={handleEditorChange}
                            theme="vs-dark"
                            beforeMount={handleEditorWillMount}
                            options={{
                                minimap: { enabled: true },
                                fontSize: 14,
                                lineNumbers: 'on',
                                roundedSelection: false,
                                scrollBeyondLastLine: false,
                                readOnly: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'on',
                            }}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p className="text-sm">Select a file to edit</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
