import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // This 'next' param comes from the redirectTo we set in the login page
  const next = requestUrl.searchParams.get("next") || "https://www.entropyofficial.com";

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Exchange the code for a session
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    
    // 2. If successful, forward the tokens to Framer via URL hash
    // (Framer can't read Vercel cookies, so we pass tokens explicitly)
    if (data.session) {
        const { access_token, refresh_token } = data.session;
        
        // Construct the final URL for Framer
        // We add 'reset_password=true' so Framer knows to pop up the change password box
        const redirectUrl = new URL(next);
        redirectUrl.searchParams.set("reset_password", "true");
        redirectUrl.hash = `access_token=${access_token}&refresh_token=${refresh_token}`;
        
        return NextResponse.redirect(redirectUrl.toString());
    }
  }

  // If something fails, redirect to home with error
  return NextResponse.redirect(requestUrl.origin + "/login?error=auth_failed");
}
