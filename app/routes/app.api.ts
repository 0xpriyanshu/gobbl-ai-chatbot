// app/routes/app.api.ts
import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }
  
  // Return basic shop info (safe to expose)
  return json({ 
    shopDomain: shop
  });
}

export async function action({ request }: ActionFunctionArgs) {
  // Authenticate the request
  const { session } = await authenticate.admin(request);
  const { shop, accessToken } = session;
  
  // Get request data
  const data = await request.json();
  
  // Verify the request is for the authenticated shop
  if (data.shop !== shop) {
    return json({ error: "Shop mismatch" }, { status: 403 });
  }
  
  // Example: Make an authenticated API call based on the action
  if (data.action === "getCustomerInfo") {
    const customerId = data.customerId;
    
    const response = await fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    const customer = await response.json();
    return json({ success: true, customer: customer.customer });
  }
  
  return json({ error: "Unknown action" }, { status: 400 });
}