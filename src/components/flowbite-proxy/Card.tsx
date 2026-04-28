'use client';

import { Card as FlowbiteCard, CardProps } from 'flowbite-react';

const cardTheme = {
  root: {
    base: 'flex rounded-md bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-card-bg-primary p-0',
  },
};

function Card({ children, ...props }: CardProps) {
  return (
    <FlowbiteCard theme={cardTheme} {...props}>
      {children}
    </FlowbiteCard>
  );
}

export { Card };
