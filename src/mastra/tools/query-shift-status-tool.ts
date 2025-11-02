import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { shiftNotes, ShiftNote, ShiftType } from './log-shift-note-tool';

function getCurrentShift(): ShiftType {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 14) return 'day';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'night';
}

function formatShiftName(shift: ShiftType): string {
  return shift.charAt(0).toUpperCase() + shift.slice(1) + ' Shift';
}

function getShiftTimeRange(shift: ShiftType): string {
  switch (shift) {
    case 'day': return '6:00 AM - 2:00 PM';
    case 'afternoon': return '2:00 PM - 10:00 PM';
    case 'night': return '10:00 PM - 6:00 AM';
  }
}

function formatTimestamp(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function groupNotesByType(notes: ShiftNote[]) {
  const maintenance = notes.filter(n => n.type === 'maintenance');
  const alerts = notes.filter(n => n.type === 'alert');
  const status = notes.filter(n => n.type === 'status');
  const general = notes.filter(n => n.type === 'general');
  
  return { maintenance, alerts, status, general };
}

function formatNotesList(notes: ShiftNote[]): string {
  if (notes.length === 0) return '• None';
  
  return notes
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(note => {
      const time = formatTimestamp(note.timestamp);
      const priorityFlag = note.priority === 'critical' ? ' 🚨' : 
                          note.priority === 'high' ? ' ⚠️' : '';
      return `• ${note.note}${priorityFlag}\n  (Unit ${note.unit}, ${time})`;
    })
    .join('\n');
}

export const queryShiftStatusTool = createTool({
  id: 'query-shift-status',
  description: 'Query current shift status, optionally filtered by unit number or note type',
  inputSchema: z.object({
    unit: z.string().optional().describe('Filter by unit number (e.g., "5" or "Unit 5")'),
    type: z.enum(['maintenance', 'alert', 'status', 'general', 'all']).optional().describe('Filter by note type'),
    showAll: z.boolean().optional().describe('Show all notes or just current shift (default: current shift only)'),
  }),
  outputSchema: z.object({
    shift: z.string(),
    timeRange: z.string(),
    totalNotes: z.number(),
    maintenanceCount: z.number(),
    alertCount: z.number(),
    statusCount: z.number(),
    formattedSummary: z.string(),
  }),
  execute: async ({ context }) => {
    const { unit: filterUnit, type: filterType, showAll } = context;
    
    const currentShift = getCurrentShift();
    
    // Filter notes
    let filteredNotes = showAll 
      ? [...shiftNotes]
      : shiftNotes.filter(note => note.shift === currentShift);
    
    // Apply unit filter
    if (filterUnit) {
      const unitNum = filterUnit.replace(/[^\d]/g, ''); // Extract just the number
      filteredNotes = filteredNotes.filter(note => 
        note.unit === unitNum || note.unit === filterUnit
      );
    }
    
    // Apply type filter
    if (filterType && filterType !== 'all') {
      filteredNotes = filteredNotes.filter(note => note.type === filterType);
    }
    
    // Group notes by type
    const grouped = groupNotesByType(filteredNotes);
    
    // Build formatted summary
    let summary = `Current Shift: ${formatShiftName(currentShift)} (${getShiftTimeRange(currentShift)})\n`;
    
    if (filterUnit) {
      summary += `Filtering by: Unit ${filterUnit.replace(/[^\d]/g, '')}\n`;
    }
    if (filterType && filterType !== 'all') {
      summary += `Filtering by: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} notes\n`;
    }
    
    summary += `\n═══════════════════════════════════\n\n`;
    
    // Add maintenance section
    summary += `🔧 MAINTENANCE:\n${formatNotesList(grouped.maintenance)}\n\n`;
    
    // Add alerts section
    summary += `⚠️ ALERTS:\n${formatNotesList(grouped.alerts)}\n\n`;
    
    // Add status section
    summary += `📊 STATUS UPDATES:\n${formatNotesList(grouped.status)}\n\n`;
    
    // Add general section if any
    if (grouped.general.length > 0) {
      summary += `📋 GENERAL NOTES:\n${formatNotesList(grouped.general)}\n\n`;
    }
    
    // Summary statistics
    summary += `═══════════════════════════════════\n`;
    summary += `📊 Total Notes: ${filteredNotes.length}\n`;
    summary += `🔧 Maintenance: ${grouped.maintenance.length} | ⚠️ Alerts: ${grouped.alerts.length} | 📊 Status: ${grouped.status.length}`;
    
    if (filteredNotes.length === 0) {
      summary = `Current Shift: ${formatShiftName(currentShift)} (${getShiftTimeRange(currentShift)})\n\n`;
      if (filterUnit) {
        summary += `No notes found for Unit ${filterUnit.replace(/[^\d]/g, '')} in the current shift.\n`;
      } else {
        summary += `No notes logged for the current shift yet.\n`;
      }
      summary += `\nYou can log notes using: "Log: [your note]"`;
    }
    
    return {
      shift: formatShiftName(currentShift),
      timeRange: getShiftTimeRange(currentShift),
      totalNotes: filteredNotes.length,
      maintenanceCount: grouped.maintenance.length,
      alertCount: grouped.alerts.length,
      statusCount: grouped.status.length,
      formattedSummary: summary,
    };
  },
});
