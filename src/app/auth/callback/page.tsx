// PATCH 5: Fixed auth callback for all flows
// Changes:
// - Handles PKCE, implicit, and magic link flows
// - Better error handling
// - Proper session verification

"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uyufenhltvwxypldaemj.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWZlbmhsdHZ3eHlwbGRhZW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTYwNjUsImV4cCI6MjA3ODU3MjA2NX0.X4kJCvS6bK207thqCBpgcRTrV_n0N7k0kbAm9E_xdsc";

function CallbackContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Scanning frequency...");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const next = searchParams.get("next") || "https://www.entropyofficial.com";
                
                // 1. Check for errors first
                const errorDescription = searchParams.get("error_description") || searchParams.get("error");
                if (errorDescription) {
                    setStatus(`Connection Refused`);
                    setError(errorDescription);
                    setTimeout(() => {
                        window.location.href = "/login?error=" + encodeURIComponent(errorDescription);
                    }, 3000);
                    return;
                }

                // 2. Check for PKCE Code (Server-side flow)
                const code = searchParams.get("code");
                
                // 3. Check for Hash Tokens (Client-side / Implicit flow)
                const hash = window.location.hash;
                const hashParams = new URLSearchParams(hash.replace("#", "?"));
                const accessToken = hashParams.get("access_token");
                const refreshToken = hashParams.get("refresh_token");
                const type = hashParams.get("type"); // 'recovery' for password reset

                // --- SCENARIO A: PKCE CODE (Exchange needed) ---
                if (code) {
                    setStatus("Exchanging secure codes...");
                    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                        auth: {
                            flowType: 'pkce',
                            detectSessionInUrl: true,
                            persistSession: true
                        }
                    });
                    
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        setStatus("Exchange Failed");
                        setError(error.message);
                        console.error("Exchange error:", error);
                        setTimeout(() => {
                            window.location.href = "/login?error=exchange_failed";
                        }, 3000);
                        return;
                    }

                    if (data.session) {
                        setStatus("Verified. Redirecting...");
                        redirectUser(next, data.session.access_token, data.session.refresh_token, type === 'recovery');
                    } else {
                        setStatus("No session returned");
                        setError("Authentication completed but no session was created");
                    }
                    return;
                }

                // --- SCENARIO B: HASH TOKENS (Ready to go) ---
                if (accessToken && refreshToken) {
                    setStatus("Tokens detected. Verifying...");
                    
                    // Verify the tokens are valid
                    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (error) {
                        setStatus("Token verification failed");
                        setError(error.message);
                        console.error("Token verification error:", error);
                        setTimeout(() => {
                            window.location.href = "/login?error=invalid_tokens";
                        }, 3000);
                        return;
                    }

                    if (data.session) {
                        setStatus("Verified. Redirecting...");
                        redirectUser(next, accessToken, refreshToken, type === 'recovery');
                    } else {
                        setStatus("Session creation failed");
                        setError("Could not create session from tokens");
                    }
                    return;
                }

                // --- SCENARIO C: NO DATA ---
                setStatus("No security credentials found in link");
                setError("The authentication link may be invalid or expired");
                console.log("Full URL:", window.location.href);
                console.log("Search params:", Object.fromEntries(searchParams.entries()));
                console.log("Hash:", hash);
                
                setTimeout(() => {
                    window.location.href = "/login?error=no_credentials";
                }, 3000);

            } catch (err: any) {
                console.error("Callback handler error:", err);
                setStatus("System error occurred");
                setError(err.message || "Unknown error");
                setTimeout(() => {
                    window.location.href = "/login?error=callback_error";
                }, 3000);
            }
        };

        const redirectUser = (nextUrl: string, access: string, refresh: string, isRecovery: boolean) => {
            try {
                const redirect = new URL(nextUrl);
                
                // For password recovery, add a flag
                if (isRecovery) {
                    redirect.searchParams.set("reset_password", "true");
                }
                
                // Pass tokens in the hash (more secure than query params)
                redirect.hash = `access_token=${access}&refresh_token=${refresh}`;
                
                setTimeout(() => {
                    window.location.href = redirect.toString();
                }, 500);
            } catch (err) {
                console.error("Redirect error:", err);
                // Fallback to direct redirect
                window.location.href = `${nextUrl}#access_token=${access}&refresh_token=${refresh}`;
            }
        };

        handleCallback();
    }, [searchParams]);

    return (
        <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">SYSTEM HANDSHAKE</h1>
            <p className="font-mono text-sm mb-4">{status}</p>
            
            {error && (
                <div className="bg-red-900/30 border border-red-500 p-4 rounded mb-4 text-left">
                    <p className="text-red-300 text-xs font-mono">{error}</p>
                </div>
            )}
            
            <div className="mt-4 w-12 h-12 border-4 border-[#00FF99] border-t-transparent rounded-full animate-spin mx-auto"></div>
            
            <p className="text-xs mt-6 opacity-50">If you're not redirected, <a href="/login" className="underline">click here</a></p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-[#00FF99] font-mono p-4">
            <Suspense fallback={
                <div className="text-center">
                    <p>Initializing Link...</p>
                    <div className="mt-4 w-12 h-12 border-4 border-[#00FF99] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            }>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
