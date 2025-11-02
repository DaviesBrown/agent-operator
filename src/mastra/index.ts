
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { 
  shiftHandoverWorkflow, 
  safetyReminderWorkflow, 
  weeklySummaryWorkflow
} from './workflows/shift-handover-workflow';
import { shiftAgent } from './agents/shift-agent';

export const mastra = new Mastra({
  workflows: { 
    shiftHandoverWorkflow, 
    safetyReminderWorkflow, 
    weeklySummaryWorkflow
  },
  agents: { shiftAgent },
  storage: new LibSQLStore({
    // stores shift notes, handover history, and observability data
    url: "file:../mastra.db",
  }),
  logger: new PinoLogger({
    name: 'Refinery Shift Handover Agent',
    level: 'info',
  }),
  telemetry: {
    enabled: false, 
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true }, 
  },
});
