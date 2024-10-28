import React, { useState, useEffect, ReactNode, useRef } from 'react';
import ReactDOM from 'react-dom';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

class ElementMovementObserver {
  private observer: MutationObserver;
  private element: HTMLElement;
  private lastPosition: Position;
  private onMove: (position: Position) => void;

  constructor(element: HTMLElement, callback: (position: Position) => void) {
    this.element = element;
    this.onMove = callback;
    this.lastPosition = this.getPosition();

    // Create observer instance
    this.observer = new MutationObserver(() => {
      this.checkForMovement();
    });

    // Start observing
    this.startObserving();
  }

  private getPosition(): Position {
    const rect = this.element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  }

  private checkForMovement(): void {
    const currentPosition = this.getPosition();

    if (this.hasPositionChanged(currentPosition)) {
      this.lastPosition = currentPosition;
      this.onMove(currentPosition);
    }
  }

  private hasPositionChanged(currentPosition: Position): boolean {
    return (
      currentPosition.x !== this.lastPosition.x ||
      currentPosition.y !== this.lastPosition.y ||
      currentPosition.width !== this.lastPosition.width ||
      currentPosition.height !== this.lastPosition.height
    );
  }

  private startObserving(): void {
    // Configure observer options
    const config: MutationObserverInit = {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true
    };

    // Start observing the element and its descendants
    this.observer.observe(this.element, config);

    // Also observe the document body for layout changes
    this.observer.observe(document.body, config);

    // Optional: Add resize observer for size changes
    const resizeObserver = new ResizeObserver(() => {
      this.checkForMovement();
    });
    resizeObserver.observe(this.element);

    // Optional: Add scroll listener
    window.addEventListener('scroll', () => {
      this.checkForMovement();
    });
  }

  public disconnect(): void {
    this.observer.disconnect();
  }
}

export function useElementMovement(
  element: HTMLElement | null,
  callback: (position: Position) => void
) {
  useEffect(() => {
    if (!element) return;

    const movementObserver = new ElementMovementObserver(element, callback);

    return () => {
      movementObserver.disconnect();
    };
  }, [element, callback]);
}