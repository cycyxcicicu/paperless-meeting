import React from 'react';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface ModernTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

const ModernTabs: React.FC<ModernTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-1 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              relative px-6 py-4 text-sm font-medium transition-all rounded-t-xl
              ${activeTab === tab.key
                ? 'text-[#C8102E] bg-gradient-to-b from-red-50/50 to-transparent'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  px-2 py-0.5 text-xs font-semibold rounded-full
                  ${activeTab === tab.key
                    ? 'bg-[#C8102E] text-white'
                    : 'bg-gray-200 text-gray-700'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C8102E] to-[#A90F14] rounded-t-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export { ModernTabs };
