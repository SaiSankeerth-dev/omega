import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
}

export function VisuallyHidden({
  children,
  as: Tag = 'span',
}: VisuallyHiddenProps) {
  return (
    <Tag
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {children}
    </Tag>
  );
}
