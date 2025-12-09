"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";

// --- CONFIGURATION ---
const SUPABASE_URL = "https://uyufenhltvwxypldaemj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWZlbmhsdHZ3eHlwbGRhZW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTYwNjUsImV4cCI6MjA3ODU3MjA2NX0.X4kJCvS6bK207thqCBpgcRTrV_n0N7k0kbAm9E_xdsc";

function CallbackContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Scanning frequency...");

    useEffect(() => {
        const handleCallback = async () => {
            const next = searchParams.get("next") || "https://www.entropyofficial.com";
            
            // 1. Check for PKCE Code (Server-side flow)
            const code = searchParams.get("code");
            
            // 2. Check for Hash Tokens (Client-side / Implicit flow)
            // (Supabase sometimes puts tokens after the # symbol)
            const hash = window.location.hash;
            const hashParams = new URLSearchParams(hash.replace("#", "?"));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            const errorDescription = searchParams.get("error_description") || hashParams.get("error_description");

            // --- SCENARIO A: ERROR ---
            if (errorDescription) {
                setStatus(`Connection Refused: ${errorDescription}`);
                setTimeout(() => window.location.href = "/login?error=" + encodeURIComponent(errorDescription), 3000);
                return;
            }

            // --- SCENARIO B: PKCE CODE (Exchange needed) ---
            if (code) {
                setStatus("Exchanging secure codes...");
                const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                if (!error && data.session) {
                    redirectUser(next, data.session.access_token, data.session.refresh_token);
                } else {
                    setStatus("Exchange Failed: " + (error?.message || "Unknown Error"));
                    setTimeout(() => window.location.href = "/login?error=exchange_failed", 3000);
                }
                return;
            }

            // --- SCENARIO C: HASH TOKENS (Ready to go) ---
            if (accessToken && refreshToken) {
                setStatus("Tokens detected. Redirecting...");
                redirectUser(next, accessToken, refreshToken);
                return;
            }

            // --- SCENARIO D: NO DATA ---
            console.log("Full URL:", window.location.href);
            setStatus("No security credentials found in link.");
        };

        const redirectUser = (nextUrl: string, access: string, refresh: string) => {
            const redirect = new URL(nextUrl);
            redirect.searchParams.set("reset_password", "true");
            // We pass tokens in the hash so they don't get logged in server history
            redirect.hash = `access_token=${access}&refresh_token=${refresh}`;
            window.location.href = redirect.toString();
        };

        handleCallback();
    }, [searchParams]);

    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">SYSTEM HANDSHAKE</h1>
            <p className="font-mono text-sm">{status}</p>
            <div className="mt-4 w-12 h-12 border-4 border-[#00FF99] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="flex items-center justify-center h-screen bg-black text-[#00FF99] font-mono">
            <Suspense fallback={<div>Initializing Link...</div>}>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
