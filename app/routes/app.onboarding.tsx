import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Text,
  Banner,
  BlockStack,
  Checkbox,
  ChoiceList
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { saveOnboardingData, getOnboardingData } from "../models/onboarding.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const data = await getOnboardingData(session.shop);
  
  return json({
    shop: session.shop,
    existingData: data || {}
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  // Get selected product categories
  const selectedProducts = formData.getAll("productCategories") as string[];
  
  // Get other form data
  const businessName = formData.get("businessName") as string;
  const contactEmail = formData.get("contactEmail") as string;
  const industry = formData.get("industry") as string;
  const acceptedTerms = formData.get("acceptTerms") === "on";
  
  // Save onboarding data to your local database
  await saveOnboardingData(session.shop, {
    businessName,
    contactEmail,
    industry,
    acceptedTerms
  });
  
  // Send data to your external API
  try {
    const response = await fetch("https://aggregator.gobbl.ai/api/shopify/createStore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accessToken: session.accessToken,
        storeUrl: session.shop,
        products: selectedProducts
      })
    });
    
    if (!response.ok) {
      console.error("Failed to send data to external API", await response.text());
    }
  } catch (error) {
    console.error("Error sending data to external API:", error);
  }
  
  return redirect("/app");
}

export default function Onboarding() {
  const { shop, existingData } = useLoaderData<typeof loader>();
  const [selected, setSelected] = useState<string[]>([]);
  
  return (
    <Page title="Complete Your Setup - Gobbl AI Chatbot">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Banner
              title="Welcome to Gobbl AI Chatbot!"
              status="info"
            >
              <p>Please provide some information about your business and select the product categories you offer.</p>
            </Banner>
          </Layout.Section>
          
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Your Information</Text>
                <Text>Connected store: {shop}</Text>
                
                <Form method="post">
                  <FormLayout>
                    <TextField
                      label="Business Name"
                      name="businessName"
                      autoComplete="off"
                      defaultValue={existingData.businessName || ""}
                      requiredIndicator
                    />
                    
                    <TextField
                      label="Contact Email"
                      name="contactEmail"
                      type="email"
                      autoComplete="email"
                      defaultValue={existingData.contactEmail || ""}
                      requiredIndicator
                    />
                    
                    <TextField
                      label="Industry"
                      name="industry"
                      autoComplete="off"
                      defaultValue={existingData.industry || ""}
                      requiredIndicator
                    />
                    
                    <ChoiceList
                      title="Product Categories (select all that apply)"
                      allowMultiple
                      choices={[
                        {label: 'Clothing', value: 'clothing'},
                        {label: 'Accessories', value: 'accessories'},
                        {label: 'Home Decor', value: 'home_decor'},
                        {label: 'Electronics', value: 'electronics'},
                        {label: 'Beauty & Health', value: 'beauty_health'},
                        {label: 'Food & Beverage', value: 'food_beverage'},
                        {label: 'Sports & Outdoors', value: 'sports_outdoors'},
                        {label: 'Books & Media', value: 'books_media'},
                        {label: 'Toys & Games', value: 'toys_games'},
                        {label: 'Art & Collectibles', value: 'art_collectibles'}
                      ]}
                      selected={selected}
                      onChange={(selected) => setSelected(selected)}
                      name="productCategories"
                    />
                    
                    <Checkbox
                      label="I accept the terms of service and privacy policy"
                      name="acceptTerms"
                      checked={existingData.acceptedTerms || false}
                      required
                    />
                    
                    <Button submit primary>Complete Setup and Configure Chatbot</Button>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}