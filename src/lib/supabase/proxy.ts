import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getPublicEnv, hasPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!hasPublicSupabaseEnv()) {
    if (pathname.startsWith("/studio")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("reason", "setup");
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  const requestHeaders = new Headers(request.headers);
  // These headers are an internal hand-off from proxy to Server Components.
  // Remove client-supplied values before adding the verified identity below.
  requestHeaders.delete("x-xiaobai-auth-user-id");
  requestHeaders.delete("x-xiaobai-auth-user-email");
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];
  const env = getPublicEnv();

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToApply) {
          cookiesToApply.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            pendingCookies.push({ name, value, options });
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    requestHeaders.set("x-xiaobai-auth-user-id", user.id);
    if (user.email) {
      requestHeaders.set("x-xiaobai-auth-user-email", user.email);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));

  if (pathname.startsWith("/studio")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      const redirectResponse = NextResponse.redirect(url);
      pendingCookies.forEach(({ name, value, options }) => redirectResponse.cookies.set(name, value, options));
      return redirectResponse;
    }
  }

  return response;
}
