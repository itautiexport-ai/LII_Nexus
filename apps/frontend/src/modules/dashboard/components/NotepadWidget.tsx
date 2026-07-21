import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import "./NotepadWidget.css";

export default function NotepadWidget() {
  const user = useAuthStore((s) => s.user);
  
  const [content, setContent] = useState("");
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 340, 
    y: window.innerHeight - 420 
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, startPosX: number, startPosY: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`lii-nexus-notepad-${user.id}`);
    if (stored) setContent(stored);
  }, [user]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    if (user) {
      localStorage.setItem(`lii-nexus-notepad-${user.id}`, val);
    }
  }

  // --- Dragging logic for floating window ---
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.startPosX + dx,
      y: Math.max(0, dragRef.current.startPosY + dy) // prevent dragging above top
    });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  return (
    <div 
      className={`notepad-widget ${isDragging ? 'dragging' : ''}`}
      style={{ left: position.x, top: position.y }}
    >
      <div 
        className="notepad-header"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Drag around screen"
      >
        <span className="notepad-title">📝 My Notes</span>
      </div>
      <div className="notepad-body">
        <textarea 
          value={content}
          onChange={handleChange}
          placeholder="Jot down your notes here... They are automatically saved."
          className="notepad-textarea"
        />
      </div>
    </div>
  );
}
