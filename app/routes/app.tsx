import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // This returns the authenticated session
  const { session } = await authenticate.admin(request);

  console.log("Session>", session)
  
  // Extract shop domain and access token
  const shopDomain = session.shop;
  const accessToken = session.accessToken;
  
  console.log("Shop Domain:", shopDomain);
  console.log("Access Token:", accessToken);
  
  // Return this data to be used in your component
  return json({ 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopDomain: shopDomain,
    // Note: We don't send the access token to the frontend for security reasons
  });
};

export default function App() {
  const { apiKey, shopDomain } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <div style={{ padding: "1rem" }}>
        <p>Connected to shop: {shopDomain}</p>
      </div>
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
