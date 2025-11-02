import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Safety reminders that rotate
const safetyReminders = [
  {
    title: 'Personal Protective Equipment (PPE)',
    message: `Remember to wear all required PPE including:
✓ Hard hat
✓ Safety glasses
✓ Steel-toed boots
✓ Heat-resistant gloves when working near hot equipment

Safety is everyone's responsibility. Report any PPE damage immediately.`,
  },
  {
    title: 'Emergency Procedures',
    message: `Know your emergency response plan:
✓ Location of emergency exits and assembly points
✓ Fire extinguisher locations and operation
✓ Emergency shutdown procedures
✓ Contact numbers for emergency response team

Review emergency procedures regularly. If you see something, say something.`,
  },
  {
    title: 'Hazard Communication',
    message: `Stay informed about workplace hazards:
✓ Read and understand SDS (Safety Data Sheets)
✓ Check hazard labels before handling materials
✓ Report any spills or leaks immediately
✓ Use proper storage and handling procedures

Never take shortcuts with hazardous materials.`,
  },
  {
    title: 'Equipment Safety',
    message: `Maintain equipment safety standards:
✓ Perform pre-operation inspections
✓ Never bypass safety guards or interlocks
✓ Report any equipment malfunctions immediately
✓ Follow lockout/tagout procedures

Properly maintained equipment keeps everyone safe.`,
  },
  {
    title: 'Situational Awareness',
    message: `Stay alert and aware:
✓ Watch for changing conditions
✓ Communicate hazards to your team
✓ Don't rush - take time to do it safely
✓ Stay focused and avoid distractions

Your awareness protects you and your coworkers.`,
  },
];

function getSafetyReminder(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % safetyReminders.length;
  const reminder = safetyReminders[index];
  
  return `🛡️ DAILY SAFETY REMINDER\n\nToday's Focus: ${reminder.title}\n\n${reminder.message}`;
}

// Step 1: Generate shift handover summary
const generateHandoverStep = createStep({
  id: 'generate-handover',
  description: 'Generate the shift handover summary',
  inputSchema: z.object({
    type: z.enum(['handover', 'safety', 'weekly']).optional(),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('shiftAgent');
    
    if (!agent) {
      throw new Error('Shift agent not found');
    }
    
    // Use the agent to generate handover summary
    const result = await agent.generate(
      'Please generate a comprehensive shift handover summary for the current shift using the generateShiftHandoverSummaryTool.',
      {
        maxSteps: 5,
      }
    );
    
    return {
      summary: result.text || 'Error generating handover summary',
    };
  },
});

// Step 2: Post safety reminder
const postSafetyReminderStep = createStep({
  id: 'post-safety-reminder',
  description: 'Post daily safety reminder',
  inputSchema: z.object({
    type: z.literal('safety').optional(),
  }),
  outputSchema: z.object({
    reminder: z.string(),
  }),
  execute: async () => {
    return {
      reminder: getSafetyReminder(),
    };
  },
});

// Step 3: Weekly maintenance summary
const generateWeeklySummaryStep = createStep({
  id: 'generate-weekly-summary',
  description: 'Generate weekly maintenance summary',
  inputSchema: z.object({
    type: z.literal('weekly').optional(),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ mastra }) => {
    const agent = mastra.getAgent('shiftAgent');
    
    if (!agent) {
      throw new Error('Shift agent not found');
    }
    
    // Request weekly summary from agent
    const result = await agent.generate(
      'Generate a weekly maintenance summary showing all maintenance activities, alerts, and statistics from the past 7 days. Include completion rates and any recurring issues.',
      {
        maxSteps: 5,
      }
    );
    
    return {
      summary: result.text || 'Weekly summary not available',
    };
  },
});

// Main workflow for shift handovers
const shiftHandoverWorkflow = createWorkflow({
  id: 'shift-handover-workflow',
  inputSchema: z.object({
    type: z.enum(['handover', 'safety', 'weekly']).optional(),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
})
  .then(generateHandoverStep);

shiftHandoverWorkflow.commit();

// Safety reminder workflow
const safetyReminderWorkflow = createWorkflow({
  id: 'safety-reminder-workflow',
  inputSchema: z.object({
    type: z.literal('safety').optional(),
  }),
  outputSchema: z.object({
    reminder: z.string(),
  }),
})
  .then(postSafetyReminderStep);

safetyReminderWorkflow.commit();

// Weekly summary workflow
const weeklySummaryWorkflow = createWorkflow({
  id: 'weekly-summary-workflow',
  inputSchema: z.object({
    type: z.literal('weekly').optional(),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
})
  .then(generateWeeklySummaryStep);

weeklySummaryWorkflow.commit();

export { shiftHandoverWorkflow, safetyReminderWorkflow, weeklySummaryWorkflow };
