'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Battery, Award, Users, Heart, Bot } from 'lucide-react';

export interface UsersFilterValues {
  recharged: boolean;
  campaign: boolean;
  holderGreaterThan1: boolean;
  reactionGreaterThan1: boolean;
  botGreaterThan1: boolean;
}

const defaultFilters: UsersFilterValues = {
  recharged: false,
  campaign: false,
  holderGreaterThan1: false,
  reactionGreaterThan1: false,
  botGreaterThan1: false,
};

interface UsersFilterPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: UsersFilterValues) => void;
  initialFilters?: Partial<UsersFilterValues>;
}

const filterOptions: Array<{
  key: keyof UsersFilterValues;
  label: string;
  icon: React.ElementType;
}> = [
  { key: 'recharged', label: 'Recharged', icon: Battery },
  { key: 'campaign', label: 'Campaign', icon: Award },
  { key: 'holderGreaterThan1', label: 'Holder greater than 1', icon: Users },
  { key: 'reactionGreaterThan1', label: 'Reaction greater than 1', icon: Heart },
  { key: 'botGreaterThan1', label: 'Bot greater than 1', icon: Bot },
];

export function UsersFilterPopup({
  open,
  onOpenChange,
  onApply,
  initialFilters,
}: UsersFilterPopupProps) {
  const [filters, setFilters] = useState<UsersFilterValues>({
    ...defaultFilters,
    ...initialFilters,
  });

  useEffect(() => {
    if (open) {
      setFilters({
        ...defaultFilters,
        ...initialFilters,
      });
    }
  }, [open, initialFilters]);

  const handleToggle = (key: keyof UsersFilterValues) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-gray-800 border-gray-700 text-white p-0 gap-0 overflow-hidden sm:rounded-lg [&>button]:text-gray-400 [&>button:hover]:text-white [&>button]:right-4 [&>button]:top-4">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-700">
          <DialogTitle className="text-lg font-semibold text-white">
            Filter users
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4 space-y-1">
          {filterOptions.map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={() => handleToggle(key)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <Icon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-200">{label}</span>
            </label>
          ))}
        </div>
        <DialogFooter className="px-5 py-4 border-t border-gray-700 flex-row justify-between sm:justify-between gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Apply {hasActiveFilters ? `(${Object.values(filters).filter(Boolean).length})` : ''}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
