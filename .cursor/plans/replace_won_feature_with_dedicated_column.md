# Replace Won Feature with Dedicated Won Column

## Problem Analysis

The user wants to replace the existing "Won" drop zone (which appears within DeliveryColumn when dragging) with a dedicated "Won" column/card in the Kanban board. Currently:
- DeliveryColumn has a "Won" drop zone that appears when dragging a ticket
- When dropped into Won, tickets are marked as won but remain in delivery status
- The user wants a permanent "Won" column where won tickets appear

## Solution

### Approach
1. Add a "Won" column to the Kanban board (after Delivery column)
2. Replace DeliveryColumn with regular KanbanColumn (remove the Won drop zone)
3. Filter won tickets to display only in the Won column
4. Handle drops on Won column to mark tickets as won and trigger statistics update
5. Remove all Won-related logic from DeliveryColumn

### Implementation Steps

1. **Update columns array** in `KanbanBoard.tsx`:
   - Add a "Won" column entry: `{ title: 'Kazanıldı', status: 'won', color: 'border-yellow-400' }`
   - Note: We'll use a special status 'won' for filtering, but tickets keep their actual status

2. **Replace DeliveryColumn with KanbanColumn**:
   - Remove DeliveryColumn import and usage
   - Use KanbanColumn for delivery status (like other columns)
   - Remove onWonDrop, draggedTicketId props from delivery column

3. **Update handleDrop/executeMove logic**:
   - When a ticket is dropped on "won" column, mark it as won (set won=true, won_at timestamp)
   - Show money animation
   - Update statistics via callback
   - Tickets keep their delivery status but are filtered to won column by won=true

4. **Filter tickets for Won column**:
   - Won column shows tickets where `won === true` (regardless of status)
   - Delivery column shows tickets where `status === 'delivery' && won !== true`

5. **Remove Won-related code from DeliveryColumn**:
   - Remove onWonDrop prop
   - Remove draggedTicketId prop
   - Remove Won drop zone UI
   - Simplify DeliveryColumn to just be a regular column (or delete it if we use KanbanColumn)

6. **Clean up KanbanBoard**:
   - Remove handleWonDrop function (integrate logic into handleDrop)
   - Remove draggedTicketId state
   - Remove onWonDrop prop passing
   - Update handleDragStart/handleDragEnd if needed

## Files to Modify

- `src/components/KanbanBoard.tsx`: 
  - Add Won column
  - Replace DeliveryColumn with KanbanColumn
  - Update drop handling logic
  - Remove Won-specific handlers
  
- `src/components/DeliveryColumn.tsx`: 
  - Either simplify to remove Won logic OR delete entirely if we use KanbanColumn
  
- Potentially delete `src/components/DeliveryColumn.tsx` if not needed

## Key Considerations

- Won tickets should be visible only in the Won column
- Tickets in Won column keep their original status (delivery) but have won=true
- When dropped on Won, trigger money animation and statistics update
- Won column should accept drops from delivery column (or any column?)