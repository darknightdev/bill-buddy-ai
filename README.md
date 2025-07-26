# AI Bill MVP - Intelligent Bill Analysis & Interaction Platform

A scalable AI-powered platform that transforms bill processing through intelligent analysis, metadata tagging, and multi-modal interaction.

## 🎯 Project Overview

This MVP implements the core pillars from our patent-based architecture:

1. **Digital Bill Receipt & Analysis** - OCR/PDF parsing with intelligent text extraction
2. **Metadata & Markup Tagging** - AI-powered field extraction with security classifications
3. **Dynamic Content Generation** - Audio-visual explanations (planned)
4. **Multi-Modal Interaction** - Voice, text, and gesture-based interactions (planned)

## 🏗️ Architecture

```mermaid
flowchart TD
  subgraph Ingestion
    A1[PDF/OCR/API Bill Input]
    A2[Preprocessor: normalize dates, amounts]
  end
  subgraph Markup & Metadata
    B1[Field Extractor (NLP)]
    B2[Metadata Tagger: type, group, security, status]
    B3[Canonical Bill Schema]
  end
  subgraph Presentation Engine
    C1[Template Manager: A/V snippets]
    C2[TTS & Video Composer]
    C3[Avatar / Synthesia]
  end
  subgraph Interaction Layer
    D1[Speech-to-Text & Text NLU]
    D2[Gesture / Click Router]
    D3[Escalation Agent (only-payee-knows)]
  end
  subgraph Actions & Payment
    E1[Paymentus API Adapter]
    E2[Service-Request Connector]
  end

  A1 --> A2 --> B1 --> B2 --> B3 --> C1 --> C2 --> C3 --> Interaction Layer --> Actions & Payment
```

## 🚀 Current Status

### ✅ **Completed (Sprint 0-1)**

#### **Monorepo Setup & Bootstrap**
- ✅ Yarn 3.x (Berry) workspace configuration
- ✅ TypeScript backend (Node.js + Express)
- ✅ Next.js frontend with TypeScript
- ✅ Docker configuration (optional)
- ✅ VS Code debugging setup

#### **Bill Ingestion Service**
- ✅ PDF parsing with `pdf-parse`
- ✅ OCR fallback with `tesseract.js`
- ✅ File upload handling with `multer`
- ✅ Text normalization and preprocessing
- ✅ **Endpoint:** `POST /api/ingest`

#### **Field Extraction & Metadata Tagging**
- ✅ OpenAI GPT-4 integration with function calling
- ✅ Intelligent field extraction (due date, total, account ID, line items)
- ✅ Metadata tagging with security classifications:
  - `type`: date, amount, id, lineItem
  - `group`: billing, account
  - `security`: public, private
  - `status`: extracted
- ✅ **Endpoint:** `POST /api/annotate`

### 🔄 **In Progress (Sprint 2-3)**

#### **A/V Generator Core**
- ⏳ Snippet templates for each field type
- ⏳ Text-to-Speech integration
- ⏳ Dynamic video composition with ffmpeg
- ⏳ "Why higher this month?" explanations

#### **Frontend MVP**
- ⏳ Video player component
- ⏳ Bill upload interface
- ⏳ Field display and interaction
- ⏳ Text-based Q&A interface

## 📋 **Planned Roadmap**

### **Sprint 4: Avatar & Multi-Modal**
- [ ] Avatar SDK integration (Synthesia or custom)
- [ ] Speech-to-Text (Whisper) integration
- [ ] NLU for voice Q&A
- [ ] Click/touch handlers for field explanations

### **Sprint 5: Escalation & Payor Loop**
- [ ] "Only-payee-knows" detector
- [ ] Confidence threshold handling
- [ ] Payee UI/webhook integration
- [ ] Auto-splice returned payee clips

### **Sprint 6: Payment & Service Actions**
- [ ] Paymentus API adapter
- [ ] "Pay Now" and "Schedule Payment" functionality
- [ ] Generic service request connector
- [ ] Email/REST integration for biller endpoints

### **Sprint 7: Security & Scalability**
- [ ] Field-level encryption
- [ ] Audit logs (S3 + DynamoDB)
- [ ] Kubernetes deployment
- [ ] PCI/CIC/HIPAA compliance

### **Sprint 8: Beta & Metrics**
- [ ] Closed beta with 3 verticals
- [ ] Support deflection metrics
- [ ] Time-to-pay lift tracking
- [ ] CSAT NPS monitoring

## 🛠️ Tech Stack

### **Backend**
- **Runtime:** Node.js 20.x LTS
- **Framework:** Express.js with TypeScript
- **AI/ML:** OpenAI GPT-4 (function calling)
- **File Processing:** pdf-parse, tesseract.js
- **Development:** ts-node-dev, dotenv

### **Frontend**
- **Framework:** Next.js 15.x with TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Development:** Hot reloading, TypeScript

### **Infrastructure**
- **Package Manager:** Yarn 3.x (Berry)
- **Monorepo:** Yarn Workspaces
- **Containerization:** Docker (optional)
- **Environment:** dotenv for secrets

## 🚀 Quick Start

### **Prerequisites**
- Node.js 20.x LTS
- Yarn 3.x
- OpenAI API key

### **Installation**
```bash
# Clone and setup
git clone <repository>
cd ai-bill
yarn install

# Setup environment
cd backend
echo "OPENAI_API_KEY=your-api-key-here" > .env
```

### **Development**
```bash
# Start backend (port 4000)
yarn dev:backend

# Start frontend (port 3000)
yarn dev:frontend

# Or start both from root
yarn dev:backend & yarn dev:frontend
```

### **Testing Endpoints**

#### **Bill Ingestion**
```bash
curl -X POST http://localhost:4000/api/ingest \
  -F "file=@/path/to/sample.pdf" \
  -H "Accept: application/json"
```

#### **Field Extraction**
```bash
curl -X POST http://localhost:4000/api/annotate \
  -H "Content-Type: application/json" \
  -d '{"text":"Invoice #123\nDue Date: 2025-08-15\nAmount: $245.00\nAccount: 12345"}'
```

## 📊 API Documentation

### **POST /api/ingest**
Extracts text from uploaded PDF or image files.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (PDF, JPG, PNG)

**Response:**
```json
{
  "text": "Invoice #123\nDue Date: 2025-08-15\nAmount: $245.00\n..."
}
```

### **POST /api/annotate**
Extracts and tags bill fields using AI.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body: `{ "text": "bill text content" }`

**Response:**
```json
{
  "fields": [
    {
      "fieldId": "dueDate",
      "value": "2025-08-15",
      "type": "date",
      "group": "billing",
      "security": "public",
      "status": "extracted"
    }
  ],
  "annotated": {
    "dueDate": "2025-08-15",
    "totalOwed": 245,
    "accountId": "12345"
  }
}
```

## 🎯 Business Use Cases

### **1. Residential Utility Bills**
- Explain consumption spikes ("last month's outage + hotter weather")
- One-click pay or request payment plan

### **2. Insurance EOB (Explanation of Benefits)**
- Narrate covered vs. out-of-pocket charges
- Route "file appeal" to insurer portal

### **3. Healthcare Patient Statements**
- Break down facility vs. professional fees
- Multi-modal: voice Q&A for "what's CPT code 99213?"

## 🔧 Development

### **Debugging**
VS Code launch configurations are included:
- **Debug Backend:** Start with debugging enabled
- **Debug Backend (Attach):** Attach to running process

### **Environment Variables**
```bash
# Backend (.env)
OPENAI_API_KEY=sk-...
NODE_ENV=development
```

### **Project Structure**
```
ai-bill/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── ingest.ts
│   │   │   └── annotate.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── next.config.js
├── .vscode/
│   └── launch.json
├── package.json
└── README.md
```

## 📈 Success Metrics

- **Support Deflection:** Reduce customer service calls by 40%
- **Time-to-Pay:** Decrease average payment time by 25%
- **CSAT:** Achieve NPS score of 70+
- **Accuracy:** Maintain ≥95% field extraction accuracy

## 🤝 Contributing

1. Follow the sprint-based development approach
2. Ensure all endpoints have proper error handling
3. Add TypeScript types for all new features
4. Update documentation for API changes

## 📄 License

[Add your license information here]

---

**Next Milestone:** Complete A/V Generator Core and Frontend MVP integration
