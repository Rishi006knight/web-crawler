import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, value, onValueChange, className = '', children }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (tab: string) => {
    if (value === undefined) setInternalTab(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 p-1 bg-surface-sunken border border-line rounded-lg text-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function TabTrigger({
  value,
  className = '',
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabTrigger must be used within Tabs');

  const isSelected = context.activeTab === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      onClick={() => context.setActiveTab(value)}
      className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors duration-fast select-none focus-ring ${
        isSelected
          ? 'bg-surface-raised text-ink-strong shadow-hairline border border-line'
          : 'text-ink-secondary hover:text-ink hover:bg-surface/50 border border-transparent'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabContent({
  value,
  className = '',
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return (
    <div role="tabpanel" className={`pt-3 animate-fade ${className}`}>
      {children}
    </div>
  );
}
