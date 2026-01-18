import { useState } from 'react';
import { Trophy } from 'lucide-react';
import type { TicketWithRelations } from '../lib/database.types';
import { TicketCard } from './TicketCard';

interface DeliveryColumnProps {
  tickets: TicketWithRelations[];
  onDrop: (ticketId: string, newStatus: string) => void;
  onDragStart: (e: React.DragEvent, ticketId: string) => void;
  onDragEnd: () => void;
  onEdit: (ticket: TicketWithRelations) => void;
  onWonDrop: (ticketId: string) => void;
  draggedTicketId: string | null;
}

export function DeliveryColumn({
  tickets,
  onDrop,
  onDragStart,
  onDragEnd,
  onEdit,
  onWonDrop,
  draggedTicketId,
}: DeliveryColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isWonDragOver, setIsWonDragOver] = useState(false);

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
      onDrop(ticketId, 'delivery');
    }
  };

  const handleWonDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsWonDragOver(true);
  };

  const handleWonDragLeave = () => {
    setIsWonDragOver(false);
  };

  const handleWonDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsWonDragOver(false);
    const ticketId = e.dataTransfer.getData('ticketId');
    if (ticketId) {
      onWonDrop(ticketId);
    }
  };

  const showWonSection = draggedTicketId && tickets.some((t) => t.id === draggedTicketId);

  return (
    <div className="flex-1 min-w-[280px] max-w-[320px] flex flex-col">
      <div
        className={`flex-1 rounded-lg border-2 ${
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
        } transition-colors flex flex-col`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-4 border-b-2 border-cyan-400">
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center justify-between">
            Teslimat
            <span className="bg-white text-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold">
              {tickets.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 flex flex-col p-3 space-y-3 min-h-[200px]">
          <div className="flex-1 space-y-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onEdit={onEdit}
              />
            ))}
            {tickets.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">
                Bilet yok
              </div>
            )}
          </div>

          {/* Won Section - appears when dragging a ticket from delivery */}
          {showWonSection && (
            <div
              className={`mt-4 p-4 rounded-lg border-2 transition-all ${
                isWonDragOver
                  ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-lg'
                  : 'border-yellow-300 bg-gradient-to-r from-yellow-50/50 to-amber-50/50'
              }`}
              onDragOver={handleWonDragOver}
              onDragLeave={handleWonDragLeave}
              onDrop={handleWonDrop}
            >
              <div className="flex items-center gap-2 justify-center">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-bold text-yellow-700 text-sm uppercase tracking-wide">
                  Kazanıldı
                </span>
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-xs text-yellow-600 text-center mt-1">
                Buraya sürükleyin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
