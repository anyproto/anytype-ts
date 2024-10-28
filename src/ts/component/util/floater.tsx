import React, { useState, useEffect, ReactNode, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useElementMovement } from './useMovementObserver';

interface Props {
  children: ReactNode;
  anchorEl: HTMLElement | null;
  offset?: {
    x?: number;
    y?: number;
  };
}

export const Floater: React.FC<Props> = ({ 
  children, 
  anchorEl, 
  offset = { x: 0, y: 0 } 
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const onMove = () => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        top: rect.bottom,// + window.scrollY + (offset.y ?? 0),
        left: rect.left,// + window.scrollX + (offset.x ?? 0)
      });
    }
  };

  useElementMovement(anchorEl, onMove);

  return ReactDOM.createPortal(
    <div style={{
      position: 'absolute',
      top: `${position.top}px`,
      left: `${position.left}px`,
    }}>
      {children}
    </div>,
    document.body
  );
};
