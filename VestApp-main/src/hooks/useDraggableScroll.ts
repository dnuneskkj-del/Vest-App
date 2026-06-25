import React, { useRef, useState } from 'react';

export function useDraggableScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    ref.current.style.cursor = 'grabbing';
    ref.current.style.userSelect = 'none';
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
    if (ref.current) {
      ref.current.style.cursor = 'grab';
      ref.current.style.userSelect = 'auto';
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    if (ref.current) {
      ref.current.style.cursor = 'grab';
      ref.current.style.userSelect = 'auto';
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
    style: { cursor: 'grab' } as React.CSSProperties
  };
}
