// Settings page for managing user preferences and API keys
// Allows users to add their own OpenRouter and Tripo API keys (BYOK)

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import Link from "next/link";

// Server component - handles auth check
export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ welcome?: string }>;
}) {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
        redirect("/");
    }

    // Check if this is a new user welcome flow
    const params = await searchParams;
    const isWelcome = params.welcome === "true";

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-2xl font-bold text-white">
                        {isWelcome ? "Welcome to Asset Hatch! 🎉" : "Settings"}
                    </h1>
                    <p className="text-white/60 mt-1">
                        {isWelcome
                            ? "Let's get you set up with your API keys to start generating assets"
                            : "Manage your account and API configuration"}
                    </p>
                </div>
            </div>

            {/* Settings Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Welcome banner for new users */}
                    {isWelcome && (
                        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm p-6">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                🚀 Quick Start
                            </h3>
                            <p className="text-white/80 text-sm mb-4">
                                To generate your own game assets, you&apos;ll need an OpenRouter API key for 2D images
                                and optionally a Tripo API key for 3D models. Add your keys below to get started,
                                or you can skip this step and add them later.
                            </p>
                            <Link
                                href="/dashboard"
                                className="inline-block px-4 py-2 text-sm bg-white/10 hover:bg-white/20
                                         text-white rounded-lg transition-colors border border-white/10"
                            >
                                Skip for now → Go to Dashboard
                            </Link>
                        </div>
                    )}

                    {/* API Keys Section */}
                    <section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            API Keys (BYOK)
                        </h2>
                        <p className="text-white/60 text-sm mb-6">
                            Add your own API keys to use your own credits for asset generation.
                            This is optional — the demo uses shared credits, but adding your own keys
                            gives you unlimited generations.
                        </p>

                        {/* Client component for API key management */}
                        <ApiKeySettings isWelcome={isWelcome} />
                    </section>

                    {/* OpenRouter Instructions */}
                    <section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            How to Get an OpenRouter API Key
                        </h2>
                        <ol className="list-decimal list-inside text-white/60 text-sm space-y-2">
                            <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">openrouter.ai</a></li>
                            <li>Create an account or sign in</li>
                            <li>Navigate to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">API Keys</a></li>
                            <li>Create a new key and copy it here (starts with sk-or-)</li>
                        </ol>
                        <p className="text-white/40 text-xs mt-4">
                            Pricing: ~$0.04 per image generation (Flux 2 Pro)
                        </p>
                    </section>

                    {/* Tripo Instructions */}
                    <section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            How to Get a Tripo3D API Key
                        </h2>
                        <ol className="list-decimal list-inside text-white/60 text-sm space-y-2">
                            <li>Go to <a href="https://platform.tripo3d.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">platform.tripo3d.ai</a></li>
                            <li>Create an account or sign in</li>
                            <li>Navigate to your dashboard or API section</li>
                            <li>Create a new API key and copy it here (starts with tsk-)</li>
                        </ol>
                        <p className="text-white/40 text-xs mt-4">
                            Pricing: ~$0.20 per 3D model generation
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
