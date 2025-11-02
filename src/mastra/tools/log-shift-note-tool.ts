import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Types for shift notes
export type ShiftType = 'day' | 'afternoon' | 'night';
export type NoteType = 'maintenance' | 'alert' | 'status' | 'general';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ShiftNote {
  id: string;
  timestamp: string;
  shift: ShiftType;
  unit: string;
  note: string;
  type: NoteType;
  priority: PriorityLevel;
  resolved: boolean;
}

// In-memory storage (will be replaced with LibSQL in production)
const shiftNotes: ShiftNote[] = [];

// Helper functions
function getCurrentShift(): ShiftType {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 14) return 'day';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'night';
}

function getNextHandoverTime(): string {
  const now = new Date();
  const hour = now.getHours();
  
  let nextHour: number;
  if (hour < 6) nextHour = 6;
  else if (hour < 14) nextHour = 14;
  else if (hour < 22) nextHour = 22;
  else nextHour = 6; // Next day
  
  const nextHandover = new Date(now);
  if (nextHour === 6 && hour >= 22) {
    nextHandover.setDate(nextHandover.getDate() + 1);
  }
  nextHandover.setHours(nextHour, 0, 0, 0);
  
  return nextHandover.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function extractUnitNumber(note: string): string {
  // Try to extract unit number from text
  const patterns = [
    /unit\s*(\d+)/i,
    /u(\d+)/i,
    /reactor\s*(\d+)/i,
    /pump\s*(\d+)/i,
    /tower\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = note.match(pattern);
    if (match) return match[1];
  }
  
  return 'General';
}

function categorizeNote(note: string): NoteType {
  const lowerNote = note.toLowerCase();
  
  // Check for alerts/warnings
  if (lowerNote.includes('alert') || 
      lowerNote.includes('warning') || 
      lowerNote.includes('spike') || 
      lowerNote.includes('urgent') ||
      lowerNote.includes('critical') ||
      lowerNote.includes('emergency')) {
    return 'alert';
  }
  
  // Check for maintenance
  if (lowerNote.includes('maintenance') || 
      lowerNote.includes('repair') || 
      lowerNote.includes('inspection') ||
      lowerNote.includes('cleaning') ||
      lowerNote.includes('service') ||
      lowerNote.includes('fix')) {
    return 'maintenance';
  }
  
  // Check for status updates
  if (lowerNote.includes('pressure') || 
      lowerNote.includes('temperature') || 
      lowerNote.includes('psi') ||
      lowerNote.includes('stable') ||
      lowerNote.includes('normal') ||
      lowerNote.includes('operating')) {
    return 'status';
  }
  
  return 'general';
}

function determinePriority(note: string, type: NoteType): PriorityLevel {
  const lowerNote = note.toLowerCase();
  
  // Critical keywords
  if (lowerNote.includes('critical') || 
      lowerNote.includes('emergency') ||
      lowerNote.includes('shutdown') ||
      lowerNote.includes('failure')) {
    return 'critical';
  }
  
  // High priority keywords
  if (lowerNote.includes('urgent') || 
      lowerNote.includes('immediate') ||
      lowerNote.includes('alert') ||
      type === 'alert') {
    return 'high';
  }
  
  // Medium priority
  if (type === 'maintenance' || lowerNote.includes('attention')) {
    return 'medium';
  }
  
  return 'low';
}

function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatShiftName(shift: ShiftType): string {
  return shift.charAt(0).toUpperCase() + shift.slice(1) + ' Shift';
}

function formatNoteType(type: NoteType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export const logShiftNoteTool = createTool({
  id: 'log-shift-note',
  description: 'Log a shift note with automatic categorization and unit extraction',
  inputSchema: z.object({
    note: z.string().describe('The shift note to log'),
    unit: z.string().optional().describe('The unit number (optional, will be extracted if not provided)'),
    type: z.enum(['maintenance', 'alert', 'status', 'general']).optional().describe('Note type (optional, will be categorized automatically)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    noteId: z.string(),
    shift: z.string(),
    unit: z.string(),
    type: z.string(),
    priority: z.string(),
    timestamp: z.string(),
    nextHandover: z.string(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { note, unit: providedUnit, type: providedType } = context;
    
    // Extract or use provided unit
    const unit = providedUnit || extractUnitNumber(note);
    
    // Categorize or use provided type
    const type = providedType || categorizeNote(note);
    
    // Determine priority
    const priority = determinePriority(note, type);
    
    // Get current shift
    const shift = getCurrentShift();
    
    // Create shift note
    const shiftNote: ShiftNote = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      shift,
      unit,
      note,
      type,
      priority,
      resolved: false,
    };
    
    // Store note (in-memory for now)
    shiftNotes.push(shiftNote);
    
    // Get next handover time
    const nextHandover = getNextHandoverTime();
    
    // Format response
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    return {
      success: true,
      noteId: shiftNote.id,
      shift: formatShiftName(shift),
      unit,
      type: formatNoteType(type),
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      timestamp: currentTime,
      nextHandover,
      message: `✓ Note logged for ${formatShiftName(shift)} (Unit ${unit})\nType: ${formatNoteType(type)}\nPriority: ${priority.charAt(0).toUpperCase() + priority.slice(1)}\nTime: ${currentTime}\nWill be included in next handover at ${nextHandover}`,
    };
  },
});

// Export notes array for use by other tools
export { shiftNotes };
