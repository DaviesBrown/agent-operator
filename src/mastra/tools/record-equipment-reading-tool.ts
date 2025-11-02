import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ShiftType } from './log-shift-note-tool';

// Equipment types
export type EquipmentType = 'pump' | 'finfan' | 'heater' | 'compressor' | 'reactor' | 'tower' | 'exchanger' | 'valve';

// Parameter types
export type ParameterType = 'pressure' | 'temperature' | 'flow_rate' | 'vibration' | 'rpm' | 'current' | 'voltage' | 'level';

export interface EquipmentReading {
  id: string;
  timestamp: string;
  shift: ShiftType;
  equipmentId: string;
  equipmentType: EquipmentType;
  unit: string;
  parameter: ParameterType;
  value: number;
  uom: string; // Unit of measurement (PSI, °C, RPM, etc.)
  normalMin: number;
  normalMax: number;
  criticalMin: number;
  criticalMax: number;
  status: 'normal' | 'warning' | 'critical';
  deviation: number; // Percentage deviation from normal range
  operator?: string;
}

// In-memory storage for equipment readings
const equipmentReadings: EquipmentReading[] = [];

// Equipment-specific custom ranges (configured per equipment ID)
// Example: equipmentCustomRanges['P-101-pressure'] = { min: 100, max: 140, criticalMin: 80, criticalMax: 160, uom: 'PSI' }
const equipmentCustomRanges: Record<string, { min: number; max: number; criticalMin: number; criticalMax: number; uom: string }> = {};

// Normal ranges for common equipment parameters (used as defaults if no custom range is set)
const defaultRanges: Record<string, { min: number; max: number; criticalMin: number; criticalMax: number; uom: string }> = {
  // Pumps
  'pump-pressure': { min: 50, max: 150, criticalMin: 30, criticalMax: 180, uom: 'PSI' },
  'pump-flow': { min: 100, max: 500, criticalMin: 50, criticalMax: 600, uom: 'GPM' },
  'pump-temperature': { min: 20, max: 80, criticalMin: 10, criticalMax: 100, uom: '°C' },
  'pump-vibration': { min: 0, max: 5, criticalMin: 0, criticalMax: 10, uom: 'mm/s' },
  'pump-current': { min: 10, max: 50, criticalMin: 5, criticalMax: 60, uom: 'A' },
  
  // Compressors
  'compressor-pressure': { min: 100, max: 300, criticalMin: 80, criticalMax: 350, uom: 'PSI' },
  'compressor-temperature': { min: 40, max: 120, criticalMin: 20, criticalMax: 150, uom: '°C' },
  'compressor-vibration': { min: 0, max: 7, criticalMin: 0, criticalMax: 12, uom: 'mm/s' },
  'compressor-rpm': { min: 1000, max: 3000, criticalMin: 800, criticalMax: 3500, uom: 'RPM' },
  
  // Heaters
  'heater-temperature': { min: 200, max: 500, criticalMin: 150, criticalMax: 600, uom: '°C' },
  'heater-pressure': { min: 50, max: 200, criticalMin: 30, criticalMax: 250, uom: 'PSI' },
  'heater-flow': { min: 50, max: 300, criticalMin: 30, criticalMax: 400, uom: 'GPM' },
  
  // Finfans (Air Coolers)
  'finfan-temperature': { min: 30, max: 80, criticalMin: 20, criticalMax: 100, uom: '°C' },
  'finfan-pressure': { min: 20, max: 100, criticalMin: 10, criticalMax: 120, uom: 'PSI' },
  'finfan-rpm': { min: 500, max: 1500, criticalMin: 400, criticalMax: 1800, uom: 'RPM' },
  
  // Reactors
  'reactor-pressure': { min: 100, max: 500, criticalMin: 80, criticalMax: 600, uom: 'PSI' },
  'reactor-temperature': { min: 150, max: 400, criticalMin: 100, criticalMax: 500, uom: '°C' },
  'reactor-level': { min: 30, max: 90, criticalMin: 10, criticalMax: 95, uom: '%' },
  
  // Towers
  'tower-pressure': { min: 20, max: 150, criticalMin: 10, criticalMax: 180, uom: 'PSI' },
  'tower-temperature': { min: 80, max: 250, criticalMin: 50, criticalMax: 300, uom: '°C' },
  'tower-level': { min: 40, max: 85, criticalMin: 20, criticalMax: 95, uom: '%' },
  
  // Exchangers
  'exchanger-temperature': { min: 40, max: 150, criticalMin: 20, criticalMax: 180, uom: '°C' },
  'exchanger-pressure': { min: 30, max: 120, criticalMin: 20, criticalMax: 150, uom: 'PSI' },
  'exchanger-flow': { min: 100, max: 400, criticalMin: 50, criticalMax: 500, uom: 'GPM' },
};

function getCurrentShift(): ShiftType {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 14) return 'day';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'night';
}

function generateReadingId(): string {
  return `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getRangeKey(equipmentType: EquipmentType, parameter: ParameterType): string {
  return `${equipmentType}-${parameter}`;
}

function getEquipmentRangeKey(equipmentId: string, parameter: ParameterType): string {
  return `${equipmentId}-${parameter}`;
}

function getDefaultRange(equipmentType: EquipmentType, parameter: ParameterType) {
  const key = getRangeKey(equipmentType, parameter);
  return defaultRanges[key] || { min: 0, max: 100, criticalMin: 0, criticalMax: 150, uom: 'units' };
}

function getEquipmentRange(equipmentId: string, equipmentType: EquipmentType, parameter: ParameterType) {
  // First check if this specific equipment has custom ranges configured
  const customKey = getEquipmentRangeKey(equipmentId, parameter);
  if (equipmentCustomRanges[customKey]) {
    return equipmentCustomRanges[customKey];
  }
  
  // Fall back to default ranges for this equipment type
  return getDefaultRange(equipmentType, parameter);
}

// Function to set custom range for specific equipment
export function setEquipmentRange(
  equipmentId: string, 
  parameter: ParameterType, 
  ranges: { min: number; max: number; criticalMin: number; criticalMax: number; uom: string }
): void {
  const key = getEquipmentRangeKey(equipmentId, parameter);
  equipmentCustomRanges[key] = ranges;
}

// Function to get all custom ranges (for management/configuration)
export function getCustomRanges(): Record<string, { min: number; max: number; criticalMin: number; criticalMax: number; uom: string }> {
  return { ...equipmentCustomRanges };
}

function calculateStatus(value: number, normalMin: number, normalMax: number, criticalMin: number, criticalMax: number): 'normal' | 'warning' | 'critical' {
  if (value < criticalMin || value > criticalMax) return 'critical';
  if (value < normalMin || value > normalMax) return 'warning';
  return 'normal';
}

function calculateDeviation(value: number, normalMin: number, normalMax: number): number {
  const normalMid = (normalMin + normalMax) / 2;
  const normalRange = normalMax - normalMin;
  const deviation = Math.abs(value - normalMid) / normalRange * 100;
  return Math.round(deviation * 10) / 10;
}

function analyzeReadingHistory(equipmentId: string, parameter: ParameterType, currentValue: number): string {
  // Get last 10 readings for this equipment and parameter
  const history = equipmentReadings
    .filter(r => r.equipmentId === equipmentId && r.parameter === parameter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
  
  if (history.length < 3) {
    return 'Insufficient historical data for trend analysis.';
  }
  
  // Calculate trend
  const recent = history.slice(0, 3);
  const older = history.slice(3, 6);
  
  const recentAvg = recent.reduce((sum, r) => sum + r.value, 0) / recent.length;
  const olderAvg = older.reduce((sum, r) => sum + r.value, 0) / older.length;
  
  const trend = ((recentAvg - olderAvg) / olderAvg * 100);
  
  let analysis = `\n📊 TREND ANALYSIS:\n`;
  analysis += `• Recent average: ${recentAvg.toFixed(2)}\n`;
  analysis += `• Previous average: ${olderAvg.toFixed(2)}\n`;
  
  if (Math.abs(trend) < 5) {
    analysis += `• Trend: Stable (${trend > 0 ? '+' : ''}${trend.toFixed(1)}%)\n`;
  } else if (trend > 5) {
    analysis += `• Trend: ⬆️ Increasing (${trend.toFixed(1)}%)\n`;
    analysis += `• ⚠️ Consider monitoring - upward trend detected\n`;
  } else {
    analysis += `• Trend: ⬇️ Decreasing (${trend.toFixed(1)}%)\n`;
    analysis += `• ⚠️ Consider monitoring - downward trend detected\n`;
  }
  
  // Check for warning/critical readings in history
  const warnings = history.filter(r => r.status === 'warning').length;
  const criticals = history.filter(r => r.status === 'critical').length;
  
  if (criticals > 0) {
    analysis += `• 🚨 ${criticals} critical reading(s) in last 10 entries\n`;
    analysis += `• 🔧 RECOMMEND: Schedule immediate inspection\n`;
  } else if (warnings > 2) {
    analysis += `• ⚠️ ${warnings} warning reading(s) in last 10 entries\n`;
    analysis += `• 🔧 RECOMMEND: Schedule preventive maintenance\n`;
  }
  
  return analysis;
}

export const recordEquipmentReadingTool = createTool({
  id: 'record-equipment-reading',
  description: 'Record equipment parameter readings and track deviations for predictive maintenance',
  inputSchema: z.object({
    equipmentId: z.string().describe('Equipment identifier (e.g., "P-101", "C-205", "H-301")'),
    equipmentType: z.enum(['pump', 'finfan', 'heater', 'compressor', 'reactor', 'tower', 'exchanger', 'valve']).describe('Type of equipment'),
    unit: z.string().describe('Unit number where equipment is located'),
    parameter: z.enum(['pressure', 'temperature', 'flow_rate', 'vibration', 'rpm', 'current', 'voltage', 'level']).describe('Parameter being measured'),
    value: z.number().describe('Reading value'),
    uom: z.string().optional().describe('Unit of measurement (optional, will use default if not provided)'),
    normalMin: z.number().optional().describe('Normal minimum value (optional, will use default if not provided)'),
    normalMax: z.number().optional().describe('Normal maximum value (optional, will use default if not provided)'),
    operator: z.string().optional().describe('Operator name (optional)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    readingId: z.string(),
    status: z.string(),
    deviation: z.number(),
    message: z.string(),
    recommendation: z.string(),
    trendAnalysis: z.string(),
  }),
  execute: async ({ context }) => {
    const { equipmentId, equipmentType, unit, parameter, value, uom, normalMin, normalMax, operator } = context;
    
    // Get range for this specific equipment (custom if configured, otherwise default)
    const equipmentRange = getEquipmentRange(equipmentId, equipmentType, parameter);
    
    const finalUom = uom || equipmentRange.uom;
    const finalNormalMin = normalMin ?? equipmentRange.min;
    const finalNormalMax = normalMax ?? equipmentRange.max;
    const finalCriticalMin = equipmentRange.criticalMin;
    const finalCriticalMax = equipmentRange.criticalMax;
    
    // If custom ranges were provided in this call, save them for future use
    if (normalMin !== undefined && normalMax !== undefined) {
      setEquipmentRange(equipmentId, parameter, {
        min: normalMin,
        max: normalMax,
        criticalMin: finalCriticalMin,
        criticalMax: finalCriticalMax,
        uom: finalUom
      });
    }
    
    // Calculate status and deviation
    const status = calculateStatus(value, finalNormalMin, finalNormalMax, finalCriticalMin, finalCriticalMax);
    const deviation = calculateDeviation(value, finalNormalMin, finalNormalMax);
    
    // Create reading record
    const reading: EquipmentReading = {
      id: generateReadingId(),
      timestamp: new Date().toISOString(),
      shift: getCurrentShift(),
      equipmentId,
      equipmentType,
      unit,
      parameter,
      value,
      uom: finalUom,
      normalMin: finalNormalMin,
      normalMax: finalNormalMax,
      criticalMin: finalCriticalMin,
      criticalMax: finalCriticalMax,
      status,
      deviation,
      operator,
    };
    
    // Store reading
    equipmentReadings.push(reading);
    
    // Analyze trend
    const trendAnalysis = analyzeReadingHistory(equipmentId, parameter, value);
    
    // Generate recommendation
    let recommendation = '';
    if (status === 'critical') {
      recommendation = '🚨 CRITICAL: Immediate action required. Inspect equipment and consider shutdown if unsafe.';
    } else if (status === 'warning') {
      recommendation = '⚠️ WARNING: Parameter outside normal range. Monitor closely and schedule inspection.';
    } else if (deviation > 50) {
      recommendation = '📋 NOTICE: Reading is within limits but showing significant deviation. Continue monitoring.';
    } else {
      recommendation = '✅ NORMAL: Equipment operating within normal parameters.';
    }
    
    // Format response message
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    const shiftName = getCurrentShift().charAt(0).toUpperCase() + getCurrentShift().slice(1) + ' Shift';
    
    let message = `✓ Reading Recorded - ${shiftName}\n\n`;
    message += `📍 EQUIPMENT: ${equipmentId} (${equipmentType.toUpperCase()})\n`;
    message += `📊 PARAMETER: ${parameter.toUpperCase().replace('_', ' ')}\n`;
    message += `📈 VALUE: ${value} ${finalUom}\n`;
    message += `🎯 NORMAL RANGE: ${finalNormalMin} - ${finalNormalMax} ${finalUom}\n`;
    message += `⚠️ CRITICAL RANGE: ${finalCriticalMin} - ${finalCriticalMax} ${finalUom}\n`;
    message += `📉 DEVIATION: ${deviation}%\n`;
    message += `🚦 STATUS: ${status.toUpperCase()}\n`;
    message += `⏰ TIME: ${currentTime}\n`;
    message += `🏭 UNIT: ${unit}\n`;
    if (operator) {
      message += `👤 OPERATOR: ${operator}\n`;
    }
    message += `\n${recommendation}`;
    message += trendAnalysis;
    
    return {
      success: true,
      readingId: reading.id,
      status,
      deviation,
      message,
      recommendation,
      trendAnalysis,
    };
  },
});

// Helper function to get equipment history (can be used by other tools)
export function getEquipmentHistory(equipmentId: string, limit: number = 20): EquipmentReading[] {
  return equipmentReadings
    .filter(r => r.equipmentId === equipmentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

// Helper function to get all critical/warning readings
export function getAbnormalReadings(): EquipmentReading[] {
  return equipmentReadings
    .filter(r => r.status === 'critical' || r.status === 'warning')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Export readings array for use by other tools
export { equipmentReadings };
