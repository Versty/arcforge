export interface Item {
  name: string;
  wiki_url: string;
  infobox: {
    image: string;
    rarity: string;
    quote?: string;
    type?: string;
    special_types?: string[];
    location?: string;
    weight?: number;
    sellprice?: number | number[];
    stacksize?: number;
    damage?: number;
    [key: string]: unknown;
  };
  image_urls: {
    thumb?: string;
    original?: string;
    file_page?: string;
  };
  sources?: string[];
  [key: string]: unknown;
}

