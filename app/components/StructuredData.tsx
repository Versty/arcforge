import Script from 'next/script';

type StructuredDataType = 'WebSite' | 'ItemList' | 'WebPage';

interface BaseStructuredData {
  name?: string;
  description?: string;
  url: string;
}

interface WebSiteData extends BaseStructuredData {
  name?: string;
}

interface ItemListItem {
  name: string;
  description?: string;
  image?: string;
  url: string;
}

interface ItemListData {
  name: string;
  description?: string;
  numberOfItems: number;
  items?: ItemListItem[];
}

type StructuredDataInput = WebSiteData | ItemListData | BaseStructuredData;

interface StructuredDataProps {
  type: StructuredDataType;
  data: StructuredDataInput;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  let structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'WebSite': {
      const siteData = data as WebSiteData;
      structuredData = {
        ...structuredData,
        '@type': 'WebSite',
        name: siteData.name || 'ARC Forge',
        description: siteData.description,
        url: siteData.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteData.url}?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      };
      break;
    }

    case 'ItemList': {
      const listData = data as ItemListData;
      structuredData = {
        ...structuredData,
        '@type': 'ItemList',
        name: listData.name,
        description: listData.description,
        numberOfItems: listData.numberOfItems,
        itemListElement: listData.items?.map((item, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: item.name,
            description: item.description,
            image: item.image,
            url: item.url,
          },
        })),
      };
      break;
    }

    case 'WebPage': {
      const pageData = data as BaseStructuredData;
      structuredData = {
        ...structuredData,
        '@type': 'WebPage',
        name: pageData.name,
        description: pageData.description,
        url: pageData.url,
      };
      break;
    }
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      strategy="beforeInteractive"
    />
  );
}

