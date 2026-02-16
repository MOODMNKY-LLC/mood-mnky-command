export const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    title
    handle
    featuredImage {
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 1) {
      nodes {
        id
      }
    }
  }
`;

export const PRODUCT_PAGE_FRAGMENT = `
  fragment ProductPage on Product {
    id
    title
    handle
    description
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 10) {
      nodes {
        url
        altText
        width
        height
      }
    }
    options {
      name
      values
    }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        image {
          url
          altText
          width
          height
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
`;

export const PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "status:active") {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ...ProductCard
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_PAGE_FRAGMENT}
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      ...ProductPage
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first, query: "status:active") {
      edges {
        node {
          id
          title
          handle
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionByHandle($handle: String!, $first: Int!, $after: String) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      description
      image {
        url
        altText
        width
        height
      }
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ...ProductCard
          }
        }
      }
    }
  }
`;

export const FEATURED_PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query FeaturedProducts($first: Int!) {
    products(first: $first, query: "status:active", sortKey: BEST_SELLING) {
      edges {
        node {
          ...ProductCard
        }
      }
    }
  }
`;
