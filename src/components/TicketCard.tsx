import { AlertCircle, Clock, Wrench } from 'lucide-react';
import type { TicketWithRelations } from '../lib/database.types';

interface TicketCardProps {
  ticket: TicketWithRelations;
  onDragStart: (e: React.DragEvent, ticketId: string) => void;
  onDragEnd?: () => void;
  onEdit: (ticket: TicketWithRelations) => void;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  medium: 'bg-blue-100 text-blue-700 border-blue-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  urgent: 'bg-red-100 text-red-700 border-red-300',
};

const priorityIcons = {
  low: Clock,
  medium: Clock,
  high: AlertCircle,
  urgent: AlertCircle,
};

const priorityLabels: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

export function TicketCard({ ticket, onDragStart, onDragEnd, onEdit }: TicketCardProps) {
  const PriorityIcon = priorityIcons[ticket.priority as keyof typeof priorityIcons] || Clock;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket.id)}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onEdit(ticket)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
          {ticket.title}
        </h3>
        <span
          className={`text-xs px-2 py-1 rounded-full border font-medium whitespace-nowrap ${
            priorityColors[ticket.priority as keyof typeof priorityColors]
          }`}
        >
          <PriorityIcon className="w-3 h-3 inline mr-1" />
          {priorityLabels[ticket.priority] || ticket.priority}
        </span>
      </div>

      {ticket.devices && (
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <Wrench className="w-3 h-3" />
          <span className="font-medium">{ticket.devices.device_type}</span>
          <span className="text-gray-400">•</span>
          <span>{ticket.devices.serial_number}</span>
        </div>
      )}

      {ticket.devices?.customer_name && (
        <div className="text-xs text-gray-500 mb-3">
          Müşteri: {ticket.devices.customer_name}
        </div>
      )}

      {ticket.technicians && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: ticket.technicians.avatar_color }}
          >
            {ticket.technicians.name.charAt(0)}
          </div>
          <span className="text-xs text-gray-700 font-medium">
            {ticket.technicians.name}
          </span>
        </div>
      )}
    </div>
  );
}
