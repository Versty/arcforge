import { rarityColors } from './rarityConfig';

export const cytoscapeStyles = [
  {
    selector: 'node',
    style: {
      'shape': 'roundrectangle',
      'background-fill': 'linear-gradient',
      'background-gradient-direction': 'to-right',
      'background-gradient-stop-colors': ((ele: any) => {
        const rarity = ele.data('rarity');
        const gradientColors: { [key: string]: string[] } = {
          Common: ['rgba(153,159,165,0.25)', 'rgba(5,13,36,1)'],
          Uncommon: ['rgba(86,203,134,0.25)', 'rgba(5,13,36,1)'],
          Rare: ['rgba(30,150,252,0.3)', 'rgba(5,13,36,1)'],
          Epic: ['rgba(216,41,155,0.25)', 'rgba(5,13,36,1)'],
          Legendary: ['rgba(251,199,0,0.25)', 'rgba(5,13,36,1)'],
        };
        return gradientColors[rarity] || gradientColors.Common;
      }) as any,
      'background-gradient-stop-positions': [0, 100] as any,
      'background-image': (ele: any) => ele.data('imageUrl') || '',
      'background-fit': 'contain',
      'background-clip': 'none',
      'background-position-x': '50%',
      'background-position-y': '50%',
      'padding': '12px',
      'label': 'data(label)',
      'color': '#e9d5ff',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 8,
      'font-size': '11px',
      'font-weight': 'bold',
      'width': 100,
      'height': 100,
      'border-width': 3,
      'border-color': (ele: any) => {
        const rarity = ele.data('rarity');
        return rarityColors[rarity] || '#717471';
      },
      'text-wrap': 'wrap',
      'text-max-width': 90 as any,
      'text-background-color': '#07020b',
      'text-background-opacity': 0.85,
      'text-background-padding': 3 as any,
    }
  },
  {
    selector: 'node[type="center"]',
    style: {
      'border-width': 5,
      'width': 140,
      'height': 140,
      'font-size': '14px',
      'font-weight': 'bold',
      'text-margin-y': 10,
    }
  },
  {
    selector: 'node[type="input"]',
    style: {
      'border-width': 3,
    }
  },
  {
    selector: 'node[type="output"]',
    style: {
      'border-width': 3,
    }
  },
  {
    selector: 'node[nodeType="trader"]',
    style: {
      'shape': 'ellipse',
      'border-color': '#fbbf24',
      'width': 120,
      'height': 120,
      'background-gradient-stop-colors': ['rgba(251,191,36,0.2)', 'rgba(5,13,36,1)'] as any,
    }
  },
  {
    selector: 'node[nodeType="trader"][type="center"]',
    style: {
      'width': 160,
      'height': 160,
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 3,
      'line-color': '#6366f1',
      'target-arrow-shape': 'none',
      'curve-style': 'unbundled-bezier',
      'control-point-distances': (ele: any) => {
        const curvature = ele.data('curvature') || 0;
        const dist = Math.abs(curvature) * 0.35;
        return curvature >= 0 ? `${dist} -${dist}` : `-${dist} ${dist}`;
      },
      'control-point-weights': '0.33 0.67',
      'edge-distances': 'node-position',
      'source-endpoint': '90deg',
      'target-endpoint': '270deg',
      'label': 'data(label)',
      'font-size': '9px',
      'line-height': 1.6,
      'color': '#c4b5fd',
      'text-outline-color': '#07020b',
      'text-outline-width': 5,
      'text-outline-opacity': 1,
      'text-background-color': '#07020b',
      'text-background-opacity': 1,
      'text-background-padding': 6 as any,
      'text-background-shape': 'roundrectangle' as any,
      'text-border-width': 1 as any,
      'text-border-color': '#6366f1',
      'text-border-opacity': 0.4,
      'text-margin-y': -12,
      'text-wrap': 'wrap',
      'text-max-width': 140 as any,
    }
  },
  // Edge coloring by relation type
  {
    selector: 'edge[relation*="repair"]',
    style: {
      'line-color': '#ef4444',
    }
  },
  {
    selector: 'edge[relation*="upgrade"]',
    style: {
      'line-color': '#ec4899',
    }
  },
  {
    selector: 'edge[relation*="salvage"]',
    style: {
      'line-color': '#10b981',
    }
  },
  {
    selector: 'edge[relation*="recycle"]',
    style: {
      'line-color': '#34d399',
    }
  },
  {
    selector: 'edge[relation*="craft"]',
    style: {
      'line-color': '#60a5fa',
    }
  },
  {
    selector: 'edge[relation*="trader"], edge[relation*="sold_by"]',
    style: {
      'line-color': '#fbbf24',
    }
  },
  {
    selector: ':selected',
    style: {
      'border-width': 6,
      'border-color': '#e879f9',
      'overlay-opacity': 0.3,
      'overlay-color': '#c084fc',
    }
  }
];

