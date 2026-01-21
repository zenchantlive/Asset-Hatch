// Client component for managing OpenRouter and Tripo API keys
// Handles fetching, displaying, and updating user's API keys
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Eye, EyeOff, Trash2 } from "lucide-react";

// Type for the settings response from the API
interface SettingsResponse {
    hasOpenRouterKey: boolean;
    openRouterKeyPreview: string | null;
    hasTripoKey: boolean;
    tripoKeyPreview: string | null;
}

// Component props
interface ApiKeySettingsProps {
    // Whether this is the welcome/onboarding flow
    isWelcome?: boolean;
}

// Reusable API key input component
interface ApiKeyInputProps {
    label: string;
    placeholder: string;
    keyPrefix: string;
    description: string;
    hasKey: boolean;
    keyPreview: string | null;
    isSaving: boolean;
    error: string | null;
    success: boolean;
    inputValue: string;
    showKey: boolean;
    onInputChange: (value: string) => void;
    onShowKeyToggle: () => void;
    onSave: () => void;
    onRemove: () => void;
    onSuccessChange: (value: boolean) => void;
    onErrorChange: (value: string | null) => void;
    isWelcome?: boolean;
}

function ApiKeyInput({
    label,
    placeholder,
    keyPrefix,
    description,
    hasKey,
    keyPreview,
    isSaving,
    error,
    success,
    inputValue,
    showKey,
    onInputChange,
    onShowKeyToggle,
    onSave,
    onRemove,
    onSuccessChange,
    onErrorChange,
    isWelcome = false,
}: ApiKeyInputProps) {
    return (
        <div className="space-y-4">
            {/* Current key status */}
            {hasKey && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">
                            {label} configured: {keyPreview}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRemove}
                        disabled={isSaving}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* API key input */}
            <div className="space-y-3">
                <div className="relative">
                    <Input
                        type={showKey ? "text" : "password"}
                        value={inputValue}
                        onChange={(e) => {
                            onInputChange(e.target.value);
                            onErrorChange(null); // Clear error on input
                        }}
                        placeholder={placeholder}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                    />
                    <button
                        type="button"
                        onClick={onShowKeyToggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                        <X className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Success message */}
                {success && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        <span>
                            {isWelcome
                                ? "API key saved! Redirecting..."
                                : "API key saved successfully!"}
                        </span>
                    </div>
                )}

                {/* Save button */}
                <Button
                    onClick={onSave}
                    disabled={isSaving || !inputValue.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
                        </>
                    ) : hasKey ? (
                        "Update API Key"
                    ) : (
                        "Save API Key"
                    )}
                </Button>
            </div>
        </div>
    );
}

export function ApiKeySettings({ isWelcome = false }: ApiKeySettingsProps) {
    const router = useRouter();

    // OpenRouter state
    const [openRouterApiKey, setOpenRouterApiKey] = useState("");
    const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
    const [openRouterError, setOpenRouterError] = useState<string | null>(null);
    const [openRouterSuccess, setOpenRouterSuccess] = useState(false);

    // Tripo state
    const [tripoApiKey, setTripoApiKey] = useState("");
    const [showTripoKey, setShowTripoKey] = useState(false);
    const [tripoError, setTripoError] = useState<string | null>(null);
    const [tripoSuccess, setTripoSuccess] = useState(false);

    // Shared state
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingOpenRouter, setIsSavingOpenRouter] = useState(false);
    const [isSavingTripo, setIsSavingTripo] = useState(false);
    const [settings, setSettings] = useState<SettingsResponse | null>(null);

    // Fetch current settings on mount
    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/settings");
            if (!response.ok) {
                throw new Error("Failed to fetch settings");
            }
            const data = await response.json();
            setSettings(data);
        } catch (err) {
            console.error("Error fetching settings:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Save OpenRouter API key
    const handleSaveOpenRouter = async () => {
        if (!openRouterApiKey.trim()) {
            setOpenRouterError("Please enter an API key");
            return;
        }

        // Basic validation - OpenRouter keys start with sk-or-
        if (!openRouterApiKey.startsWith("sk-or-")) {
            setOpenRouterError("Invalid key format. OpenRouter keys start with 'sk-or-'");
            return;
        }

        try {
            setIsSavingOpenRouter(true);
            setOpenRouterError(null);
            setOpenRouterSuccess(false);

            const response = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ openRouterApiKey }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save API key");
            }

            // Success - update UI
            setOpenRouterSuccess(true);
            setOpenRouterApiKey(""); // Clear input
            await fetchSettings(); // Refresh settings

            // If this is the welcome flow, redirect to dashboard after a brief delay
            if (isWelcome) {
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1500);
            } else {
                // Clear success message after 3 seconds for normal flow
                setTimeout(() => setOpenRouterSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Error saving OpenRouter API key:", err);
            setOpenRouterError(err instanceof Error ? err.message : "Failed to save API key");
        } finally {
            setIsSavingOpenRouter(false);
        }
    };

    // Remove OpenRouter API key
    const handleRemoveOpenRouter = async () => {
        try {
            setIsSavingOpenRouter(true);
            setOpenRouterError(null);

            const response = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ openRouterApiKey: null }),
            });

            if (!response.ok) {
                throw new Error("Failed to remove API key");
            }

            await fetchSettings(); // Refresh settings
        } catch (err) {
            console.error("Error removing OpenRouter API key:", err);
            setOpenRouterError(err instanceof Error ? err.message : "Failed to remove API key");
        } finally {
            setIsSavingOpenRouter(false);
        }
    };

    // Save Tripo API key
    const handleSaveTripo = async () => {
        if (!tripoApiKey.trim()) {
            setTripoError("Please enter a Tripo API key");
            return;
        }

        // Basic validation - Tripo keys start with tsk_
        if (!tripoApiKey.startsWith("tsk_")) {
            setTripoError("Invalid key format. Tripo keys start with 'tsk_'");
            return;
        }

        try {
            setIsSavingTripo(true);
            setTripoError(null);
            setTripoSuccess(false);

            const response = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripoApiKey }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save Tripo API key");
            }

            // Success - update UI
            setTripoSuccess(true);
            setTripoApiKey(""); // Clear input
            await fetchSettings(); // Refresh settings

            // Clear success message after 3 seconds for normal flow
            setTimeout(() => setTripoSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving Tripo API key:", err);
            setTripoError(err instanceof Error ? err.message : "Failed to save Tripo API key");
        } finally {
            setIsSavingTripo(false);
        }
    };

    // Remove Tripo API key
    const handleRemoveTripo = async () => {
        try {
            setIsSavingTripo(true);
            setTripoError(null);

            const response = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripoApiKey: null }),
            });

            if (!response.ok) {
                throw new Error("Failed to remove Tripo API key");
            }

            await fetchSettings(); // Refresh settings
        } catch (err) {
            console.error("Error removing Tripo API key:", err);
            setTripoError(err instanceof Error ? err.message : "Failed to remove Tripo API key");
        } finally {
            setIsSavingTripo(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* OpenRouter API Key */}
            <ApiKeyInput
                label="OpenRouter API key"
                placeholder="sk-or-xxxxxxxxxxxxxxxxxxxxxxxx"
                keyPrefix="sk-or-"
                description="Add your own OpenRouter API key to use your own credits for image generation."
                hasKey={settings?.hasOpenRouterKey ?? false}
                keyPreview={settings?.openRouterKeyPreview ?? null}
                isSaving={isSavingOpenRouter}
                error={openRouterError}
                success={openRouterSuccess}
                inputValue={openRouterApiKey}
                showKey={showOpenRouterKey}
                onInputChange={setOpenRouterApiKey}
                onShowKeyToggle={() => setShowOpenRouterKey(!showOpenRouterKey)}
                onSave={handleSaveOpenRouter}
                onRemove={handleRemoveOpenRouter}
                onSuccessChange={setOpenRouterSuccess}
                onErrorChange={setOpenRouterError}
                isWelcome={isWelcome}
            />

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Tripo API Key */}
            <ApiKeyInput
                label="Tripo3D API key"
                placeholder="tsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                keyPrefix="tsk_"
                description="Add your own Tripo API key to use your own credits for 3D model generation."
                hasKey={settings?.hasTripoKey ?? false}
                keyPreview={settings?.tripoKeyPreview ?? null}
                isSaving={isSavingTripo}
                error={tripoError}
                success={tripoSuccess}
                inputValue={tripoApiKey}
                showKey={showTripoKey}
                onInputChange={setTripoApiKey}
                onShowKeyToggle={() => setShowTripoKey(!showTripoKey)}
                onSave={handleSaveTripo}
                onRemove={handleRemoveTripo}
                onSuccessChange={setTripoSuccess}
                onErrorChange={setTripoError}
            />
        </div>
    );
}
