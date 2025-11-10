# TradeaseAI - Construction Site Daily Reporting System

## Overview

TradeaseAI is a construction site daily reporting system that enables construction companies to collect, analyze, and distribute daily site reports. The application features:

- **Admin Dashboard**: Manage multiple construction company clients, each with custom branding
- **Public Report Forms**: Custom-branded, no-login forms for site workers to submit daily reports
- **AI-Powered Analysis**: GPT-5 integration to analyze form data and site photos
- **Automated PDF Generation**: Creates professional PDF reports with embedded images
- **Email Notifications**: Sends completed reports to designated stakeholders

The system is designed to run entirely on Replit with minimal external dependencies - only the OpenAI API is used as an external service.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript and Vite for build tooling

**UI Component System**: Radix UI primitives with shadcn/ui styling system ("new-york" style variant)
- Uses Tailwind CSS for styling with custom design tokens
- Material Design principles adapted for construction industry
- Inter font family via Google Fonts CDN
- Component library includes 40+ pre-built components (buttons, forms, cards, dialogs, etc.)

**State Management**: TanStack Query (React Query) for server state management
- Custom query client with fetch-based data fetching
- Configured for no automatic refetching (manual control)
- Handles authentication errors with 401 status codes

**Routing**: Wouter for lightweight client-side routing
- Public routes: `/form/:slug` for custom-branded report submission forms
- Admin routes: `/admin/*` with subroutes for dashboard, clients, reports, and settings
- Not Found fallback for unmatched routes

**Form Handling**: React Hook Form with Zod schema validation
- Type-safe form validation using shared schemas
- Integration with Radix UI form components

**Design System**: Custom design guidelines documented in `design_guidelines.md`
- Two-column layout for admin dashboard (fixed sidebar + main content)
- Single-column centered layout for public forms
- Document-style layout for report viewing
- Spacing system based on Tailwind units (4, 6, 8, 12, 16, 24)

### Backend Architecture

**Framework**: Express.js server with TypeScript

**Database**: PostgreSQL with Drizzle ORM (DbStorage class)
- Production storage using Neon Database (@neondatabase/serverless)
- Interface-based design (IStorage) allows easy swapping between storage implementations
- Data models: Admin, Client, Report, Image (all tables created via Drizzle migrations)
- Full CRUD operations with type-safe queries using Drizzle ORM

**Authentication**: Simple JWT-based authentication for admin users
- bcryptjs for password hashing
- JWT tokens with 7-day expiration
- Bearer token authentication middleware
- Default admin account created on startup (username: "admin", password: "admin123")

**File Upload Handling**: Multer for multipart/form-data
- Memory storage strategy (files stored in memory buffers)
- 10MB file size limit per upload
- Sharp library for image processing and optimization
- Local file storage in `/storage` directory with subdirectories for logos, images, and PDFs

**API Structure**: RESTful endpoints organized by domain
- Public routes: Form submission endpoints (no authentication)
- Admin routes: CRUD operations for clients and reports (requires JWT)
- Middleware for token verification on protected routes

### Data Storage Architecture

**Storage Locations**:
- `/storage/logos` - Client company logos
- `/storage/images` - Site report photos
- `/storage/pdfs` - Generated PDF reports

**Data Models**:
- **Admin**: Basic admin user with username and password hash
- **Client**: Construction company with branding (logo, color), contact info, notification emails, and unique form slug
- **Report**: Daily site report linked to client, contains form data, AI analysis, and processing status
- **Image**: Site photos linked to reports with file paths and optional AI-generated captions
- **Worker**: Individual worker names extracted from AI analysis, linked to reports with ON DELETE CASCADE
- **Settings**: Key-value storage for application configuration (OpenAI API key, etc.)

**Schema Validation**: Zod schemas in `/shared/schema.ts`
- Type-safe validation for all data models
- Shared between client and server for consistency
- Insert schemas for create operations with proper validation rules

### AI Integration Architecture

**OpenAI API Integration** (`server/lib/openai.ts`):
- Uses GPT-5 model: `gpt-5-2025-08-07` (released August 7, 2025)
- API key loaded from database settings table (fallback to OPENAI_API_KEY environment variable)
- Managed through admin Settings page at `/admin/settings`
- Uses chat.completions API with vision capabilities for image analysis
- Analyzes form data and site photos to generate structured report analysis
- Returns JSON with report metadata, site conditions, workforce details, works summary, materials, safety observations, and image analysis
- Falls back to mock analysis if no API key configured

**Analysis Output Structure**:
- Report metadata (project name, date, ID)
- Site conditions (weather, temperature)
- Workforce information (total workers, names, hours, man-hours)
  - Individual worker names are extracted from the `workforce.worker_names` array and saved to the `workers` table
  - Each worker name is stored separately for detailed tracking and display
  - Worker names are displayed as badges in the report detail view
  - Note: Existing reports created before worker tracking was implemented need to be regenerated to populate worker data
- Works summary (detailed description)
- Materials tracking
- Safety observations
- Image analysis with captions

### PDF Generation Architecture

**PDF Generator** (`server/lib/pdf-generator.ts`):
- Puppeteer for headless browser-based PDF generation
- HTML template with client branding (logo, brand color)
- Embedded images from local file system using `file://` protocol
- A4 format with custom margins
- Styled using inline CSS for print compatibility

**Template Features**:
- Client logo and branding integration
- Metadata grid (date, project, report ID)
- Workforce and site condition sections
- Works performed details
- Materials and safety observations
- Image gallery with captions

### Email Notification Architecture

**Email Service** (`server/lib/email.ts`):
- Nodemailer for SMTP email sending
- Configurable SMTP settings via environment variables
- HTML email template with client branding
- PDF attachment support
- Sends to multiple notification email addresses per client

**Email Features**:
- Client brand color header
- Report metadata summary
- Professional formatting
- File attachment (PDF report)

### Build and Development Architecture

**Development Mode**:
- Vite dev server with HMR (Hot Module Replacement)
- Express server runs concurrently
- Replit-specific plugins (runtime error modal, cartographer, dev banner)

**Production Build**:
- Vite builds client to `/dist/public`
- esbuild bundles server to `/dist`
- ESM module format throughout
- Static file serving from Express in production

**TypeScript Configuration**:
- Strict mode enabled
- Path aliases: `@/*` for client, `@shared/*` for shared code, `@assets/*` for attached assets
- ESNext module resolution with bundler strategy
- Incremental compilation for faster rebuilds

## External Dependencies

### OpenAI API
- **Purpose**: AI-powered analysis of daily site reports and photos
- **Model**: GPT-5 (released August 7, 2025)
- **Configuration**: Requires `OPENAI_API_KEY` environment variable
- **Fallback**: Mock analysis generated when API key not configured
- **Usage**: Analyzes form submissions and images to generate structured JSON reports

### SMTP Email Service
- **Purpose**: Send PDF reports to client notification email addresses
- **Configuration**: Environment variables for SMTP settings
  - `SMTP_HOST` (default: smtp.gmail.com)
  - `SMTP_PORT` (default: 587)
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM` (optional, default: noreply@tradeaseai.com)
- **Provider-agnostic**: Works with any SMTP service (Gmail, SendGrid, etc.)

### Database
- **Current State**: PostgreSQL database fully operational (DbStorage class)
- **Provider**: Neon Database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with type-safe queries and schema management
- **Tables**: admins, clients, reports, images, workers, settings (all with proper foreign key relationships)
- **Migration**: Completed migration from MemStorage to DbStorage on November 10, 2025
- **Configuration**: `DATABASE_URL` environment variable in drizzle.config.ts
- **Schema Management**: `npm run db:push` for schema synchronization
- **Environment Setup**: Both development and production environments use the same database (configured November 10, 2025)
  - This ensures data consistency across environments
  - No separate dev/production databases - all changes affect production data
  - Benefits: Simplified data management, no sync issues, real-world testing
  - Consideration: Exercise caution when testing features that modify data

### CDN Resources
- **Google Fonts**: Inter font family loaded via CDN in HTML
- **Purpose**: Typography for UI components across the application

### Node.js Libraries
- **Core Backend**: Express, TypeScript, tsx (dev runtime)
- **Authentication**: bcryptjs, jsonwebtoken
- **File Processing**: multer, sharp
- **PDF Generation**: puppeteer
- **Email**: nodemailer
- **Database**: @neondatabase/serverless (active), drizzle-orm (active), drizzle-kit
- **Frontend UI**: Radix UI component primitives (20+ packages)
- **Frontend State**: @tanstack/react-query
- **Form Handling**: react-hook-form, @hookform/resolvers, zod
- **Styling**: tailwindcss, class-variance-authority, clsx, tailwind-merge
- **Build Tools**: vite, esbuild, @vitejs/plugin-react
- **Replit Integration**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner