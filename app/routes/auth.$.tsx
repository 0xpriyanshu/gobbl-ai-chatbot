import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  console.log("Auth route accessed:", url.pathname);
  
  try {
    // Let Shopify's authenticate method handle everything
    return await authenticate.admin(request);
  } catch (error) {
    console.error("Auth error:", error);
    
    // If the error is a Response, return it
    if (error instanceof Response) {
      return error;
    }
    
    throw error;
  }
}