import React from 'react';
// FIX: Import the TabId type to be used in component props.
import type { TabId } from '../types';

// FIX: Use TabId for the tab identifier for better type safety.
interface Tab {
  id: TabId;
  label: string;
}

// FIX: Update prop types to use the specific TabId type.
interface TabsProps {
  tabs: Tab[];
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-base"
          value={activeTab}
          // FIX: Cast the string value from the event target to TabId.
          onChange={(e) => setActiveTab(e.target.value as TabId)}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 py-4 px-3 text-base font-medium transition-colors duration-200`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Tabs;