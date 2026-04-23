'use client';

import { Pagination as FlowbitePagination, PaginationProps } from 'flowbite-react';
import { HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi';

// Define the custom theme for Pagination
const paginationTheme = {
  layout: {
    table: {
      base: 'text-sm text-silicongray-700 dark:text-silicongray-400',
      span: 'font-semibold text-silicongray-900 dark:text-white',
    },
  },
  pages: {
    base: 'inline-flex -space-x-px',
    previous: {
      base: 'ml-0 border border-silicongray-300 bg-white px-2 sm:px-3 py-2 leading-tight text-silicongray-500 enabled:hover:bg-silicongray-100 enabled:hover:text-silicongray-700 dark:border-silicongray-700 dark:bg-silicongray-800 dark:text-silicongray-400 enabled:dark:hover:bg-silicongray-700 enabled:dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed',
    },
    next: {
      base: 'border border-silicongray-300 bg-white px-2 sm:px-3 py-2 leading-tight text-silicongray-500 enabled:hover:bg-silicongray-100 enabled:hover:text-silicongray-700 dark:border-silicongray-700 dark:bg-silicongray-800 dark:text-silicongray-400 enabled:dark:hover:bg-silicongray-700 enabled:dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed',
    },
    selector: {
      base: 'w-8 sm:w-10 border border-silicongray-300 bg-white py-2 leading-tight text-silicongray-500 enabled:hover:bg-silicongray-100 enabled:hover:text-silicongray-700 dark:border-silicongray-700 dark:bg-silicongray-800 dark:text-silicongray-400 enabled:dark:hover:bg-silicongray-700 enabled:dark:hover:text-white text-sm',
      active:
        'bg-silicongray-50 text-silicongray-600 hover:bg-silicongray-100 hover:text-silicongray-700 dark:border-silicongray-700 dark:bg-silicongray-700 dark:text-white',
    },
  },
};

interface ExtendedPaginationProps extends PaginationProps {
  totalItems?: number;
  itemsPerPage?: number;
}

function Pagination({
  currentPage,
  totalPages: propsTotalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  ...props
}: ExtendedPaginationProps) {
  // Calculate totalPages only if we have the new optional props
  const totalPages = totalItems && itemsPerPage ? Math.ceil(totalItems / itemsPerPage) : propsTotalPages;

  const handleFirstPage = () => {
    onPageChange(1);
  };

  const handleLastPage = () => {
    onPageChange(totalPages);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 sm:gap-0">
      <div className="flex items-center text-xs sm:text-sm text-silicongray-400 sm:order-1 w-full sm:w-auto justify-center sm:justify-start">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center sm:order-2 w-full sm:w-auto justify-center sm:justify-end gap-0">
        <button
          onClick={handleFirstPage}
          disabled={currentPage === 1}
          className={`${paginationTheme.pages.previous.base} rounded-l-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Go to first page"
        >
          <HiChevronDoubleLeft className="h-5 w-5" />
        </button>
        <FlowbitePagination
          theme={paginationTheme}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          previousLabel=""
          nextLabel=""
          showIcons
          {...props}
        />
        <button
          onClick={handleLastPage}
          disabled={currentPage === totalPages}
          className={`${paginationTheme.pages.next.base} rounded-r-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Go to last page"
        >
          <HiChevronDoubleRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export { Pagination };
