// app/routes/webhooks.ts
import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import crypto from "crypto";

/**
 * Verify Shopify webhook HMAC signature
 */
async function verifyShopifyWebhook(request: Request, shopifySecret: string) {
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  
  if (!hmacHeader) {
    return false;
  }

  const rawBody = await request.text();
  const calculatedHmac = crypto
    .createHmac("sha256", shopifySecret)
    .update(rawBody, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(hmacHeader),
    Buffer.from(calculatedHmac)
  );
}

/**
 * Handle customer data request webhook
 */
async function handleCustomerDataRequest(payload: any) {
  console.log("Received customer data request", payload);
  
  // TODO: Collect all customer data from your database based on IDs provided in payload
  // This should include:
  // - Customer data (from payload.customer.id)
  // - Order data (from payload.orders_requested)
  
  // Example: Fetch data from your database
  /*
  const customerData = await db.customers.findUnique({
    where: { id: String(payload.customer.id) },
    include: { orders: true, preferences: true },
  });
  
  // Send this data to the store owner via email or other secure method
  await sendDataToStoreOwner(payload.shop_domain, customerData);
  */

  // For now, just log the request
  return true;
}

/**
 * Handle customer data redaction (deletion) webhook
 */
async function handleCustomerRedact(payload: any) {
  console.log("Received customer redaction request", payload);
  
  // TODO: Delete or anonymize customer data based on the IDs provided
  // - Delete customer records (from payload.customer.id)
  // - Delete order records (from payload.orders_to_redact)
  
  // Example: Delete data from your database
  /*
  // Delete customer data
  await db.customers.delete({
    where: { id: String(payload.customer.id) },
  });
  
  // Delete order data
  if (payload.orders_to_redact && payload.orders_to_redact.length > 0) {
    await db.orders.deleteMany({
      where: { id: { in: payload.orders_to_redact.map(String) } },
    });
  }
  */

  // For now, just log the request
  return true;
}

/**
 * Handle shop data redaction (deletion) webhook
 */
async function handleShopRedact(payload: any) {
  console.log("Received shop redaction request", payload);
  
  // TODO: Delete all data associated with this shop
  // This should remove all data related to this store from your database
  
  // Example: Delete shop-related data from your database
  /*
  // Delete all customer data for this shop
  await db.customers.deleteMany({
    where: { shopId: String(payload.shop_id) },
  });
  
  // Delete all order data for this shop
  await db.orders.deleteMany({
    where: { shopId: String(payload.shop_id) },
  });
  
  // Delete shop configuration
  await db.shopConfig.delete({
    where: { shopId: String(payload.shop_id) },
  });
  */

  // For now, just log the request
  return true;
}

export async function action({ request }: ActionFunctionArgs) {
  // Get the webhook topic from headers
  const topic = request.headers.get("X-Shopify-Topic");
  
  // If it's not a compliance webhook, authenticate normally
  if (
    topic !== "customers/data_request" &&
    topic !== "customers/redact" &&
    topic !== "shop/redact"
  ) {
    // Handle other webhooks with your existing authentication
    return json({ message: "Not a compliance webhook" }, { status: 400 });
  }
  
  // For compliance webhooks, we need to verify the HMAC
  // Get your SHOPIFY_API_SECRET from environment variables
  const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";
  const isValid = await verifyShopifyWebhook(request.clone(), SHOPIFY_API_SECRET);
  
  if (!isValid) {
    console.error("Invalid webhook signature");
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Parse the webhook payload
  const rawBody = await request.text();
  const payload = JSON.parse(rawBody);
  
  // Handle the specific compliance webhook
  try {
    switch (topic) {
      case "customers/data_request":
        await handleCustomerDataRequest(payload);
        break;
      case "customers/redact":
        await handleCustomerRedact(payload);
        break;
      case "shop/redact":
        await handleShopRedact(payload);
        break;
      default:
        return json({ error: "Unknown webhook topic" }, { status: 400 });
    }
    
    // Return a success response
    return json({ success: true });
  } catch (error) {
    console.error(`Error handling ${topic} webhook:`, error);
    
    // Still return a 200 response to acknowledge receipt of the webhook
    // We need to acknowledge even if we have an internal error
    return json({ success: false, message: "Error processing webhook, but request received" });
  }
}

// A loader isn't needed for webhooks, but we can provide a fallback for GET requests
export async function loader() {
  return json({ message: "Webhook endpoint" });
}