"use client";

// -----------------------------------------------------------------------------
// Home Page - Landing
// Marketing landing page with auth controls (no project list)
// -----------------------------------------------------------------------------

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInModal, RegisterModal } from "@/components/auth";
import { ArrowRight, Sparkles, Palette, Zap } from "lucide-react";

// =============================================================================
// COMPONENT
// =============================================================================

export default function Home() {
  // Auth state
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const router = useRouter();

  // Modal state
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Redirect authenticated users to dashboard
  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      setIsRegisterOpen(true);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <main className="text-center py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-6xl font-bold text-zinc-50 mb-6">
              AI-Powered Game Asset Studio
            </h2>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
              Create consistent, production-ready game assets with AI. From
              concept to sprite sheet in minutes, not weeks.
            </p>

            <div className="flex justify-center gap-4 mb-16">
              <Button size="lg" onClick={handleGetStarted}>
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsSignInOpen(true)}
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="glass-panel p-6 text-left">
                <Sparkles className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-zinc-50 mb-2">
                  AI Asset Planning
                </h3>
                <p className="text-sm text-zinc-400">
                  Describe your vision and let AI build a comprehensive asset
                  list with categories, variants, and specifications.
                </p>
              </div>

              <div className="glass-panel p-6 text-left">
                <Palette className="h-8 w-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-zinc-50 mb-2">
                  Style Anchoring
                </h3>
                <p className="text-sm text-zinc-400">
                  Upload reference images to establish a visual style. Every
                  generated asset stays consistent with your vision.
                </p>
              </div>

              <div className="glass-panel p-6 text-left">
                <Zap className="h-8 w-8 text-yellow-400 mb-4" />
                <h3 className="text-lg font-semibold text-zinc-50 mb-2">
                  Batch Generation
                </h3>
                <p className="text-sm text-zinc-400">
                  Generate entire asset libraries at once. Characters, props,
                  tiles, and UI elements - all cohesive and game-ready.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Auth Modals */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSwitchToRegister={() => {
          setIsSignInOpen(false);
          setIsRegisterOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToSignIn={() => {
          setIsRegisterOpen(false);
          setIsSignInOpen(true);
        }}
      />
    </div>
  );
}
