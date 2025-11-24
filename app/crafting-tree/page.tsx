'use client';

import { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import Image from 'next/image';
import cytoscape from 'cytoscape';
import { useSearchParams } from 'next/navigation';
import itemsRelationData from '../../data/items_relation.json';

interface Edge {
  name: string;
  direction: 'in' | 'out';
  relation: string;
  quantity?: number;
  dependency?: Array<{ type: string; name: string }>;
  input_level?: string;
  output_level?: string;
}

interface ItemData {
  name: string;
  wiki_url: string;
  infobox: {
    image: string;
    rarity?: string;
    type?: string;
    [key: string]: any;
  };
  image_urls: {
    thumb?: string;
    original?: string;
    file_page?: string;
  };
  edges: Edge[];
}

interface NodeInfo {
  id: string;
  label: string;
  type: string;
  rarity?: string;
}

const rarityColors: { [key: string]: string } = {
  Common: '#717471',
  Uncommon: '#41EB6A',
  Rare: '#1ECBFC',
  Epic: '#d8299b',
  Legendary: '#fbc700',
};

const rarityGradients: { [key: string]: string } = {
  Common: 'linear-gradient(to right, rgb(153 159 165 / 25%) 0%, rgb(5 13 36) 100%)',
  Uncommon: 'linear-gradient(to right, rgb(86 203 134 / 25%) 0%, rgb(5 13 36) 100%)',
  Rare: 'linear-gradient(to right, rgb(30 150 252 / 30%) 0%, rgb(5 13 36) 100%)',
  Epic: 'linear-gradient(to right, rgb(216 41 155 / 25%) 0%, rgb(5 13 36) 100%)',
  Legendary: 'linear-gradient(to right, rgb(251 199 0 / 25%) 0%, rgb(5 13 36) 100%)',
};

function CraftingTreeContent() {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);
  const [isReady, setIsReady] = useState(false);
  const searchParams = useSearchParams();
  
  const itemName = searchParams.get('item') || 'Heavy Gun Parts';

  // Find the selected item and build item lookup
  const { selectedItem, itemsLookup } = useMemo(() => {
    const lookup = new Map<string, ItemData>();
    (itemsRelationData as ItemData[]).forEach(item => {
      lookup.set(item.name, item);
    });
    const selected = lookup.get(itemName);
    return { selectedItem: selected, itemsLookup: lookup };
  }, [itemName]);

  // Ensure DOM is ready
  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) {
      return;
    }

    // Get current item data
    const currentItem = itemsLookup.get(itemName);
    if (!currentItem) {
      return;
    }

    // Build graph elements from actual data
    const elements: any[] = [];
    const CURVATURE = 90;
    
    // Center node - Selected item
    const centerId = `center-${currentItem.name}`;
    const centerImageUrl = currentItem.image_urls?.thumb 
      ? `/api/proxy-image?url=${encodeURIComponent(currentItem.image_urls.thumb)}`
      : '';
    elements.push({
      data: {
        id: centerId,
        label: currentItem.name,
        type: 'center',
        rarity: currentItem.infobox?.rarity,
        imageUrl: centerImageUrl,
      }
    });

    // Helper function to clean relation names
    const cleanRelationName = (relation: string): string => {
      return relation.replace(/_from$|_to$/g, '');
    };

    // Helper function to format edge label with level and quantity
    const formatEdgeLabel = (edge: Edge): string => {
      const relation = cleanRelationName(edge.relation);
      const quantity = edge.quantity ? `${edge.quantity}x` : '';
      const levelInfo = edge.input_level || edge.output_level || '';
      
      if (levelInfo && quantity) {
        return `${relation} (${quantity}) [${levelInfo}]`;
      } else if (levelInfo) {
        return `${relation} [${levelInfo}]`;
      } else if (quantity) {
        return `${relation} (${quantity})`;
      } else {
        return relation;
      }
    };

    // Group edges by item name and direction
    const leftGrouped = new Map<string, Edge[]>();
    const rightGrouped = new Map<string, Edge[]>();
    
    currentItem.edges.forEach(edge => {
      if (edge.direction === 'in') {
        if (!leftGrouped.has(edge.name)) {
          leftGrouped.set(edge.name, []);
        }
        leftGrouped.get(edge.name)!.push(edge);
      } else {
        if (!rightGrouped.has(edge.name)) {
          rightGrouped.set(edge.name, []);
        }
        rightGrouped.get(edge.name)!.push(edge);
      }
    });

    // Create left nodes (inputs)
    let leftIdx = 0;
    const totalLeftNodes = leftGrouped.size;
    const leftIsEven = totalLeftNodes % 2 === 0;
    const leftMiddle = totalLeftNodes / 2;
    
    leftGrouped.forEach((edges, itemName) => {
      const nodeId = `left-${itemName}`;
      const relatedItem = itemsLookup.get(itemName);
      const imageUrl = relatedItem?.image_urls?.thumb 
        ? `/api/proxy-image?url=${encodeURIComponent(relatedItem.image_urls.thumb)}`
        : '';
      
      elements.push({
        data: {
          id: nodeId,
          label: itemName,
          type: 'input',
          rarity: relatedItem?.infobox?.rarity,
          imageUrl: imageUrl,
          itemName: itemName,
        }
      });

      // Create edge from left to center with combined labels
      const edgeLabels = edges.map(formatEdgeLabel).join('\n');
      
      // Calculate curvature: items above middle curve one way, below curve opposite way
      // If even number of items: no item gets 0 curvature
      // If odd number of items: middle item gets 0 curvature
      const curvature = leftIsEven 
        ? (leftIdx < leftMiddle ? -CURVATURE : CURVATURE)
        : (leftIdx < Math.floor(leftMiddle) ? -CURVATURE : leftIdx > Math.floor(leftMiddle) ? CURVATURE : 0);
      
      elements.push({
        data: {
          source: nodeId,
          target: centerId,
          label: edgeLabels,
          curvature: curvature,
        }
      });
      leftIdx++;
    });

    // Create right nodes (outputs)
    let rightIdx = 0;
    const totalRightNodes = rightGrouped.size;
    const rightIsEven = totalRightNodes % 2 === 0;
    const rightMiddle = totalRightNodes / 2;
    
    rightGrouped.forEach((edges, itemName) => {
      const nodeId = `right-${itemName}`;
      const relatedItem = itemsLookup.get(itemName);
      const imageUrl = relatedItem?.image_urls?.thumb 
        ? `/api/proxy-image?url=${encodeURIComponent(relatedItem.image_urls.thumb)}`
        : '';
      
      elements.push({
        data: {
          id: nodeId,
          label: itemName,
          type: 'output',
          rarity: relatedItem?.infobox?.rarity,
          imageUrl: imageUrl,
          itemName: itemName,
        }
      });

      // Create edge from center to right with combined labels
      const edgeLabels = edges.map(formatEdgeLabel).join('\n');
      
      // Calculate curvature: items above middle curve one way, below curve opposite way
      // If even number of items: no item gets 0 curvature
      // If odd number of items: middle item gets 0 curvature
      const curvature = rightIsEven 
        ? (rightIdx < rightMiddle ? CURVATURE : -CURVATURE)
        : (rightIdx < Math.floor(rightMiddle) ? CURVATURE : rightIdx > Math.floor(rightMiddle) ? -CURVATURE : 0);
      
      elements.push({
        data: {
          source: centerId,
          target: nodeId,
          label: edgeLabels,
          curvature: curvature,
        }
      });
      rightIdx++;
    });

    let cy;
    try {
      cy = cytoscape({
        container: containerRef.current,
        elements: elements,

      style: [
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
            // All edges: source connects from right side (0deg), target connects on left side (180deg)
            // This makes all edges converge to the same points on the center node
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
        {
          selector: 'edge[label="craft_from"]',
          style: {
            'line-color': '#60a5fa',
          }
        },
        {
          selector: 'edge[label="craft_to"]',
          style: {
            'line-color': '#c084fc',
          }
        },
        {
          selector: 'edge[label="recycle_from"], edge[label="recycle_to"]',
          style: {
            'line-color': '#34d399',
          }
        },
        {
          selector: 'edge[label="salvage_from"], edge[label="salvage_to"]',
          style: {
            'line-color': '#10b981',
          }
        },
        {
          selector: 'edge[label="upgrade_from"], edge[label="upgrade_to"]',
          style: {
            'line-color': '#f59e0b',
          }
        },
        {
          selector: 'edge[label="repair_from"]',
          style: {
            'line-color': '#ef4444',
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
      ],

      layout: {
        name: 'preset',
        positions: (node: any) => {
          const nodeId = node.id();
          const nodeType = node.data('type');
          
          const leftX = 250;
          const centerX = 700;
          const rightX = 1150;
          const centerY = 400;
          const spacing = 180;
          
          // Center node
          if (nodeType === 'center') {
            return { x: centerX, y: centerY };
          }
          
          // Left nodes (inputs)
          if (nodeType === 'input') {
            const leftNodeIndex = elements.filter(el => el.data?.type === 'input').findIndex(el => el.data.id === nodeId);
            const totalLeftNodes = leftGrouped.size;
            const startY = centerY - ((totalLeftNodes - 1) * spacing) / 2;
            return { x: leftX, y: startY + leftNodeIndex * spacing };
          }
          
          // Right nodes (outputs)
          if (nodeType === 'output') {
            const rightNodeIndex = elements.filter(el => el.data?.type === 'output').findIndex(el => el.data.id === nodeId);
            const totalRightNodes = rightGrouped.size;
            const startY = centerY - ((totalRightNodes - 1) * spacing) / 2;
            return { x: rightX, y: startY + rightNodeIndex * spacing };
          }
          
          return { x: 0, y: 0 };
        },
        fit: true,
        padding: 120,
      },

        // Enable interactivity
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false,
      });

    } catch (error) {
      console.error('Error initializing Cytoscape:', error);
      return;
    }

    cyRef.current = cy;

    // Force a resize and fit after a short delay to ensure container is sized
    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 150);
        
        const centerNode = cyRef.current.$('[type="center"]');
        const currentZoom = cyRef.current.zoom();
        
        // Calculate zoom needed to make center node properly visible
        // Target: center node should take up about 20-25% of viewport height
        const containerHeight = cyRef.current.height();
        const centerNodeHeight = 250; // Center node height from styles
        const targetNodeScreenHeight = containerHeight * 0.22; // 22% of screen
        const targetZoom = targetNodeScreenHeight / centerNodeHeight;
        
        // Zoom in if current zoom is significantly smaller than target (many nodes)
        if (currentZoom < targetZoom * 0.8) {
          // Use the higher of current zoom * 1.5 or calculated target zoom
          const finalZoom = Math.max(currentZoom * 1.5, targetZoom);
          
          cyRef.current.animate({
            zoom: finalZoom,
            center: {
              eles: centerNode,
            },
          }, {
            duration: 1300,
            easing: 'ease-out-cubic',
          });
        } else {
          // Graph is already big (few nodes), do a slight zoom out for dynamic feel
          const finalZoom = currentZoom * 0.85; // Zoom out by 15%
          
          cyRef.current.animate({
            zoom: finalZoom,
            center: {
              eles: centerNode,
            },
          }, {
            duration: 1300,
            easing: 'ease-out-cubic',
          });
        }
      }
    }, 100);

    // Handle node clicks - navigate to item if not center node
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data();
      
      if (nodeData.type !== 'center' && nodeData.itemName) {
        // Navigate to the clicked item
        window.location.href = `/crafting-tree?item=${encodeURIComponent(nodeData.itemName)}`;
      } else {
        setSelectedNode({
          id: nodeData.id,
          label: nodeData.label,
          type: nodeData.type,
          rarity: nodeData.rarity,
        });
      }
    });

    // Handle background clicks
    cy.on('tap', (event) => {
      if (event.target === cy) {
        setSelectedNode(null);
      }
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [isReady, itemName, itemsLookup]);

  // Show loading or error state
  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#07020b] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className="min-h-screen bg-[#07020b] text-gray-100 flex flex-col">
        <header className="bg-[#07020b] border-b border-purple-500/20 sticky top-0 z-40">
          <div className="flex items-center justify-between pr-8">
            <a href="/" className="flex-shrink-0 h-24 flex items-center cursor-pointer">
              <Image
                src="/logo.webp"
                alt="ARC Forge"
                width={320}
                height={96}
                className="w-auto"
                style={{ height: '100%' }}
                priority
              />
            </a>
            <nav className="flex gap-2">
              <a
                href="/"
                className="px-6 py-3 bg-black/20 border border-purple-500/20 rounded-lg text-gray-400 font-medium hover:bg-purple-500/10 hover:text-gray-300 transition-all"
              >
                Item Database
              </a>
              <a
                href="/crafting-tree?item=Heavy%20Gun%20Parts"
                className="px-6 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 font-medium hover:bg-purple-500/30 transition-all"
              >
                Crafting Tree
              </a>
            </nav>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">Item not found</h2>
            <p className="text-gray-500 mb-4">"{itemName}" could not be found in the database</p>
            <a
              href="/crafting-tree?item=Heavy%20Gun%20Parts"
              className="px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all inline-block"
            >
              Go to Heavy Gun Parts
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#07020b] text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-[#07020b] border-b border-purple-500/20 z-40 flex-shrink-0">
        <div className="flex items-center justify-between pr-8">
          <a href="/" className="flex-shrink-0 h-24 flex items-center cursor-pointer">
            <Image
              src="/logo.webp"
              alt="ARC Forge"
              width={320}
              height={96}
              className="w-auto"
              style={{ height: '100%' }}
              priority
            />
          </a>
          
          <nav className="flex gap-2">
            <a
              href="/"
              className="px-6 py-3 bg-black/20 border border-purple-500/20 rounded-lg text-gray-400 font-medium hover:bg-purple-500/10 hover:text-gray-300 transition-all"
            >
              Item Database
            </a>
            <a
              href="/crafting-tree?item=Heavy%20Gun%20Parts"
              className="px-6 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 font-medium hover:bg-purple-500/30 transition-all"
            >
              Crafting Tree
            </a>
          </nav>
        </div>
      </header>

      {/* Graph Canvas */}
      <div className="flex-1 relative bg-[#07020b] overflow-hidden">
        <div 
          ref={containerRef}
          className="w-full h-full"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, rgba(7, 2, 11, 1) 100%)'
          }}
        />
      </div>
    </div>
  );
}

export default function CraftingTree() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07020b] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading...</div>
        </div>
      </div>
    }>
      <CraftingTreeContent />
    </Suspense>
  );
}
