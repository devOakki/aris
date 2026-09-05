'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';

interface SkillAutocompleteInputProps {
  label: string;
  placeholder: string;
  selectedItems: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
  masterList: string[];
  badgeColorTheme?: 'blue' | 'red';
  helperHint?: string;
}

export default function SkillAutocompleteInput({
  label,
  placeholder,
  selectedItems,
  onAddItem,
  onRemoveItem,
  masterList,
  badgeColorTheme = 'blue',
  helperHint,
}: SkillAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 150ms Minimal Interval Debounce for responsive, zero-lag typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 150);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // Filter curated master list based on debounced query (excluding already selected items)
  const filteredSuggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    const lowerQuery = debouncedQuery.toLowerCase();
    return masterList
      .filter((item) => !selectedItems.includes(item) && item.toLowerCase().includes(lowerQuery))
      .slice(0, 8); // Top 8 relevant matches
  }, [debouncedQuery, masterList, selectedItems]);

  // Check if current input matches an existing suggestion exactly (case-insensitive)
  const hasExactMatch = useMemo(() => {
    const trimmed = inputValue.trim().toLowerCase();
    return filteredSuggestions.some((s) => s.toLowerCase() === trimmed);
  }, [inputValue, filteredSuggestions]);

  // Total selectable items (filtered suggestions + custom entry if not matching exact)
  const isCustomAllowed = inputValue.trim().length > 0 && !hasExactMatch && !selectedItems.includes(inputValue.trim());

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item: string) => {
    const cleaned = item.trim();
    if (cleaned && !selectedItems.includes(cleaned)) {
      onAddItem(cleaned);
      setInputValue('');
      setDebouncedQuery('');
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleManualAdd = () => {
    if (inputValue.trim()) {
      handleSelectItem(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    const totalCount = filteredSuggestions.length + (isCustomAllowed ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? totalCount - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        handleSelectItem(filteredSuggestions[selectedIndex]);
      } else if (selectedIndex === filteredSuggestions.length && isCustomAllowed) {
        handleSelectItem(inputValue.trim());
      } else if (filteredSuggestions.length > 0) {
        // Default to first match if enter pressed without arrow navigation
        handleSelectItem(filteredSuggestions[0]);
      } else if (isCustomAllowed) {
        handleSelectItem(inputValue.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Helper to highlight matching text in suggestion
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-bold text-[#B81D24] underline decoration-red-300">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        {helperHint && (
          <span className="text-[10px] text-slate-400 font-normal">{helperHint}</span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              if (inputValue.trim() || filteredSuggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] transition-colors"
          />

          {/* Autocomplete Dropdown Panel (LinkedIn Style) */}
          {isOpen && (filteredSuggestions.length > 0 || isCustomAllowed) && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-sm shadow-xl z-50 max-h-52 overflow-y-auto">
              <div className="px-2.5 py-1 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Suggested Skills</span>
                <span className="font-normal lowercase">click or press Enter</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredSuggestions.map((suggestion, index) => {
                  const isHighlighted = selectedIndex === index;
                  return (
                    <div
                      key={suggestion}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevents input blur before click registers
                        handleSelectItem(suggestion);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isHighlighted ? 'bg-red-50 text-[#B81D24]' : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-slate-400" />
                        <span>{highlightMatch(suggestion, debouncedQuery)}</span>
                      </div>
                      <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  );
                })}

                {/* Custom Item Option (if user typed something not matching curated list exactly) */}
                {isCustomAllowed && (
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectItem(inputValue.trim());
                    }}
                    onMouseEnter={() => setSelectedIndex(filteredSuggestions.length)}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer border-t border-slate-200 bg-amber-50/60 ${
                      selectedIndex === filteredSuggestions.length
                        ? 'bg-amber-100 text-amber-900'
                        : 'text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <Plus className="w-3.5 h-3.5 text-amber-700" />
                      <span>
                        Add custom: <strong className="font-bold">&quot;{inputValue.trim()}&quot;</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-700 uppercase tracking-wider font-semibold">Custom</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleManualAdd}
          disabled={!inputValue.trim()}
          className="px-3 py-1.5 rounded-sm bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer transition-colors"
        >
          Add
        </button>
      </div>

      {/* Selected Tag Pills */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedItems.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium transition-all ${
                badgeColorTheme === 'blue'
                  ? 'bg-blue-50 border border-blue-200 text-[#1A4DBE]'
                  : 'bg-red-50 border border-red-200 text-[#B81D24]'
              }`}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onRemoveItem(item)}
                className="cursor-pointer hover:opacity-75 focus:outline-none"
                title={`Remove ${item}`}
              >
                <X className="w-3 h-3 text-slate-400 hover:text-red-600" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
