// Settings page for managing user preferences and API keys
// Allows users to add their own OpenRouter API key (BYOK)

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";

// Server component - handles auth check
export default async function SettingsPage() {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-white/60 mt-1">
                        Manage your account and API configuration
                    </p>
                </div>
            </div>

            {/* Settings Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* API Key Section */}
                    <section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            OpenRouter API Key
                        </h2>
                        <p className="text-white/60 text-sm mb-6">
                            Add your own OpenRouter API key to use your own credits for image generation.
                            This is optional — the demo uses shared credits, but adding your own key
                            gives you unlimited generations.
                        </p>

                        {/* Client component for API key management */}
                        <ApiKeySettings />
                    </section>

                    {/* Get API Key Info */}
                    <section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            How to Get an API Key
                        </h2>
                        <ol className="list-decimal list-inside text-white/60 text-sm space-y-2">
                            <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">openrouter.ai</a></li>
                            <li>Create an account or sign in</li>
                            <li>Navigate to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">API Keys</a></li>
                            <li>Create a new key and copy it here</li>
                        </ol>
                        <p className="text-white/40 text-xs mt-4">
                            Pricing: ~$0.04 per image generation (Flux 2 Pro)
                        </p>
                    </section>

                    {/* Back to Dashboard */}
                    <div className="pt-4">
                        <a
                            href="/dashboard"
                            className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                            ← Back to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
