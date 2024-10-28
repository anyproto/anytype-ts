import React, { useState, useEffect, ReactNode, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useElementMovement } from './useMovementObserver';

interface Props {
  children: ReactNode;
  anchorEl: HTMLElement | null;
  anchorTo?: 'top' | 'bottom';
  offset?: {
    x?: number;
    y?: number;
  };
}

export const Floater: React.FC<Props> = ({ 
  children, 
  anchorEl, 
  anchorTo = 'bottom',
  offset = { x: 0, y: 0 },
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const onMove = () => {
    if (anchorEl && ref.current) {
      const anchorElRect = anchorEl.getBoundingClientRect();
      const floaterElRect = ref.current.getBoundingClientRect();
      if (anchorTo === 'top') {
        setPosition({
          top: anchorElRect.top - floaterElRect.height + offset.y,
          left: anchorElRect.left + anchorElRect.width / 2 - floaterElRect.width / 2 + offset.x,
        });
      } else {
        setPosition({
          top: anchorElRect.bottom + offset.y,
          left: anchorElRect.left + anchorElRect.width / 2 - floaterElRect.width / 2 + offset.x,
        });
      }
    }
  };

  useElementMovement(anchorEl, onMove);

  useEffect(() => {
    onMove();
  }, [anchorEl, ref.current]);

  return ReactDOM.createPortal(
    <div 
      ref={ref}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 4,
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}>
      {children}
    </div>,
    document.body
  );
};
