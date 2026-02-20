import Link from "next/link";
import { headers } from "next/headers";
import { storefrontFetch } from "@/lib/shopify/storefront-client";
import {
  FEATURED_PRODUCTS_QUERY,
  COLLECTIONS_QUERY,
} from "@/lib/shopify/storefront-queries";
import { VerseProductCard } from "@/components/verse/product-card";
import { VerseBrandBand } from "@/components/verse/verse-brand-band";
import { VerseHeroErrorBoundary } from "@/components/verse/verse-error-boundary";
import { VerseHeroDynamic } from "@/components/verse/verse-hero-dynamic";
import { PortalWelcome } from "@/components/verse/portal-welcome";
import { PortalPillarCards } from "@/components/verse/portal-pillar-cards";
import { PortalQuickActions } from "@/components/verse/portal-quick-actions";
import { PortalPillars } from "@/components/verse/portal-pillars";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

export default async function VerseHomePage() {
  const h = await headers();
  let featuredProducts: { products?: { edges: Array<{ node: unknown }> } } = {};
  let collections: {
    collections?: {
      edges: Array<{
        node: {
          title: string;
          handle: string;
          image?: { url: string; altText?: string } | null;
        };
      }>;
    };
  } = {};

  try {
    [featuredProducts, collections] = await Promise.all([
      storefrontFetch<typeof featuredProducts>(FEATURED_PRODUCTS_QUERY, {
        first: 8,
      }, { headers: h }),
      storefrontFetch<typeof collections>(COLLECTIONS_QUERY, { first: 6 }, { headers: h }),
    ]);
  } catch (e) {
    console.error("Verse home fetch error:", e);
  }

  const products =
    featuredProducts?.products?.edges?.map((e) => e.node) ?? [];
  const collectionsList =
    collections?.collections?.edges?.map((e) => e.node) ?? [];

  return (
    <>
      <VerseBrandBand />
      <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-10 px-4 pb-8 md:px-6 md:pb-10">
        <VerseHeroErrorBoundary>
          <VerseHeroDynamic />
        </VerseHeroErrorBoundary>

      {/* MNKY PORTAL: welcome, then cards in order Dojo → Agent Chat → MNKY Shop → Fragrance Wheel → Blending Guide → Profile */}
      <section className="space-y-6">
        <div>
          <h2 className="font-verse-heading mb-2 text-2xl font-semibold text-verse-text">
            MNKY PORTAL
          </h2>
          <PortalWelcome />
        </div>
        <PortalPillarCards />
        <PortalQuickActions />
      </section>

      {/* Brand Pillars */}
      <PortalPillars />

      {/* Featured Products */}
      <BlurFade delay={0.1} inView inViewMargin="-20px">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-verse-heading text-xl font-semibold text-verse-text">
              Featured Products
            </h2>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-verse-text"
            >
              <Link href="/verse/products">View all</Link>
            </Button>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product: { id: string; handle: string }) => (
                <VerseProductCard
                  key={product.id}
                  product={
                    product as Parameters<
                      typeof VerseProductCard
                    >[0]["product"]
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-verse-text/20 p-8 text-center text-verse-text-muted">
              No products yet. Configure Storefront API tokens and publish
              products to the Headless channel.
            </div>
          )}
        </section>
      </BlurFade>

      {/* Collections */}
      {collectionsList.length > 0 && (
        <BlurFade delay={0.15} inView inViewMargin="-20px">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-verse-heading text-xl font-semibold text-verse-text">
                Collections
              </h2>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-verse-text"
              >
                <Link href="/verse/collections">View all</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {collectionsList.map((col) => (
                <Link key={col.handle} href={`/verse/collections/${col.handle}`}>
                  <Card className="overflow-hidden glass-panel transition-opacity hover:opacity-95">
                    <div className="relative aspect-square w-full overflow-hidden bg-verse-text/5">
                      {col.image?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={col.image.url}
                          alt={col.image.altText || col.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-verse-text-muted">
                          No image
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-3">
                      <h3 className="line-clamp-2 text-sm font-medium text-verse-text">
                        {col.title}
                      </h3>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </BlurFade>
      )}
      </div>
    </>
  );
}
