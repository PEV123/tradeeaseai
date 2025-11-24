# TradeaseAI - Construction Site Daily Reporting System

## Overview
TradeaseAI is a construction site daily reporting system designed to streamline the collection, analysis, and distribution of daily site reports for construction companies. It features an Admin Dashboard for client management and branding, public report forms for workers, a secure Client Portal for historical report access, and AI-powered analysis of form data and site photos using GPT-5. The system automates PDF report generation with embedded images and sends email notifications to stakeholders. The primary goal is to provide a comprehensive, Replit-hosted solution for construction reporting, leveraging AI for efficiency and insights.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript and Vite.
- **UI**: Radix UI primitives with shadcn/ui ("new-york" style), Tailwind CSS, and Inter font.
- **State Management**: TanStack Query for server state, configured for manual refetching.
- **Routing**: Wouter for client-side routing, supporting public forms, admin, and client portal routes.
- **Form Handling**: React Hook Form with Zod for type-safe validation.
- **Design System**: Custom guidelines, two-column for admin, single-column for public forms.

### Backend
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM, using Neon Database for production. Supports Admin, Client, Report, Image, Worker, and Settings models with full CRUD.
- **Authentication**: JWT-based for Admin (Bearer token, bcryptjs hashing) and secure HTTP-only cookie-based for Client Portal.
- **File Uploads**: Multer for multipart/form-data, memory storage, 10MB limit, Sharp for image processing.
- **API**: RESTful endpoints categorized by public, admin, and client portal access.

### Data Storage
- **Persistence**: Bunny CDN (Sydney region) for production storage; local filesystem fallback for development.
- **CDN URL**: https://tradeease.b-cdn.net/
- **Storage Paths**: Canonical paths stored in database (e.g., `images/report-123.jpg`, `logos/client-456.png`, `pdfs/report-789.pdf`)
- **Backward Compatibility**: Legacy prefixed paths (`bunny/...`, `storage/...`) automatically normalized to canonical format
- **Architecture**:
  - `server/lib/bunny-storage.ts`: HTTPS-based Bunny CDN API integration (upload, download, delete)
  - `server/lib/storage-service.ts`: Unified storage service with automatic Bunny CDN/filesystem fallback
  - Automatic path normalization for backward compatibility with legacy data
- **Configuration**: Uses environment variables (`BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_API_KEY`, `BUNNY_CDN_PULL_ZONE_URL`)
- **Data Models**: Defined with Zod schemas for type-safe validation across client and server.

### AI Integration
- **OpenAI API**: Uses GPT-5 model (`gpt-5-2025-08-07`) for analyzing form data and images to generate structured reports.
- **Configuration**: API key from database settings or `OPENAI_API_KEY` env variable.
- **Output**: JSON containing report metadata, site conditions, workforce details (including individual worker names), works summary, materials, safety, and image analysis.

### PDF Generation
- **Mechanism**: Puppeteer for headless browser-based generation.
- **Content**: HTML template with client branding, embedded images, A4 format, styled with inline CSS.

### Email Notifications
- **Service**: Nodemailer for SMTP.
- **Content**: HTML template with client branding, report summary, and PDF attachment. Uses URL-based images for smaller payload.

### Webhook Integration
- **Purpose**: Sends completed reports to n8n webhook for email distribution.
- **Payload**: POST request with multipart/form-data including the generated PDF and a JSON string of complete report data (e.g., `reportId`, `clientId`, `aiAnalysis`, `notificationEmails`, `emailHtml`).

## External Dependencies

### OpenAI API
- **Purpose**: AI analysis of daily site reports and photos.
- **Model**: GPT-5 (released August 7, 2025).
- **Configuration**: `OPENAI_API_KEY` environment variable or database setting.

### SMTP Email Service
- **Purpose**: Sending PDF reports via email.
- **Configuration**: Standard SMTP environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).

### Database
- **Type**: PostgreSQL.
- **Provider**: Neon Database (`@neondatabase/serverless`).
- **ORM**: Drizzle ORM.
- **Configuration**: `DATABASE_URL` environment variable.

### CDN Resources
- **Google Fonts**: Inter font family for UI typography.

### Twilio SMS
- **Status**: FULLY IMPLEMENTED - Manual integration with standard environment variables
- **Purpose**: Send daily SMS reminders to foreman at specified time with link to report form
- **Configuration**: Uses standard Twilio environment variables (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)
- **Database Fields**: `notificationPhoneNumber` (varchar, nullable) and `notificationTime` (varchar, nullable, HH:MM format) in clients table
- **Timezone**: All reminder times are in Australian Eastern Time (AEDT/AEST - Sydney/Melbourne timezone)
- **Architecture**: 
  - `server/lib/sms.ts`: Twilio SMS service for sending messages
  - `server/lib/reminder-scheduler.ts`: Cron-based scheduler running every minute in Australia/Sydney timezone
  - Scheduler checks all active clients and sends reminders at their specified time
  - Deduplication: Tracks sent reminders per client per day
  - Automatic reset: Sent tracking resets at midnight AEST
- **Portability**: Uses standard environment variables, fully portable to any hosting provider (Vercel, AWS, etc.)

### Node.js Libraries
- **Backend Core**: Express, TypeScript, tsx.
- **Auth**: bcryptjs, jsonwebtoken.
- **File Processing**: multer, sharp.
- **PDF**: puppeteer.
- **Email**: nodemailer.
- **SMS**: twilio, node-cron.
- **Database**: @neondatabase/serverless, drizzle-orm, drizzle-kit.
- **Frontend UI**: Radix UI components, @tanstack/react-query, react-hook-form, zod.
- **Styling**: tailwindcss, class-variance-authority.
- **Build Tools**: vite, esbuild.
- **Replit Integration**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner.