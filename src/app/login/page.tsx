"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// FIXED: Removed 'www' to match your live site (Ensure this matches your preference)
const FRAMER_ORIGIN = "https://www.entropyofficial.com"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // For success messages
  const [loading, setLoading] = useState(false);
  
  // New State: Toggle between 'login' and 'forgot' views
  const [view, setView] = useState<'login' | 'forgot'>('login');

  async function handleLogin() {
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      if (window.parent && window.parent !== window) {
          window.parent.postMessage({
              type: "SUPABASE_SESSION",
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
          }, FRAMER_ORIGIN);
      }

      const access = data.session.access_token;
      const refresh = data.session.refresh_token;
      
      if (window.location.search.includes('embed=true')) {
          window.location.href = "/?embed=true&window=inventory";
      } else {
          window.location.href = `${FRAMER_ORIGIN}/#access_token=${access}&refresh_token=${refresh}`;
      }
    }
  }

  // --- PASSWORD RESET FUNCTION ---
  async function handleResetPassword() {
      if (!email) {
          setError("Please enter your email address.");
          return;
      }
      setLoading(true);
      setError("");
      setMessage("");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          // Redirects them to home, logged in, where they can change password in profile (future feature)
          redirectTo: `${FRAMER_ORIGIN}/?reset_password=true`, 
      });

      if (error) {
          setError(error.message);
      } else {
          setMessage("Recovery signal sent. Check your email.");
      }
      setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#008080]">
      <h1 className="text-3xl font-bold text-white font-mono">
          {view === 'login' ? 'Entropy OS Login' : 'System Recovery'}
      </h1>

      {view === 'login' ? (
          // --- LOGIN FORM ---
          <>
            <input className="border p-2 rounded w-72 text-black" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="border p-2 rounded w-72 text-black" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            
            {error && <p className="text-red-500 bg-black p-2 border border-red-500 rounded text-sm">{error}</p>}
            
            <button onClick={handleLogin} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded border-2 border-white shadow-[4px_4px_0_black] active:translate-y-1 active:shadow-none font-bold">
                {loading ? "Authenticating..." : "Login"}
            </button>

            <div className="flex flex-col items-center gap-2 mt-2">
                <button onClick={() => { setView('forgot'); setError(""); setMessage(""); }} className="text-white underline text-sm opacity-80 hover:opacity-100 hover:text-[#00FF99]">
                    Forgot Password?
                </button>
                <a href="/signup" className="text-white underline text-sm opacity-80 hover:opacity-100 hover:text-[#00FF99]">
                    Create an account
                </a>
            </div>
          </>
      ) : (
          // --- FORGOT PASSWORD FORM ---
          <>
            <p className="text-white text-sm max-w-xs text-center opacity-90">Enter your email to receive a magic login link.</p>
            <input className="border p-2 rounded w-72 text-black" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            
            {error && <p className="text-red-500 bg-black p-2 border border-red-500 rounded text-sm">{error}</p>}
            {message && <p className="text-[#00FF99] bg-black p-3 border border-[#00FF99] rounded text-sm font-bold">{message}</p>}

            <button onClick={handleResetPassword} disabled={loading} className="bg-purple-600 text-white px-6 py-2 rounded border-2 border-white shadow-[4px_4px_0_black] active:translate-y-1 active:shadow-none font-bold">
                {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <button onClick={() => { setView('login'); setError(""); setMessage(""); }} className="text-white underline text-sm mt-4 hover:text-[#00FF99]">
                Back to Login
            </button>
          </>
      )}
    </div>
  );
}
