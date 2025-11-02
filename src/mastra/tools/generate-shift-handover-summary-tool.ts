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

function getNextShift(currentShift: ShiftType): ShiftType {
  switch (currentShift) {
    case 'day': return 'afternoon';
    case 'afternoon': return 'night';
    case 'night': return 'day';
  }
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
  if (notes.length === 0) return '• None reported';
  
  return notes
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(note => {
      const time = formatTimestamp(note.timestamp);
      const priorityFlag = note.priority === 'critical' ? ' 🚨' : 
                          note.priority === 'high' ? ' ⚠️' : '';
      return `• Unit ${note.unit}: ${note.note}${priorityFlag}\n  (Logged: ${time})`;
    })
    .join('\n');
}

function getUnresolvedNotes(notes: ShiftNote[]): ShiftNote[] {
  return notes.filter(note => 
    !note.resolved && 
    (note.type === 'maintenance' || note.type === 'alert' || note.priority === 'high' || note.priority === 'critical')
  );
}

function getShiftEmoji(shift: ShiftType): string {
  switch (shift) {
    case 'day': return '☀️';
    case 'afternoon': return '🌆';
    case 'night': return '🌙';
  }
}

export const generateShiftHandoverSummaryTool = createTool({
  id: 'generate-shift-handover-summary',
  description: 'Generate a comprehensive shift handover summary for automatic posting at shift change times',
  inputSchema: z.object({
    shift: z.enum(['day', 'afternoon', 'night']).optional().describe('The shift to generate summary for (default: current shift)'),
  }),
  outputSchema: z.object({
    fromShift: z.string(),
    toShift: z.string(),
    totalNotes: z.number(),
    maintenanceCount: z.number(),
    alertCount: z.number(),
    statusCount: z.number(),
    unresolvedCount: z.number(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const currentShift = context.shift || getCurrentShift();
    const nextShift = getNextShift(currentShift);
    
    // Get all notes from current shift
    const shiftNotesFiltered = shiftNotes.filter(note => note.shift === currentShift);
    
    // Group notes by type
    const grouped = groupNotesByType(shiftNotesFiltered);
    
    // Get unresolved items for next shift
    const unresolved = getUnresolvedNotes(shiftNotesFiltered);
    
    // Build comprehensive handover summary
    let summary = `${getShiftEmoji(currentShift)} SHIFT HANDOVER SUMMARY\n`;
    summary += `═══════════════════════════════════\n`;
    summary += `From: ${formatShiftName(currentShift)} (${getShiftTimeRange(currentShift)})\n`;
    summary += `To: ${formatShiftName(nextShift)} (${getShiftTimeRange(nextShift)})\n`;
    summary += `Date: ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })}\n`;
    summary += `Time: ${new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}\n\n`;
    summary += `═══════════════════════════════════\n\n`;
    
    // Maintenance activities
    summary += `🔧 MAINTENANCE ACTIVITIES:\n`;
    if (grouped.maintenance.length > 0) {
      summary += formatNotesList(grouped.maintenance) + '\n\n';
    } else {
      summary += '• No maintenance activities during this shift\n\n';
    }
    
    // Alerts & warnings
    summary += `⚠️ ALERTS & WARNINGS:\n`;
    if (grouped.alerts.length > 0) {
      summary += formatNotesList(grouped.alerts) + '\n\n';
    } else {
      summary += '• No alerts reported - all systems normal\n\n';
    }
    
    // Status updates
    summary += `📊 STATUS UPDATES:\n`;
    if (grouped.status.length > 0) {
      summary += formatNotesList(grouped.status) + '\n\n';
    } else {
      summary += '• No specific status updates logged\n\n';
    }
    
    // General notes if any
    if (grouped.general.length > 0) {
      summary += `📋 GENERAL NOTES:\n`;
      summary += formatNotesList(grouped.general) + '\n\n';
    }
    
    // Action items for next shift
    summary += `⏭️ ACTION ITEMS FOR ${formatShiftName(nextShift).toUpperCase()}:\n`;
    if (unresolved.length > 0) {
      unresolved.forEach(note => {
        const emoji = note.type === 'maintenance' ? '🔧' : 
                     note.type === 'alert' ? '⚠️' : '📋';
        const priorityNote = note.priority === 'critical' ? ' [CRITICAL]' : 
                           note.priority === 'high' ? ' [HIGH PRIORITY]' : '';
        summary += `${emoji} Unit ${note.unit}: ${note.note}${priorityNote}\n`;
      });
      summary += '\n';
    } else {
      summary += '• No pending action items - routine operations\n\n';
    }
    
    // Summary statistics
    summary += `═══════════════════════════════════\n`;
    summary += `📊 SHIFT STATISTICS:\n`;
    summary += `• Total notes logged: ${shiftNotesFiltered.length}\n`;
    summary += `• Breakdown:\n`;
    summary += `  - 🔧 Maintenance: ${grouped.maintenance.length}\n`;
    summary += `  - ⚠️ Alerts: ${grouped.alerts.length}\n`;
    summary += `  - 📊 Status Updates: ${grouped.status.length}\n`;
    summary += `  - 📋 General: ${grouped.general.length}\n`;
    summary += `• Pending for next shift: ${unresolved.length}\n\n`;
    
    summary += `═══════════════════════════════════\n`;
    summary += `\n✅ Handover complete. Stay safe! 🛡️\n`;
    summary += `${formatShiftName(nextShift)} team, you're good to go! 👍`;
    
    // Handle case with no notes
    if (shiftNotesFiltered.length === 0) {
      summary = `${getShiftEmoji(currentShift)} SHIFT HANDOVER SUMMARY\n`;
      summary += `═══════════════════════════════════\n`;
      summary += `From: ${formatShiftName(currentShift)} (${getShiftTimeRange(currentShift)})\n`;
      summary += `To: ${formatShiftName(nextShift)} (${getShiftTimeRange(nextShift)})\n`;
      summary += `Date: ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      })}\n\n`;
      summary += `═══════════════════════════════════\n\n`;
      summary += `✅ QUIET SHIFT - ALL SYSTEMS NORMAL\n\n`;
      summary += `No specific notes were logged during ${formatShiftName(currentShift)}.\n`;
      summary += `All units operating within normal parameters.\n`;
      summary += `No maintenance, alerts, or status changes to report.\n\n`;
      summary += `⏭️ No pending action items for ${formatShiftName(nextShift)}.\n\n`;
      summary += `═══════════════════════════════════\n`;
      summary += `\n✅ Handover complete. Stay safe! 🛡️\n`;
      summary += `${formatShiftName(nextShift)} team, you're good to go! 👍`;
    }
    
    return {
      fromShift: formatShiftName(currentShift),
      toShift: formatShiftName(nextShift),
      totalNotes: shiftNotesFiltered.length,
      maintenanceCount: grouped.maintenance.length,
      alertCount: grouped.alerts.length,
      statusCount: grouped.status.length,
      unresolvedCount: unresolved.length,
      summary,
    };
  },
});
