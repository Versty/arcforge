import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EDGE_COLORS = [
  { label: 'Craft', color: '#60a5fa' },
  { label: 'Repair', color: '#ef4444' },
  { label: 'Upgrade', color: '#ec4899' },
  { label: 'Recycle', color: '#34d399' },
  { label: 'Salvage', color: '#10b981' },
  { label: 'Trade', color: '#fbbf24' },
];

export default function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[420px] bg-gradient-to-br from-black/95 via-purple-950/30 to-black/95 backdrop-blur-2xl border border-purple-500/40 z-50 rounded-2xl shadow-2xl animate-slide-up pointer-events-auto max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none rounded-2xl" />
      
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 flex items-center gap-2">
            <FontAwesomeIcon icon={faQuestionCircle} className="text-purple-400 text-sm" />
            How to Use
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-all duration-300 text-gray-400 hover:text-red-300 border border-purple-500/20 hover:border-red-500/50"
          >
            <span className="text-sm">✕</span>
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Navigation */}
          <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
            <h3 className="text-purple-300 font-semibold mb-2 text-xs uppercase tracking-wide">Navigation</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• <span className="text-purple-200">Click nodes</span> to navigate to that item</li>
              <li>• <span className="text-purple-200">Scroll/pinch</span> to zoom in/out</li>
              <li>• <span className="text-purple-200">Drag background</span> to pan around</li>
            </ul>
          </div>

          {/* Edge Color */}
          <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
            <h3 className="text-purple-300 font-semibold mb-2 text-xs uppercase tracking-wide">Edge Color</h3>
            <div className="grid grid-cols-2 gap-2">
              {EDGE_COLORS.map((edge) => (
                <div key={edge.label} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-0.5 rounded-full"
                    style={{ backgroundColor: edge.color }}
                  />
                  <span className="text-gray-300 text-xs">{edge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graph Structure */}
          <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
            <h3 className="text-purple-300 font-semibold mb-2 text-xs uppercase tracking-wide">Graph Structure</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• <span className="text-yellow-300">Center node</span>: Current item</li>
              <li>• <span className="text-blue-300">Left nodes</span>: Required inputs</li>
              <li>• <span className="text-green-300">Right nodes</span>: Possible outputs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

