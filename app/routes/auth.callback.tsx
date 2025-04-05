// app/auth.callback.tsx
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authenticate, sessionStorage } from "../shopify.server";

// Use your external onboarding URL (ngrok)
const EXTERNAL_ONBOARDING_URL = "https://5a24-223-181-35-118.ngrok-free.app";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Auth callback received:", request.url);

  // Attempt to complete the OAuth process.
  const authResult = await authenticate.admin(request);

  // If we receive a redirect response (status 302), override its Location header.
  if (authResult instanceof Response && authResult.status === 302) {
    console.warn("authenticate.admin returned a 302 redirect; attempting to override it.");

    // Try to extract the shop from the request URL.
    const shop = new URL(request.url).searchParams.get("shop");
    if (!shop) throw new Error("Shop not found in URL");

    // Retrieve the session from cookies.
    const cookie = request.headers.get("Cookie") || "";
    const session = await sessionStorage.getSession(cookie);

    // Try to get the access token from the session.
    const accessToken = session?.get("accessToken");

    // Build the external URL.
    const externalUrl = accessToken
      ? `${EXTERNAL_ONBOARDING_URL}/?shop=${encodeURIComponent(shop)}&accessToken=${encodeURIComponent(accessToken)}`
      : `${EXTERNAL_ONBOARDING_URL}/?shop=${encodeURIComponent(shop)}`;

    return redirect(externalUrl, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    });
  }

  // If no redirect response, assume we have a valid session.
  if (!(authResult instanceof Response)) {
    const { session } = authResult as { session: { shop: string; accessToken: string } };
    console.log("Auth callback successful for shop:", session.shop);
    console.log("Access token:", session.accessToken);

    // Optionally, call your createStore API.
    try {
      console.log("Calling createStore API from auth.callback");
      const createStoreResponse = await fetch("https://aggregator.gobbl.ai/api/shopify/createStore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: session.accessToken,
          storeUrl: session.shop,
          products: [],
        }),
      });
      console.log("API response status:", createStoreResponse.status);
    } catch (apiError) {
      console.error("Failed to call API:", apiError);
    }

    // Build external URL using the valid session data.
    const externalUrl = `${EXTERNAL_ONBOARDING_URL}/?shop=${encodeURIComponent(session.shop)}&accessToken=${encodeURIComponent(session.accessToken)}`;
    return redirect(externalUrl, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    });
  }

  // Fallback error response.
  return new Response("Unexpected error in auth callback", { status: 500 });
}
