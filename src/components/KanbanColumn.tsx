import { useState } from 'react';
import type { TicketWithRelations } from '../lib/database.types';
import { TicketCard } from './TicketCard';

interface KanbanColumnProps {
  title: string;
  status: string;
  tickets: TicketWithRelations[];
  onDrop: (ticketId: string, newStatus: string) => void;
  onDragStart: (e: React.DragEvent, ticketId: string) => void;
  onEdit: (ticket: TicketWithRelations) => void;
  onClearFromWon?: (ticketId: string) => void;
  color: string;
}

export function KanbanColumn({
  title,
  status,
  tickets,
  onDrop,
  onDragStart,
  onEdit,
  onClearFromWon,
  color,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const ticketId = e.dataTransfer.getData('ticketId');
    if (ticketId) {
      onDrop(ticketId, status);
    }
  };

  return (
    <div className="flex-1 min-w-[240px] max-w-[260px] sm:min-w-[280px] sm:max-w-[320px] shrink-0 snap-center">
      <div
        className={`rounded-lg border-2 ${
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
        } transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`p-3 sm:p-4 border-b-2 ${color}`}>
          <h2 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide flex items-center justify-between">
            {title}
            <span className="bg-white text-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold">
              {tickets.length}
            </span>
          </h2>
        </div>
        <div className="p-3 space-y-3 min-h-[200px]">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onDragStart={onDragStart}
              onEdit={onEdit}
              onClearFromWon={onClearFromWon}
            />
          ))}
          {tickets.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">
              Bilet yok
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
