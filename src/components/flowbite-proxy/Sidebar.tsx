'use client';

import {
  Sidebar as FlowbiteSidebar,
  SidebarItemGroupProps,
  SidebarItemProps,
  SidebarItemsProps,
  SidebarProps,
} from 'flowbite-react';

// flowbite sidebar theme with darkmode colors set as default and light colors removed and additional styling
const sidebarTheme = {
  root: {
    base: 'h-full',
    collapsed: {
      on: 'w-16',
      off: 'w-64',
    },
    inner: 'h-full overflow-y-auto overflow-x-hidden px-3 py-4',
  },
  collapse: {
    button:
      'group flex w-full items-center rounded-lg p-2 text-base font-normal transition duration-75 text-white hover:bg-gray-700',
    icon: {
      base: 'h-6 w-6 transition duration-75 text-gray-400 group-hover:text-white',
      open: {
        off: '',
        on: 'text-gray-900',
      },
    },
    label: {
      base: 'ml-3 flex-1 whitespace-nowrap text-left',
      icon: {
        base: 'h-6 w-6 transition delay-0 ease-in-out',
        open: {
          on: 'rotate-180',
          off: '',
        },
      },
    },
    list: 'space-y-2 py-2',
  },
  cta: {
    base: 'mt-6 rounded-lg p-4 bg-gray-900',
    color: {
      blue: 'bg-cyan-900',
      dark: 'bg-dark-900',
      failure: 'bg-red-900',
      gray: 'bg-alternative-900',
      green: 'bg-green-900',
      light: 'bg-light-900',
      red: 'bg-red-900',
      purple: 'bg-purple-900',
      success: 'bg-green-900',
      yellow: 'bg-yellow-900',
      warning: 'bg-yellow-900',
    },
  },
  item: {
    base: 'flex items-center justify-center rounded p-2 text-gray-900 dark:text-gray-100 font-medium text-left capitalize hover:bg-gray-100 dark:hover:bg-gray-700',
    active: 'bg-gray-200 hover:bg-gray-200 dark:bg-gray-800 hover:dark:bg-gray-700',
    collapsed: {
      insideCollapse: 'group w-full pl-8 transition duration-75',
      noIcon: 'font-bold',
    },
    content: {
      base: 'font-normal flex-1 whitespace-nowrap px-3 cursor-default',
    },
    icon: {
      base: 'h-4 w-4 flex-shrink-0 transition duration-75 dark:text-gray-300 group-hover:text-white',
      active: 'text-gray-900 dark:text-gray-300',
    },
    label: '',
    listItem: '',
  },
  items: {
    base: '',
  },
  itemGroup: {
    base: 'mt-4 space-y-2 border-t border-gray-200 pt-4 first:mt-0 first:border-t-0 first:pt-0 dark:border-gray-700',
  },
  logo: {
    base: 'mb-5 flex items-center pl-2.5',
    collapsed: {
      on: 'hidden',
      off: 'self-center whitespace-nowrap text-xl font-semibold text-white',
    },
    img: 'mr-3 h-6 sm:h-7',
  },
};

function Sidebar({ children, ...props }: SidebarProps) {
  return (
    <FlowbiteSidebar theme={sidebarTheme} {...props}>
      {children}
    </FlowbiteSidebar>
  );
}

function Items({ children, ...props }: SidebarItemsProps) {
  return <FlowbiteSidebar.Items {...props}>{children}</FlowbiteSidebar.Items>;
}

function ItemGroup({ children, ...props }: SidebarItemGroupProps) {
  return <FlowbiteSidebar.ItemGroup {...props}>{children}</FlowbiteSidebar.ItemGroup>;
}

function Item({ children, ...props }: SidebarItemProps) {
  return <FlowbiteSidebar.Item {...props}>{children}</FlowbiteSidebar.Item>;
}

Sidebar.Item = Item;
Sidebar.Items = Items;
Sidebar.ItemGroup = ItemGroup;

export { Sidebar };
