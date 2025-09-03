// hooks/useDropdownMenu.ts
import { useRef, useState, useEffect, useLayoutEffect } from "react";

interface Position {
  top: number;
  left: number;
}

export function useDropdownMenu(triggerRef: React.RefObject<HTMLElement>) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  // Tính vị trí dropdown
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.right + 8, // lệch phải 8px
      });
    }
  }, [isOpen, triggerRef]);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return {
    isOpen,
    setIsOpen,
    position,
    menuRef,
  };
}
