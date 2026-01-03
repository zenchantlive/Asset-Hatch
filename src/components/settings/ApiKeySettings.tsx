// Client component for managing OpenRouter API key
// Handles fetching, displaying, and updating the user's API key
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Eye, EyeOff, Trash2 } from "lucide-react";

// Type for the settings response from the API
interface SettingsResponse {
    hasApiKey: boolean;
    apiKeyPreview: string | null;
}

export function ApiKeySettings() {
    // State for API key input and UI
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<SettingsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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
            setError("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Save the API key
    const handleSave = async () => {
        if (!apiKey.trim()) {
            setError("Please enter an API key");
            return;
        }

        // Basic validation - OpenRouter keys start with sk-or-
        if (!apiKey.startsWith("sk-or-")) {
            setError("Invalid key format. OpenRouter keys start with 'sk-or-'");
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            setSuccess(false);

            const response = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ openRouterApiKey: apiKey }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save API key");
            }

            // Success - update UI
            setSuccess(true);
            setApiKey(""); // Clear input
            await fetchSettings(); // Refresh settings

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving API key:", err);
            setError(err instanceof Error ? err.message : "Failed to save API key");
        } finally {
            setIsSaving(false);
        }
    };

    // Remove the API key
    const handleRemove = async () => {
        try {
            setIsSaving(true);
            setError(null);

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
            console.error("Error removing API key:", err);
            setError(err instanceof Error ? err.message : "Failed to remove API key");
        } finally {
            setIsSaving(false);
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
        <div className="space-y-4">
            {/* Current key status */}
            {settings?.hasApiKey && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">
                            API key configured: {settings.apiKeyPreview}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemove}
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
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            setError(null); // Clear error on input
                        }}
                        placeholder="sk-or-xxxxxxxxxxxxxxxxxxxxxxxx"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
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
                        <span>API key saved successfully!</span>
                    </div>
                )}

                {/* Save button */}
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !apiKey.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
                        </>
                    ) : settings?.hasApiKey ? (
                        "Update API Key"
                    ) : (
                        "Save API Key"
                    )}
                </Button>
            </div>
        </div>
    );
}
