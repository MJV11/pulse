'use client';

import { Card as FlowbiteCard, CardProps } from 'flowbite-react';

const cardTheme = {
  root: {
    base: 'flex rounded-md bg-silicongray-50 border border-silicongray-200 dark:border-silicongray-700 dark:bg-card-bg-primary p-0',
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
