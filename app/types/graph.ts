export interface Edge {
  name: string;
  direction: 'in' | 'out';
  relation: string;
  quantity?: number;
  dependency?: Array<{ type: string; [key: string]: unknown }>;
  input_level?: string;
  output_level?: string;
}

export interface ItemData {
  name: string;
  node_type: 'item' | 'trader';
  wiki_url: string;
  infobox?: {
    image: string;
    rarity?: string;
    type?: string;
    [key: string]: unknown;
  };
  image_urls?: {
    thumb?: string;
    original?: string;
    file_page?: string;
  };
  edges: Edge[];
}

export interface NodeInfo {
  id: string;
  label: string;
  type: string;
  rarity?: string;
}

