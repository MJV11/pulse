'use client';

// src/components/ThemedTabs.tsx

import { TabItemProps, Tabs as FlowbiteTabs, TabsProps, TabsRef } from 'flowbite-react';
import React, { forwardRef, useState, useEffect, Children, isValidElement, cloneElement } from 'react';

// Define the custom theme for the TabItem component specifically
export const tabItemTheme = {
  base: 'flex flex-col gap-2',
  tablist: {
    base: 'flex text-center overflow-x-auto',
    variant: {
      default: 'flex-nowrap overflow-x-auto border-b border-silicongray-200 dark:border-silicongray-700',
      underline: 'flex-nowrap overflow-x-auto -mb-px border-b border-silicongray-200 dark:border-silicongray-700',
      pills: 'flex-nowrap overflow-x-auto font-medium text-sm text-silicongray-500 dark:text-silicongray-400',
      fullWidth:
        'hidden text-sm font-medium rounded-lg divide-x divide-silicongray-200 shadow sm:flex dark:divide-silicongray-700 dark:text-silicongray-400',
    },
    tabitem: {
      base: 'flex items-center justify-center p-3 text-sm font-medium first:ml-0 disabled:cursor-not-allowed disabled:text-silicongray-400 disabled:dark:text-silicongray-500 shrink-0 whitespace-nowrap',
      variant: {
        default: {
          base: 'rounded-t-lg',
          active: {
            on: 'bg-transparent text-wasabi-600 dark:bg-transparent dark:text-wasabi-500 border-b-2 border-wasabi-500',
            off: 'text-silicongray-500 bg-transparent hover:bg-transparent hover:text-black dark:text-silicongray-400 dark:hover:bg-transparent dark:hover:text-white',
          },
        },
        underline: {
          base: 'rounded-t-lg',
          active: {
            on: 'text-wasabi-600 rounded-t-lg border-b-2 border-wasabi-600 active dark:text-wasabi-500 dark:border-wasabi-500 ',
            off: 'border-b-2 border-transparent text-silicongray-500 hover:border-silicongray-300 hover:text-silicongray-600 dark:text-silicongray-400 dark:hover:text-silicongray-300',
          },
        },
        pills: {
          base: '',
          active: {
            on: 'rounded-lg bg-wasabi-600 text-white',
            off: 'rounded-lg hover:text-silicongray-900 hover:bg-silicongray-100 dark:hover:bg-silicongray-800 dark:hover:text-white',
          },
        },
        fullWidth: {
          base: 'ml-2 first:ml-0 w-full first:rounded-l-lg last:rounded-r-lg',
          active: {
            on: 'inline-block p-4 w-full text-silicongray-900 bg-silicongray-100 focus:ring-4 focus:ring-wasabi-300 active focus:outline-none dark:bg-silicongray-700 dark:text-white',
            off: 'bg-white hover:text-silicongray-700 hover:bg-silicongray-50 focus:ring-4 focus:ring-wasabi-300 focus:outline-none dark:hover:text-white dark:bg-silicongray-800 dark:hover:bg-silicongray-700',
          },
        },
      },
      icon: 'mr-2 h-5 w-5',
    },
  },
  tabpanel: 'py-3',
};

// Custom wrapper for FlowbiteTabs that only renders active tab content
const LazyTabs = forwardRef<TabsRef, TabsProps>(({ children, ...props }, ref) => {
  // Helper to find the index of a child explicitly marked as active
  const getActiveIndexFromChildren = (nodes: React.ReactNode): number => {
    const childrenArray = Children.toArray(nodes);
    return childrenArray.findIndex(
      (child) => isValidElement(child) && (child.props as Record<string, unknown>).active,
    );
  };

  // Track the active tab index, initialize from children if provided
  const [activeTab, setActiveTab] = useState<number>(() => {
    const idx = getActiveIndexFromChildren(children);
    return idx !== -1 ? idx : 0;
  });

  // Sync to an explicitly active child if provided; otherwise, don't override current selection
  useEffect(() => {
    const activeIndex = getActiveIndexFromChildren(children);
    if (activeIndex !== -1) {
      setActiveTab(activeIndex);
    }
  }, [children]);

  // Handle tab change
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (props.onActiveTabChange) {
      props.onActiveTabChange(index);
    }
  };

  return (
    <FlowbiteTabs theme={tabItemTheme} ref={ref} {...props} onActiveTabChange={handleTabChange}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;

        // Ensure Flowbite receives correct active flags; keep all panels mounted
        const tabChild = child as React.ReactElement<TabItemProps>;
        return cloneElement(tabChild, {
          ...tabChild.props,
          active: index === activeTab,
        });
      })}
    </FlowbiteTabs>
  );
});

const Tabs = LazyTabs as React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<TabsRef>> & {
  Item: React.FC<TabItemProps>;
};

function Item({ children, onClick, ...props }: TabItemProps) {
  return (
    <FlowbiteTabs.Item {...props} onClick={onClick}>
      {children}
    </FlowbiteTabs.Item>
  );
}

Tabs.Item = Item;

export { Tabs };
