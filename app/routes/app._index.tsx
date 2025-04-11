import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page, Card, Text, BlockStack, Layout } from "@shopify/polaris";
import { useEffect } from "react";

// External onboarding URL
const EXTERNAL_ONBOARDING_URL = "https://onboarding.gobbl.ai/onboarding";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Starting app._index.tsx loader function");
  
  // Authenticate the Shopify admin request.
  const authResult = await authenticate.admin(request);
  if (authResult instanceof Response) {
    console.log("Authentication returned a Response, returning it");
    return authResult;
  }
  
  const { session } = authResult;
  console.log("session for shop:", session);
  console.log("App index - authenticated session for shop:", session.shop);
  console.log("Access token in app._index:", session.accessToken ? 
    `${session.accessToken.substring(0, 5)}...${session.accessToken.substring(session.accessToken.length - 5)}` : 
    "not available");
  
  // Store the access token in metafields using direct API call
  try {
    console.log("STEP 1: Attempting to store access token in metafields...");
    
    const shopDomain = session.shop;
    const apiVersion = '2025-04'; // Use current API version
    
    // First attempt to create the metafield
    console.log("Creating metafield with access token...");
    const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/metafields.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken
      },
      body: JSON.stringify({
        metafield: {
          namespace: "gobbl",
          key: "access_token",
          value: session.accessToken,
          type: "single_line_text_field",
          owner_resource: "shop"
        }
      })
    });
    
    const result = await response.json();
    console.log("Metafield creation response:", JSON.stringify(result, null, 2));
    
    // If successful, make it visible to the storefront
    if (result.metafield && result.metafield.id) {
      console.log("STEP 2: Making metafield visible to storefront...");
      const visibilityResponse = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/metafields/${result.metafield.id}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': session.accessToken
        },
        body: JSON.stringify({
          metafield: {
            id: result.metafield.id,
            storefront_visible: true
          }
        })
      });
      
      const visibilityResult = await visibilityResponse.json();
      console.log("Metafield visibility update response:", JSON.stringify(visibilityResult, null, 2));
      console.log("STEP 3: Access token should now be available to the storefront");
    } else {
      console.log("Failed to create metafield, result:", result);
    }
    
    // Try to verify the metafield was created
    console.log("STEP 4: Verifying metafield was created...");
    const verifyResponse = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/metafields.json?namespace=gobbl&key=access_token`, {
      headers: {
        'X-Shopify-Access-Token': session.accessToken
      }
    });
    
    const verifyResult = await verifyResponse.json();
    console.log("Verification result:", JSON.stringify(verifyResult, null, 2));
    
  } catch (error) {
    console.error("Failed to store access token in metafields:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
  }
  
  // Call your createStore API to register the store.
  try {
    console.log("STEP 5: Calling createStore API from app._index");
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
    
    if (createStoreResponse.ok) {
      const responseData = await createStoreResponse.json();
      console.log("createStore API response:", JSON.stringify(responseData, null, 2));
    } else {
      console.log("createStore API error:", await createStoreResponse.text());
    }
  } catch (error) {
    console.error("Failed to call API from app._index:", error);
  }
  
  // Build the external URL including shop and accessToken.
  const externalUrl = `${EXTERNAL_ONBOARDING_URL}/?shop=${encodeURIComponent(session.shop)}&accessToken=${encodeURIComponent(session.accessToken)}`;
  console.log("STEP 6: Built redirect URL (with masked token):", externalUrl.replace(session.accessToken, "***MASKED***"));
  
  // Return session data and the redirect URL.
  console.log("STEP 7: Returning JSON response from loader");
  return json({
    shop: session.shop,
    accessToken: session.accessToken,
    redirectUrl: externalUrl,
  });
}

export default function AppIndex() {
  const { redirectUrl } = useLoaderData<typeof loader>();
  console.log("AppIndex component rendered, preparing to redirect");

  // Automatically redirect using window.location.href.
  useEffect(() => {
    console.log("Redirecting to external URL...");
    window.location.href = redirectUrl;
  }, [redirectUrl]);

  return null;
}