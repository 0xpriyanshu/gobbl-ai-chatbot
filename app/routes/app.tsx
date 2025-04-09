// app.tsx
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { useEffect } from "react";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Authenticate the Shopify admin request
  const authResult = await authenticate.admin(request);
  if (authResult instanceof Response) {
    return authResult;
  }
  const { session } = authResult;
  console.log("Session>", session);
  
  // Extract shop domain and access token
  const shopDomain = session.shop;
  const accessToken = session.accessToken;
  console.log("Shop Domain:", shopDomain);
  console.log("Access Token:", accessToken);
  
  // Return these values for use in your component
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopDomain,
    accessToken,
  });
};

export default function App() {
  const { apiKey, shopDomain, accessToken } = useLoaderData<typeof loader>();
  const location = useLocation();

  // Build the external URL using your ngrok URL, including shop and accessToken.
  const externalUrl = `https://onboarding.gobbl.ai/onboarding/?shop=${encodeURIComponent(
    shopDomain
  )}&accessToken=${encodeURIComponent(accessToken)}`;

  useEffect(() => {
    // When the pathname is exactly "/app", automatically redirect
    if (location.pathname === "/app") {
      window.location.href = externalUrl;
    }
  }, [location.pathname, externalUrl]);

  // When on the "/app" route, render nothing so the user doesn't see any UI.
  if (location.pathname === "/app") {
    return null;
  }

  // For any other route (if any), render the normal layout.
  return (
    <AppProvider isEmbeddedApp={false} apiKey={apiKey}>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
