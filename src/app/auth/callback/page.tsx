"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

// --- CONFIGURATION ---
const SUPABASE_URL = "https://uyufenhltvwxypldaemj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWZlbmhsdHZ3eHlwbGRhZW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTYwNjUsImV4cCI6MjA3ODU3MjA2NX0.X4kJCvS6bK207thqCBpgcRTrV_n0N7k0kbAm9E_xdsc";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Verifying security clearance...");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const next = searchParams.get("next") || "https://www.entropyofficial.com";

            if (code) {
                // Initialize a local client (Accesses LocalStorage correctly)
                const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

                // 1. Exchange the code for a session
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                if (!error && data.session) {
                    setStatus("Access Granted. Redirecting to terminal...");
                    const { access_token, refresh_token } = data.session;

                    // 2. Redirect to Framer with the tokens
                    const redirectUrl = new URL(next);
                    redirectUrl.searchParams.set("reset_password", "true");
                    redirectUrl.hash = `access_token=${access_token}&refresh_token=${refresh_token}`;
                    
                    window.location.href = redirectUrl.toString();
                } else {
                    setStatus("Verification Failed: " + (error?.message || "Unknown Error"));
                    // Fallback after 3 seconds
                    setTimeout(() => {
                        window.location.href = "/login?error=auth_failed";
                    }, 3000);
                }
            } else {
                setStatus("No code detected.");
            }
        };

        handleCallback();
    }, [searchParams]);

    return (
        <div className="flex items-center justify-center h-screen bg-black text-[#00FF99] font-mono">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">SYSTEM HANDSHAKE</h1>
                <p>{status}</p>
                <div className="mt-4 w-12 h-12 border-4 border-[#00FF99] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        </div>
    );
}
