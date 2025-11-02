import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { shiftNotes, ShiftNote, ShiftType } from './log-shift-note-tool';

function getPreviousShift(currentShift: ShiftType): ShiftType {
  switch (currentShift) {
    case 'day': return 'night';
    case 'afternoon': return 'day';
    case 'night': return 'afternoon';
  }
}

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

function formatNotesList(notes: ShiftNote[], includeUnit: boolean = true): string {
  if (notes.length === 0) return '• None reported';
  
  return notes
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(note => {
      const time = formatTimestamp(note.timestamp);
      const unitInfo = includeUnit ? `Unit ${note.unit}: ` : '';
      const priorityFlag = note.priority === 'critical' ? ' 🚨' : 
                          note.priority === 'high' ? ' ⚠️' : '';
      return `• ${unitInfo}${note.note}${priorityFlag}\n  (${time})`;
    })
    .join('\n');
}

function getUnresolvedNotes(notes: ShiftNote[]): ShiftNote[] {
  return notes.filter(note => 
    !note.resolved && 
    (note.type === 'maintenance' || note.type === 'alert')
  );
}

export const getPreviousShiftReportTool = createTool({
  id: 'get-previous-shift-report',
  description: 'Get the previous shift handover report with all notes and pending items',
  inputSchema: z.object({
    shift: z.enum(['day', 'afternoon', 'night']).optional().describe('Specific shift to retrieve (default: previous shift)'),
  }),
  outputSchema: z.object({
    shift: z.string(),
    timeRange: z.string(),
    totalNotes: z.number(),
    maintenanceCount: z.number(),
    alertCount: z.number(),
    statusCount: z.number(),
    unresolvedCount: z.number(),
    formattedReport: z.string(),
  }),
  execute: async ({ context }) => {
    const currentShift = getCurrentShift();
    const targetShift = context.shift || getPreviousShift(currentShift);
    
    // Get notes from the previous shift
    const previousShiftNotes = shiftNotes.filter(note => note.shift === targetShift);
    
    // Group notes by type
    const grouped = groupNotesByType(previousShiftNotes);
    
    // Get unresolved items
    const unresolved = getUnresolvedNotes(previousShiftNotes);
    
    // Build formatted report
    let report = `🔄 SHIFT HANDOVER REPORT\n`;
    report += `From: ${formatShiftName(targetShift)} (${getShiftTimeRange(targetShift)})\n`;
    report += `To: ${formatShiftName(currentShift)} (${getShiftTimeRange(currentShift)})\n`;
    report += `Date: ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}\n\n`;
    report += `═══════════════════════════════════\n\n`;
    
    // Maintenance section
    report += `🔧 MAINTENANCE ACTIVITIES:\n`;
    if (grouped.maintenance.length > 0) {
      report += formatNotesList(grouped.maintenance) + '\n\n';
    } else {
      report += '• No maintenance activities reported\n\n';
    }
    
    // Alerts section
    report += `⚠️ ALERTS & WARNINGS:\n`;
    if (grouped.alerts.length > 0) {
      report += formatNotesList(grouped.alerts) + '\n\n';
    } else {
      report += '• No alerts reported\n\n';
    }
    
    // Status updates section
    report += `📊 STATUS UPDATES:\n`;
    if (grouped.status.length > 0) {
      report += formatNotesList(grouped.status) + '\n\n';
    } else {
      report += '• No status updates reported\n\n';
    }
    
    // General notes if any
    if (grouped.general.length > 0) {
      report += `📋 GENERAL NOTES:\n`;
      report += formatNotesList(grouped.general) + '\n\n';
    }
    
    // Pending action items
    report += `⏭️ PENDING FOR ${formatShiftName(currentShift).toUpperCase()}:\n`;
    if (unresolved.length > 0) {
      unresolved.forEach(note => {
        const action = note.type === 'maintenance' ? '🔧' : '⚠️';
        report += `${action} Unit ${note.unit}: ${note.note}\n`;
      });
      report += '\n';
    } else {
      report += '• No pending items\n\n';
    }
    
    // Summary
    report += `═══════════════════════════════════\n`;
    report += `📋 SUMMARY:\n`;
    report += `• Total notes logged: ${previousShiftNotes.length}\n`;
    report += `• Maintenance: ${grouped.maintenance.length} | Alerts: ${grouped.alerts.length} | Status: ${grouped.status.length}\n`;
    report += `• Unresolved items: ${unresolved.length}\n`;
    
    if (previousShiftNotes.length === 0) {
      report = `🔄 PREVIOUS SHIFT REPORT\n\n`;
      report += `No notes were logged for ${formatShiftName(targetShift)}.\n`;
      report += `This could mean:\n`;
      report += `• The shift was uneventful (all systems normal)\n`;
      report += `• Notes weren't logged in the system\n\n`;
      report += `Current Shift: ${formatShiftName(currentShift)} (${getShiftTimeRange(currentShift)})`;
    }
    
    return {
      shift: formatShiftName(targetShift),
      timeRange: getShiftTimeRange(targetShift),
      totalNotes: previousShiftNotes.length,
      maintenanceCount: grouped.maintenance.length,
      alertCount: grouped.alerts.length,
      statusCount: grouped.status.length,
      unresolvedCount: unresolved.length,
      formattedReport: report,
    };
  },
});
