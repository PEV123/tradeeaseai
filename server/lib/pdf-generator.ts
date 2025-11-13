import puppeteer from "puppeteer";
import { type Report, type Client, type Image } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

export async function generatePDF(
  report: Report,
  client: Client,
  images: Image[]
): Promise<string> {
  // Convert images to base64 for reliable embedding in PDF
  const imagesWithBase64 = await Promise.all(
    images.map(async (img) => {
      try {
        const imagePath = path.join(process.cwd(), img.filePath);
        const imageBuffer = await fs.readFile(imagePath);
        const base64 = imageBuffer.toString('base64');
        const mimeType = img.fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        return {
          ...img,
          base64DataUrl: `data:${mimeType};base64,${base64}`
        };
      } catch (error) {
        console.error(`Failed to read image ${img.filePath}:`, error);
        return { ...img, base64DataUrl: '' };
      }
    })
  );

  // Convert logo to base64
  let logoBase64 = '';
  if (client.logoPath) {
    try {
      const logoPath = path.join(process.cwd(), client.logoPath);
      const logoBuffer = await fs.readFile(logoPath);
      const base64 = logoBuffer.toString('base64');
      const mimeType = client.logoPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      logoBase64 = `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error(`Failed to read logo ${client.logoPath}:`, error);
    }
  }

  const html = generateReportHTML(report, client, imagesWithBase64, logoBase64);

  // Find Chromium executable path with extensive logging
  let chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  
  if (!chromiumPath) {
    try {
      const { execSync } = await import('child_process');
      
      // Try multiple methods to find Chromium
      const possibleCommands = [
        'which chromium',
        'which chromium-browser',
        'which google-chrome',
        'which google-chrome-stable',
        'find /nix/store -name chromium -type f 2>/dev/null | grep bin/chromium | head -1'
      ];
      
      for (const cmd of possibleCommands) {
        try {
          const result = execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim();
          if (result) {
            chromiumPath = result;
            console.log(`Found Chromium using "${cmd}": ${chromiumPath}`);
            break;
          }
        } catch (e) {
          // Try next command
        }
      }
    } catch (error) {
      console.error('Failed to find Chromium path:', error);
    }
  }
  
  if (!chromiumPath) {
    throw new Error('Chromium not found. Please ensure chromium is installed as a system dependency.');
  }
  
  console.log(`Launching Chromium from: ${chromiumPath}`);
  
  // Verify the executable exists and is accessible
  try {
    await fs.access(chromiumPath, (await import('fs')).constants.X_OK);
  } catch (error) {
    throw new Error(`Chromium executable not accessible at ${chromiumPath}: ${error}`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromiumPath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--single-process',
      '--no-zygote'
    ],
    timeout: 60000
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });

  const pdfDir = path.join(process.cwd(), 'storage', 'pdfs');
  await fs.mkdir(pdfDir, { recursive: true });

  const pdfPath = path.join(pdfDir, `${report.id}.pdf`);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });

  await browser.close();

  return pdfPath;
}

function generateReportHTML(
  report: Report, 
  client: Client, 
  images: Array<Image & { base64DataUrl?: string }>,
  logoBase64: string
): string {
  const aiAnalysis = report.aiAnalysis || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 3px solid ${client.brandColor};
      margin-bottom: 30px;
    }
    .logo {
      height: 60px;
      margin-bottom: 10px;
    }
    .company-name {
      font-size: 24pt;
      font-weight: bold;
      color: ${client.brandColor};
      margin-bottom: 5px;
    }
    .report-title {
      font-size: 18pt;
      color: #666;
    }
    .metadata {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .metadata-item {
      text-align: center;
    }
    .metadata-label {
      font-size: 9pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .metadata-value {
      font-size: 13pt;
      font-weight: bold;
      color: #333;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: ${client.brandColor};
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${client.brandColor};
    }
    .subsection-title {
      font-size: 12pt;
      font-weight: bold;
      color: #333;
      margin: 15px 0 8px 0;
    }
    .field {
      margin-bottom: 15px;
    }
    .field-label {
      font-size: 9pt;
      font-weight: bold;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .field-value {
      color: #333;
      white-space: pre-wrap;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 6px;
      margin: 15px 0;
    }
    .stat-box {
      text-align: center;
    }
    .stat-value {
      font-size: 24pt;
      font-weight: bold;
      color: ${client.brandColor};
    }
    .stat-label {
      font-size: 9pt;
      color: #666;
      margin-top: 5px;
    }
    ul {
      margin-left: 20px;
      margin-top: 8px;
    }
    li {
      margin-bottom: 5px;
    }
    .materials-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .materials-table th {
      background: #f5f5f5;
      padding: 10px;
      text-align: left;
      font-size: 9pt;
      text-transform: uppercase;
      border-bottom: 2px solid ${client.brandColor};
    }
    .materials-table td {
      padding: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
      page-break-inside: avoid;
    }
    .image-container {
      text-align: center;
      page-break-inside: avoid;
    }
    .image-container img {
      width: 100%;
      height: auto;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    .image-caption {
      font-size: 9pt;
      color: #555;
      margin-top: 8px;
      padding: 8px 10px;
      font-style: italic;
      text-align: left;
      line-height: 1.4;
      background: #f9f9f9;
      border-left: 3px solid ${client.brandColor};
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ''}
    <div class="company-name">${client.companyName}</div>
    <div class="report-title">Daily Construction Site Report</div>
  </div>

  <div class="metadata">
    <div class="metadata-item">
      <div class="metadata-label">Project</div>
      <div class="metadata-value">${report.projectName}</div>
    </div>
    <div class="metadata-item">
      <div class="metadata-label">Report Date</div>
      <div class="metadata-value">${new Date(report.reportDate).toLocaleDateString()}</div>
    </div>
    <div class="metadata-item">
      <div class="metadata-label">Report ID</div>
      <div class="metadata-value">${report.id.slice(0, 8)}</div>
    </div>
    <div class="metadata-item">
      <div class="metadata-label">Status</div>
      <div class="metadata-value">${report.status.toUpperCase()}</div>
    </div>
  </div>

  ${aiAnalysis.works_summary ? `
  <div class="section">
    <div class="section-title">Works Summary</div>
    <h3 class="subsection-title">${aiAnalysis.works_summary.title || 'Daily Works'}</h3>
    <p>${aiAnalysis.works_summary.description || ''}</p>
    ${aiAnalysis.works_summary.key_activities && aiAnalysis.works_summary.key_activities.length > 0 ? `
      <div class="subsection-title">Key Activities:</div>
      <ul>
        ${aiAnalysis.works_summary.key_activities.map((activity: string) => `<li>${activity}</li>`).join('')}
      </ul>
    ` : ''}
  </div>
  ` : ''}

  ${aiAnalysis.workforce ? `
  <div class="section">
    <div class="section-title">Workforce</div>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${aiAnalysis.workforce.total_workers || 0}</div>
        <div class="stat-label">Total Workers</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${aiAnalysis.workforce.total_hours || 0}</div>
        <div class="stat-label">Total Hours</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${aiAnalysis.workforce.man_hours || 0}</div>
        <div class="stat-label">Man Hours</div>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Works Performed</div>
    <p class="field-value">${report.formData.worksPerformed}</p>
  </div>

  ${aiAnalysis.materials?.items_used && aiAnalysis.materials.items_used.length > 0 ? `
  <div class="section">
    <div class="section-title">Materials Used</div>
    <table class="materials-table">
      <thead>
        <tr>
          <th>Material</th>
          <th>Quantity</th>
          <th>Unit</th>
        </tr>
      </thead>
      <tbody>
        ${aiAnalysis.materials.items_used.map((item: any) => `
          <tr>
            <td>${item.material}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${aiAnalysis.plant_equipment?.equipment_used && aiAnalysis.plant_equipment.equipment_used.length > 0 ? `
  <div class="section">
    <div class="section-title">Plant & Equipment</div>
    <ul>
      ${aiAnalysis.plant_equipment.equipment_used.map((equipment: string) => `<li>${equipment}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${aiAnalysis.safety_incidents ? `
  <div class="section">
    <div class="section-title">Safety & Incidents</div>
    ${aiAnalysis.safety_incidents.incidents_reported && aiAnalysis.safety_incidents.incidents_reported.length > 0 ? `
      <div class="subsection-title">Incidents Reported:</div>
      <ul>
        ${aiAnalysis.safety_incidents.incidents_reported.map((incident: any) => {
          if (typeof incident === 'string') {
            return `<li>${incident}</li>`;
          }
          return `<li><strong>${incident.person || 'Worker'}:</strong> ${incident.description || incident}${incident.action_taken ? `<br><em>Action taken: ${incident.action_taken}</em>` : ''}</li>`;
        }).join('')}
      </ul>
    ` : ''}
    ${aiAnalysis.safety_incidents.safety_observations ? `
      <div class="subsection-title">Safety Observations:</div>
      <p>${aiAnalysis.safety_incidents.safety_observations}</p>
    ` : ''}
  </div>
  ` : ''}

  ${aiAnalysis.next_day_plan?.scheduled_works && aiAnalysis.next_day_plan.scheduled_works.length > 0 ? `
  <div class="section">
    <div class="section-title">Next Day Plan</div>
    <ul>
      ${aiAnalysis.next_day_plan.scheduled_works.map((work: string) => `<li>${work}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${images.length > 0 ? `
  <div class="section">
    <div class="section-title">Site Photos</div>
    <div class="images-grid">
      ${images.map((img) => `
        <div class="image-container">
          ${img.base64DataUrl ? `<img src="${img.base64DataUrl}" />` : ''}
          ${img.aiDescription ? `<div class="image-caption">${img.aiDescription}</div>` : ''}
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Report generated by TradeaseAI on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>${client.companyName} | ${client.contactEmail}</p>
  </div>
</body>
</html>
  `;
}
