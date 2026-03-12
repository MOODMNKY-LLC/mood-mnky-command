import { ProductBuilder } from "@/components/products/product-builder"

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Product Builder
        </h1>
        <p className="text-sm text-muted-foreground">
          Assemble a product from your fragrance oils and formulas, then push it
          to Shopify
        </p>
      </div>

      <ProductBuilder />
    </div>
  )
}
