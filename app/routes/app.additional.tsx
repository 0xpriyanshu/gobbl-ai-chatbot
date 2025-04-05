// app/additional.tsx
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
} from "@shopify/polaris";
// Removed TitleBar import since it’s an App Bridge component
// import { TitleBar } from "@shopify/app-bridge-react";

export default function AdditionalPage() {
  return (
    <Page title="Additional page">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                The app template comes with an additional page which demonstrates
                how to create multiple pages within app navigation.
              </Text>
              <Text as="p" variant="bodyMd">
                To create your own page and have it show up in the app navigation,
                add a page inside <Code>app/routes</Code>, and add a link to it in your
                custom navigation.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Resources
              </Text>
              <List>
                <List.Item>
                  <Link
                    url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
                    target="_blank"
                    removeUnderline
                  >
                    App nav best practices
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}
