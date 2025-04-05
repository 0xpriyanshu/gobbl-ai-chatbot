// app/_index.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page, Card, Text, BlockStack, Layout } from "@shopify/polaris";
import { useEffect } from "react";

// External onboarding URL (ngrok)
const EXTERNAL_ONBOARDING_URL = "https://5a24-223-181-35-118.ngrok-free.app";

export async function loader({ request }: LoaderFunctionArgs) {
  // Authenticate the Shopify admin request.
  const authResult = await authenticate.admin(request);
  if (authResult instanceof Response) {
    return authResult;
  }
  const { session } = authResult;
  console.log("App index - authenticated session for shop:", session.shop);
  console.log("Access token in app._index:", session.accessToken);
  
  // Optionally, call your createStore API to register the store.
  try {
    console.log("Calling createStore API from app._index");
    const createStoreResponse = await fetch("https://aggregator.gobbl.ai/api/shopify/createStore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: session.accessToken,
        storeUrl: session.shop,
        products: [],
      }),
    });
    console.log("API response status from app._index:", createStoreResponse.status);
  } catch (error) {
    console.error("Failed to call API from app._index:", error);
  }
  
  // Build the external URL including shop and accessToken.
  const externalUrl = `${EXTERNAL_ONBOARDING_URL}/?shop=${encodeURIComponent(session.shop)}&accessToken=${encodeURIComponent(session.accessToken)}`;
  
  // Return session data and the redirect URL.
  return json({
    shop: session.shop,
    accessToken: session.accessToken,
    redirectUrl: externalUrl,
  });
}

export default function AppIndex() {
  const { redirectUrl } = useLoaderData<typeof loader>();

  // Automatically redirect using window.location.href.
  useEffect(() => {
    window.location.href = redirectUrl;
  }, [redirectUrl]);

  return null;
}
