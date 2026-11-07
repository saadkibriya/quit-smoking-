import React, { useState } from 'react';
import { HomeLayoutItem, HomeCardId } from '../../types';
import { ALL_HOME_CARDS, DEFAULT_HOME_LAYOUT } from '../../data/storage';
import { Sound } from '../../data/sound';
import {
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Sliders,
  EyeOff,
  GripVertical,
} from 'lucide-react';

interface CustomizeHomeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  homeLayout: HomeLayoutItem[];
  onSaveLayout: (newLayout: HomeLayoutItem[]) => void;
  onResetToSimple: () => void;
}

export const CustomizeHomeDrawer: React.FC<CustomizeHomeDrawerProps> = ({
  isOpen,
  onClose,
  homeLayout,
  onSaveLayout,
  onResetToSimple,
}) => {
  const [layout, setLayout] = useState<HomeLayoutItem[]>(homeLayout);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const currentVisibleCards = layout.filter((item) => item.visible);
  const visibleCardIds = new Set(currentVisibleCards.map((item) => item.cardId));

  // Cards not currently on the home screen
  const availableToAdd = ALL_HOME_CARDS.filter((card) => !visibleCardIds.has(card.id));

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    Sound.tick();
    const newItems = [...layout];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setLayout(newItems);
    onSaveLayout(newItems);
  };

  const handleHide = (cardId: HomeCardId) => {
    Sound.tick();
    const updated = layout.filter((item) => item.cardId !== cardId);
    setLayout(updated);
    onSaveLayout(updated);
  };

  const handleAdd = (cardId: HomeCardId, defaultSize: 'S' | 'W' | 'L') => {
    Sound.tick();
    const newItem: HomeLayoutItem = {
      cardId,
      visible: true,
      size: defaultSize,
    };
    const updated = [...layout, newItem];
    setLayout(updated);
    onSaveLayout(updated);
  };

  const handleCycleSize = (cardId: HomeCardId) => {
    Sound.tick();
    const updated = layout.map((item) => {
      if (item.cardId === cardId) {
        const nextSize: 'S' | 'W' | 'L' = item.size === 'S' ? 'W' : item.size === 'W' ? 'L' : 'S';
        return { ...item, size: nextSize };
      }
      return item;
    });
    setLayout(updated);
    onSaveLayout(updated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customize Home"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-[#000000] text-white border-t sm:border border-[#2A2A2A] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A] mb-4 shrink-0">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Customize home</h3>
            <p className="text-[11px] text-[#8A8A8A]">
              Choose which cards appear on your main dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close customizer"
            className="w-8 h-8 rounded-full border border-[#2A2A2A] flex items-center justify-center hover:bg-[#141414] active:scale-95 transition"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Section 1: On your home */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#8A8A8A]">
                On your home ({currentVisibleCards.length})
              </span>
              <span className="text-[10px] text-[#8A8A8A]">Tap size to toggle</span>
            </div>

            <div className="space-y-1.5">
              {layout.map((item, index) => {
                const cardMeta = ALL_HOME_CARDS.find((c) => c.id === item.cardId);
                const isPermanent = cardMeta?.isPermanent || item.cardId === 'TIMER';

                return (
                  <div
                    key={item.cardId}
                    className="p-3 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <GripVertical className="w-4 h-4 text-[#8A8A8A] shrink-0" />
                      <div>
                        <span className="font-bold text-white block">
                          {cardMeta?.label || item.cardId}
                        </span>
                        <span className="text-[10px] text-[#8A8A8A]">
                          Size: {item.size === 'S' ? 'Small (1 col)' : item.size === 'W' ? 'Wide (2 cols)' : 'Large (2×2)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Cycle size button */}
                      <button
                        onClick={() => handleCycleSize(item.cardId)}
                        className="px-2 py-1 rounded-lg border border-[#3D3D3D] text-[10px] font-mono font-bold text-white hover:bg-[#262626]"
                        title="Toggle size (S/W/L)"
                      >
                        {item.size}
                      </button>

                      {/* Reorder Up */}
                      <button
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'UP')}
                        className="p-1.5 rounded-lg border border-[#2A2A2A] text-white hover:bg-[#262626] disabled:opacity-20"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Reorder Down */}
                      <button
                        disabled={index === layout.length - 1}
                        onClick={() => handleMove(index, 'DOWN')}
                        className="p-1.5 rounded-lg border border-[#2A2A2A] text-white hover:bg-[#262626] disabled:opacity-20"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Hide (✕) */}
                      {!isPermanent ? (
                        <button
                          onClick={() => handleHide(item.cardId)}
                          className="p-1.5 rounded-lg border border-[#2A2A2A] text-[#8A8A8A] hover:text-[#D71921] hover:border-[#D71921]"
                          title="Hide card"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="w-7 text-center text-[10px] text-[#8A8A8A]">fixed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Add a card */}
          <div className="pt-3 border-t border-[#2A2A2A]">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#8A8A8A] block mb-2">
              Add a card ({availableToAdd.length})
            </span>

            {availableToAdd.length === 0 ? (
              <p className="text-xs text-[#8A8A8A] italic">
                All available cards are currently on your home screen.
              </p>
            ) : (
              <div className="space-y-1.5">
                {availableToAdd.map((card) => (
                  <div
                    key={card.id}
                    className="p-3 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between text-xs"
                  >
                    <div className="pr-2">
                      <span className="font-bold text-white block">{card.label}</span>
                      <span className="text-[11px] text-[#8A8A8A]">{card.description}</span>
                    </div>

                    <button
                      onClick={() => handleAdd(card.id, card.defaultSize)}
                      className="h-8 px-3 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-1 shrink-0 active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-black" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Reset to simple layout */}
        <div className="pt-4 border-t border-[#2A2A2A] mt-4 flex items-center justify-between shrink-0">
          {showConfirmReset ? (
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-xs text-[#8A8A8A]">Reset to simple 4-card layout?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    Sound.tick();
                    setShowConfirmReset(false);
                    onResetToSimple();
                    setLayout(DEFAULT_HOME_LAYOUT);
                    onClose();
                  }}
                  className="h-9 px-3 rounded-xl bg-white text-black font-bold text-xs"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="h-9 px-3 rounded-xl border border-[#3D3D3D] text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowConfirmReset(true)}
                className="text-xs text-[#8A8A8A] underline hover:text-white"
              >
                Reset to simple layout
              </button>
              <button
                onClick={onClose}
                className="h-10 px-5 rounded-full bg-white text-black font-bold text-xs active:scale-95 transition"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
