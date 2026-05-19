import React from 'react';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ContainerProps {
  children: React.ReactNode;
  size?: ContainerSize;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

const maxWidths: Record<ContainerSize, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({
  children,
  size = 'lg',
  className = '',
  as: Tag = 'div',
}: ContainerProps) {
  return (
    <Tag
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidths[size]} ${className}`}
    >
      {children}
    </Tag>
  );
}
