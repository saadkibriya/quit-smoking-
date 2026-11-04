import React, { useState } from 'react';
import { UserPlan, Entry, WidgetLayoutItem } from '../../types';
import { WidgetRenderer } from '../widgets/WidgetCards';
import { Sliders, Plus, Trash2, ArrowUp, ArrowDown, Check, Maximize2 } from 'lucide-react';
import { Sound } from '../../data/sound';

interface InAppWidgetGridProps {
  plan: UserPlan;
  entries: Entry[];
  onUpdateLayout: (layout: WidgetLayoutItem[]) => void;
  onOpenSos: () => void;
  onOpenJourney: () => void;
  onOpenToolkit: () => void;
  onQuickLog?: () => void;
  onPledge?: () => void;
}

export const InAppWidgetGrid: React.FC<InAppWidgetGridProps> = ({
  plan,
  entries,
  onUpdateLayout,
  onOpenSos,
  onOpenJourney,
  onOpenToolkit,
  onQuickLog,
  onPledge,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const layout = plan.widgetLayout || [];

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    Sound.tick();
    const newLayout = [...layout];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    const temp = newLayout[index];
    newLayout[index] = newLayout[targetIndex];
    newLayout[targetIndex] = temp;
    onUpdateLayout(newLayout);
  };

  const handleRemove = (id: string) => {
    Sound.tick();
    onUpdateLayout(layout.filter((w) => w.id !== id));
  };

  const handleToggleSize = (id: string) => {
    Sound.tick();
    onUpdateLayout(
      layout.map((w) => {
        if (w.id === id) {
          const nextSize = w.size === 'S' ? 'W' : w.size === 'W' ? 'L' : 'S';
          return { ...w, size: nextSize };
        }
        return w;
      })
    );
  };

  const availableWidgetTypes: Array<{ type: string; label: string; defaultSize: 'S' | 'W' | 'L' }> = [
    { type: 'TIMER', label: 'Smoke-free timer', defaultSize: 'W' },
    { type: 'QUICK_LOG', label: 'Quick log (+1 button)', defaultSize: 'S' },
    { type: 'SOS', label: 'Craving SOS shortcut', defaultSize: 'S' },
    { type: 'MONEY_KEPT', label: 'Money kept', defaultSize: 'S' },
    { type: 'CIGS_AVOIDED', label: 'Cigarettes avoided', defaultSize: 'S' },
    { type: 'LIFE_REGAINED', label: 'Life regained estimate', defaultSize: 'W' },
    { type: 'ROUND_PROGRESS', label: 'Round 1 progress (28 squares)', defaultSize: 'W' },
    { type: 'WEEK_COMPARISON', label: 'Week vs last week', defaultSize: 'W' },
    { type: 'CRAVINGS_BEATEN', label: 'Cravings beaten count', defaultSize: 'S' },
    { type: 'WHAT_IS_NORMAL', label: "What's normal today", defaultSize: 'W' },
    { type: 'MY_WHY', label: 'My why anchor', defaultSize: 'W' },
    { type: 'DAILY_PLEDGE', label: 'Daily pledge card', defaultSize: 'S' },
    { type: 'GROWTH', label: 'Plant growth blocks', defaultSize: 'L' },
  ];

  const handleAddWidget = (item: { type: string; defaultSize: 'S' | 'W' | 'L' }) => {
    Sound.tick();
    const newWidget: WidgetLayoutItem = {
      id: `w_${Date.now()}`,
      type: item.type,
      size: item.defaultSize,
    };
    onUpdateLayout([...layout, newWidget]);
    setShowAddModal(false);
  };

  return (
    <div className="w-full mt-2">
      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-2 gap-3">
        {layout.map((item, idx) => {
          const colSpan = item.size === 'S' ? 'col-span-1' : 'col-span-2';

          return (
            <div key={item.id} className={`${colSpan} relative group`}>
              <WidgetRenderer
                type={item.type}
                size={item.size}
                plan={plan}
                entries={entries}
                onOpenSos={onOpenSos}
                onOpenJourney={onOpenJourney}
                onOpenToolkit={onOpenToolkit}
                onQuickLog={onQuickLog}
                onPledge={onPledge}
              />

              {/* Edit Mode Overlay Controls */}
              {isEditing && (
                <div className="absolute top-2 right-2 bg-black/80 dark:bg-white/90 text-white dark:text-black rounded-xl p-1 flex items-center gap-1 z-20 shadow-md">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'UP')}
                    className="p-1 hover:opacity-70 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === layout.length - 1}
                    onClick={() => handleMove(idx, 'DOWN')}
                    className="p-1 hover:opacity-70 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleSize(item.id)}
                    className="p-1 hover:opacity-70 text-[10px] font-bold px-1"
                    title="Cycle size (S/W/L)"
                  >
                    {item.size}
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1 hover:opacity-70 text-red-400 dark:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Widgets Toggle / Add Button */}
      <div className="flex items-center justify-center gap-3 mt-4 mb-2">
        <button
          onClick={() => {
            Sound.tick();
            setIsEditing(!isEditing);
          }}
          className="h-10 px-4 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-semibold text-black dark:text-white flex items-center gap-1.5 hover:bg-[#F2F2F2] dark:hover:bg-[#141414] active:scale-95 transition"
        >
          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
          <span>{isEditing ? 'Done Editing' : 'Edit Widgets'}</span>
        </button>

        {isEditing && (
          <button
            onClick={() => {
              Sound.tick();
              setShowAddModal(true);
            }}
            className="h-10 px-4 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Widget</span>
          </button>
        )}
      </div>

      {/* Add Widget Picker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-black dark:text-white">
                Add to Today Screen
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-semibold text-[#5E5E5E] dark:text-[#A6A6A6]"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              {availableWidgetTypes.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddWidget(item)}
                  className="w-full p-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-left flex items-center justify-between hover:border-black dark:hover:border-white transition"
                >
                  <span className="text-xs font-bold text-black dark:text-white">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Size: {item.defaultSize}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
