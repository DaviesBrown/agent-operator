# Refinery Shift Handover Agent 🏭

> An intelligent AI agent built with Mastra that helps refinery workers manage shift transitions by tracking critical operational information and automating handover communications.

[![Mastra](https://img.shields.io/badge/Built%20with-Mastra-blue)](https://mastra.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Telex Integration](https://img.shields.io/badge/Telex.im-Integrated-green)](https://telex.im)

## 🎯 Overview

The Refinery Shift Handover Agent is a professional AI assistant that helps refinery operators, technicians, and supervisors maintain operational continuity during shift changes. It tracks maintenance activities, alerts, status updates, and automatically generates comprehensive handover summaries.

### **Never miss a handover detail again - just tell the agent, it remembers everything**

---

## ✨ Features

### 🔄 Reactive Features (On-Demand)

1. **Log Shift Notes** - Quickly log operational updates with automatic categorization
   - Natural language input: `"Log: Unit 5 pump maintenance started, ETA 4 hours"`
   - Automatic unit extraction and note categorization
   - Types: Maintenance, Alert, Status, General
   - Priority detection: Low, Medium, High, Critical

2. **Query Current Shift Status** - Check real-time facility status
   - `"What's the status of Unit 3?"`
   - `"Show all alerts"`
   - `"Current shift summary"`
   - Filter by unit, type, or view entire facility

3. **Get Previous Shift Report** - Review what happened during the last shift
   - Complete handover summary from previous shift
   - Pending action items highlighted
   - All notes categorized and timestamped

4. **Record Equipment Readings** - Track equipment parameters with predictive maintenance ⭐ **NEW**
   - `"Record: Pump P-101 pressure 125 PSI"`
   - Automatic deviation detection and status flagging
   - Trend analysis from historical data
   - Preventive maintenance recommendations
   - Supports: Pumps, Compressors, Heaters, Finfans, Reactors, Towers, Exchangers
   - **See [EQUIPMENT_MONITORING.md](EQUIPMENT_MONITORING.md) for full details**

### ⚡ Proactive Features (Automated)

4. **Automated Shift Handover Summaries** - Posted at every shift change
   - **Schedule**: 6:00 AM, 2:00 PM, 10:00 PM daily
   - Comprehensive categorized summary
   - Unresolved items highlighted for incoming shift
   - Consistent, scannable format

5. **Daily Safety Reminders** - Safety-first culture reinforcement
   - **Schedule**: 6:05 AM, 2:05 PM, 10:05 PM daily
   - Rotating safety topics (PPE, Emergency Procedures, etc.)
   - Brief, actionable reminders

6. **Weekly Maintenance Summary** - Compliance and planning
   - **Schedule**: Every Monday at 6:00 AM
   - All maintenance activities from past week
   - Completion rates and recurring issues
   - Statistics and trends

---

## 🏗️ Tech Stack

- **Framework**: [Mastra](https://mastra.ai) v0.23.3+
- **Language**: TypeScript 5.9+
- **AI Model**: Google Gemini 2.0 Flash Exp
- **Database**: LibSQL (SQLite)
- **Integration**: Telex.im A2A Protocol (JSON-RPC 2.0)
- **Runtime**: Node.js 20.9.0+

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- npm or pnpm
- Telex.im account (for integration)
- Google API key for Gemini

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agent-operator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Google Gemini API Key
   GOOGLE_API_KEY=your_google_api_key_here
   
   # Optional: Mastra Cloud deployment
   MASTRA_API_KEY=your_mastra_api_key
   ```

4. **Run in development mode**
   ```bash
   npm run dev
   ```
   
   The agent will be available at `http://localhost:4111`

---

## 📖 Usage Examples

### Logging Shift Notes

```
User: "Log: Unit 5 pump maintenance started, ETA 4 hours"

Agent: 
✓ Logged for Day Shift (Unit 5)
Type: Maintenance
Priority: Medium
Time: 8:30 AM
Will be included in next handover at 2:00 PM
```

### Querying Status

```
User: "What's the status of Unit 3?"

Agent:
Current Shift: Day Shift (6:00 AM - 2:00 PM)

═══════════════════════════════════

🔧 MAINTENANCE:
• None

📊 STATUS UPDATES:
• Unit 3: Pressure stable at 85 PSI
  (10:45 AM)

⚠️ ALERTS:
• None

═══════════════════════════════════
📊 Total Notes: 1
```

### Automated Handover (Posted at 2:00 PM)

```
☀️ SHIFT HANDOVER SUMMARY
═══════════════════════════════════
From: Day Shift (6:00 AM - 2:00 PM)
To: Afternoon Shift (2:00 PM - 10:00 PM)
Date: Saturday, November 2, 2025
Time: 2:00 PM

═══════════════════════════════════

🔧 MAINTENANCE ACTIVITIES:
• Unit 5: Pump maintenance in progress (2 hours remaining)
  (Logged: 8:30 AM)

⚠️ ALERTS & WARNINGS:
• No alerts reported - all systems normal

📊 STATUS UPDATES:
• Unit 3: Pressure stable at 85 PSI
  (Logged: 10:45 AM)

⏭️ ACTION ITEMS FOR AFTERNOON SHIFT:
🔧 Unit 5: Complete pump maintenance

═══════════════════════════════════
📊 SHIFT STATISTICS:
• Total notes logged: 2
• Breakdown:
  - 🔧 Maintenance: 1
  - ⚠️ Alerts: 0
  - 📊 Status Updates: 1
• Pending for next shift: 1

═══════════════════════════════════

✅ Handover complete. Stay safe! 🛡️
Afternoon Shift team, you're good to go! 👍
```

---

## 🔧 Configuration

### Shift Schedule

The agent operates on a 3-shift rotation:

| Shift | Time | Duration |
|-------|------|----------|
| **Day** | 6:00 AM - 2:00 PM | 8 hours |
| **Afternoon** | 2:00 PM - 10:00 PM | 8 hours |
| **Night** | 10:00 PM - 6:00 AM | 8 hours |

### Automated Tasks Schedule

| Task | Cron Expression | Times |
|------|----------------|-------|
| Shift Handovers | `0 6,14,22 * * *` | 6 AM, 2 PM, 10 PM |
| Safety Reminders | `5 6,14,22 * * *` | 6:05 AM, 2:05 PM, 10:05 PM |
| Weekly Summary | `0 6 * * 1` | Mondays at 6 AM |

### Supported Units

- **Reactors**: Units 1-4
- **Distillation Towers**: Units 5-7
- **Heat Exchangers**: Units 8-10
- **Pumps & Compressors**: Units 11-15
- **Storage Tanks**: Units 16-20

---

## 🌐 Telex.im Integration

### A2A Protocol Endpoint

The agent exposes an A2A (Agent-to-Agent) protocol endpoint for Telex.im:

```
POST https://your-deployment.mastra.cloud/a2a/agent/shiftAgent
```

### Workflow JSON for Telex

```json
{
  "active": true,
  "category": "utilities",
  "description": "Refinery shift handover management agent",
  "id": "refinery_shift_agent",
  "long_description": "An intelligent agent that helps refinery workers manage shift transitions by tracking operational information, maintenance activities, alerts, and generating automated handover summaries at shift change times.",
  "name": "refinery_shift_agent",
  "nodes": [
    {
      "id": "shift_agent_node",
      "name": "Refinery Shift Agent",
      "parameters": {},
      "position": [500, 300],
      "type": "a2a/mastra-a2a-node",
      "typeVersion": 1,
      "url": "https://your-deployment.mastra.cloud/a2a/agent/shiftAgent"
    }
  ],
  "pinData": {},
  "settings": {
    "executionOrder": "v1"
  },
  "short_description": "AI-powered shift handover assistant for refineries"
}
```

### Testing Your Agent

1. **Get Telex access**:
   ```bash
   /telex-invite your-email@example.com
   ```

2. **View agent logs**:
   
   Go to: `https://api.telex.im/agent-logs/{channel-id}.txt`
   
   Find your channel ID in the Telex URL:
   ```
   https://telex.im/telex-im/home/colleagues/[CHANNEL-ID]/[THREAD-ID]
   ```

3. **Test interactions**:
   - Send messages to your agent in Telex
   - Verify responses are correct
   - Check automated handovers at shift change times

---

## 📁 Project Structure

```
agent-operator/
├── src/
│   └── mastra/
│       ├── index.ts                    # Main Mastra configuration
│       ├── agents/
│       │   └── shift-agent.ts          # Core shift handover agent
│       ├── tools/
│       │   ├── log-shift-note-tool.ts              # Log notes tool
│       │   ├── query-shift-status-tool.ts          # Query status tool
│       │   ├── get-previous-shift-report-tool.ts   # Previous shift tool
│       │   └── generate-shift-handover-summary-tool.ts # Summary generator
│       └── workflows/
│           └── shift-handover-workflow.ts  # Scheduled workflows
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

---

## 🛠️ Development

### Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing the Agent Locally

Use tools like `curl` or Postman to test the A2A endpoint:

```bash
curl -X POST http://localhost:4111/a2a/agent/shiftAgent \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "agent/sendMessage",
    "params": {
      "message": "Log: Unit 5 pump maintenance started",
      "conversationId": "test-conversation"
    },
    "id": 1
  }'
```

---

## 🚢 Deployment

### Deploy to Mastra Cloud

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy** (if using Mastra CLI):
   ```bash
   mastra deploy
   ```

3. **Update Telex workflow** with your deployment URL

### Environment Variables for Production

```env
GOOGLE_API_KEY=your_production_google_api_key
MASTRA_API_KEY=your_mastra_api_key
NODE_ENV=production
```

---

## 📊 Data Model

### ShiftNote Interface

```typescript
{
  id: string;              // Unique identifier
  timestamp: string;       // ISO 8601 format
  shift: "day" | "afternoon" | "night";
  unit: string;           // Unit number or "General"
  note: string;           // Original note text
  type: "maintenance" | "alert" | "status" | "general";
  priority: "low" | "medium" | "high" | "critical";
  resolved: boolean;      // For tracking completion
}
```

### Data Retention

- **Active Data**: Current + previous 7 days
- **Archive**: 8-90 days (searchable)
- **Purge**: After 90 days (configurable)

---

## 🔒 Security & Compliance

- ✅ All shift notes timestamped with audit trail
- ✅ 90-day minimum data retention for compliance
- ✅ Safety-related notes never deleted
- ✅ Secure storage with LibSQL
- ✅ No PII collection unless explicitly provided

---

## 🎯 Success Metrics

### Adoption Metrics
- Daily active users: Target 80% of shift workers
- Notes logged per shift: Average 5-10
- Queries per shift: Average 3-5

### Quality Metrics
- Handover completion: 100%
- Note categorization accuracy: 90%+
- User satisfaction: 4.5/5 stars

### Operational Metrics
- Time saved per handover: ~10 minutes
- Information retention: 100%
- System uptime: 99.5%+

---

## 🤝 Contributing

This project was built for the HNG Internship Stage 3 Backend Task. Contributions, issues, and feature requests are welcome!

---

## 📝 License

ISC

---

## 👨‍💻 Author

Built with ❤️ for HNG Internship Stage 3

**Built with Mastra** - [https://mastra.ai](https://mastra.ai)

**Integrated with Telex.im** - [https://telex.im](https://telex.im)

---

## 📚 Additional Resources

- [Mastra Documentation](https://docs.mastra.ai)
- [Telex.im API](https://telex.im/docs)
- [A2A Protocol Specification](https://telex.im/a2a)
- [HNG Internship](https://hng.tech)

---

## 🎉 Acknowledgments

- **Mastra Team** for the amazing AI framework
- **Telex.im** for the integration platform
- **HNG Internship** for the learning opportunity
- **Google Gemini** for the powerful AI model

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact via HNG Stage 3 Backend channel
- Tag @mastra on Twitter for Mastra-specific questions

---

**May the wind be always at your back! 🚀**
