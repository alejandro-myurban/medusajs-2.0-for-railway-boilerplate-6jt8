import React, { Suspense } from "react"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import { ColorContextProvider } from "../../../lib/context/color-content-provider"
import ClientImageGallery from "../../products/components/image-gallery/client-image-gallery"
import Spinner from "@modules/common/icons/spinner"
import { ProductReviewsSummary } from "@modules/product-reviews/components/ProductReviewSummary"
import BoughtTogether from "../components/bought-together"
import { CombinedCartProvider } from "../components/bought-together/bt-context"
import CustomNameNumberForm from "../components/custom-name-number"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../src/components/ui/breadcrumb"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  searchParams?: { [key: string]: string | string[] | undefined }
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  searchParams,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // Función para construir la jerarquía de categorías
  const buildCategoryHierarchy = (product: HttpTypes.StoreProduct) => {
    const categories: any[] = []

    if (!product.categories || product.categories.length === 0) {
      return categories
    }

    // Encontrar la categoría más específica (la que no tiene hijos en la lista de categorías del producto)
    // o la de nivel más profundo
    let mostSpecificCategory = product.categories[0]

    // Si hay múltiples categorías, buscar la más específica
    if (product.categories.length > 1) {
      // Ordenar por profundidad (asumiendo que las categorías más específicas tienen más ancestros)
      const categoriesWithDepth = product.categories.map((cat) => {
        let depth = 0
        let current = cat
        while (current.parent_category) {
          depth++
          current = current.parent_category
        }
        return { category: cat, depth }
      })

      // Tomar la categoría con mayor profundidad
      mostSpecificCategory = categoriesWithDepth.sort(
        (a, b) => b.depth - a.depth
      )[0].category
    }

    // Función recursiva para obtener todos los padres
    const getParents = (cat: any) => {
      if (cat.parent_category) {
        getParents(cat.parent_category)
      }
      categories.push(cat)
    }

    getParents(mostSpecificCategory)
    return categories
  }

  const categoryHierarchy = buildCategoryHierarchy(product)

  // Get color or base option from product
  const variantOption = product.options?.find(
    (opt) =>
      opt.title === "Color" ||
      opt.title === "Base" ||
      opt.title === "Pedana" ||
      opt.title === "Deck"
  )
  const optionValues = variantOption?.values || []

  // Get the translated title if available
  const optionTitle =
    //@ts-ignore
    variantOption?.translations?.title || variantOption?.title || ""

  // Validate option value from parameters
  const selectedParam = searchParams?.option?.toString() || ""
  const isValidOption = optionValues.some((v) => v.value === selectedParam)

  // Set initial option value
  const initialValue = isValidOption
    ? selectedParam
    : optionValues[0]?.value || ""

  try {
    return (
      <Suspense
        fallback={
          <div>
            <Spinner />
          </div>
        }
      >
        <ColorContextProvider
          initialColor={initialValue}
          optionTitle={optionTitle}
        >
          <div className="content-container flex flex-col py-6">
            {/* Breadcrumbs */}
            <div className="mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  {/* Home link */}
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <LocalizedClientLink href="/">Inicio</LocalizedClientLink>
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  {/* Categorías */}
                  {categoryHierarchy.map((category, index) => (
                    <React.Fragment key={category.id}>
                      <BreadcrumbSeparator className="flex-none text-black [&>svg]:w-4 [&>svg]:h-4" />
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <LocalizedClientLink
                            href={`/categories/${category.handle}`}
                            className="hover:text-black"
                          >
                            {category.name}
                          </LocalizedClientLink>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}

                  {/* Producto actual */}
                  <BreadcrumbSeparator className="flex-none text-black [&>svg]:w-4 [&>svg]:h-4" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold">
                      {product.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Contenido del producto */}
            <div
              className="flex flex-col small:flex-row small:items-start relative"
              data-testid="product-container"
            >
              <div className="block w-full lg:w-1/2 relative">
                <ClientImageGallery images={product.images || []} />
              </div>
              <div className="flex flex-col small:sticky small:top-48 small:py-0  lg:w-1/2 w-full py-8 gap-y-12">
                <ProductOnboardingCta />
                <CombinedCartProvider>
                  <Suspense
                    fallback={
                      <ProductActions
                        disabled={true}
                        product={product}
                        region={region}
                      />
                    }
                  >
                    <div className="flex flex-col small:top-48 small:py-0  w-full py-8 gap-y-6">
                      <ProductInfo product={product} />
                      {/* <ProductTabs product={product} /> */}
                    </div>

                    <ProductActionsWrapper
                      id={product.id}
                      region={region}
                      countryCode={countryCode}
                    />
                    <BoughtTogether product={product} region={region} />
                  </Suspense>
                </CombinedCartProvider>
              </div>
            </div>
          </div>
          <div
            className="content-container my-16 small:my-32"
            data-testid="related-products-container"
          >
            <ProductReviewsSummary
              productId={product.id}
              productHandle={product.handle}
            />
            <Suspense fallback={<SkeletonRelatedProducts />}>
              <RelatedProducts product={product} countryCode={countryCode} />
            </Suspense>
          </div>
        </ColorContextProvider>
      </Suspense>
    )
  } catch (error) {
    console.error("Error rendering ProductTemplate:", error)
    return <div>Error loading product. Please try again.</div>
  }
}

export default ProductTemplate
