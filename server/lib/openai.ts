import OpenAI from "openai";
import { storage } from "../storage";

// GPT-5 was released August 7, 2025
const GPT_5_MODEL = "gpt-5-2025-08-07";

// Default AI prompt template
export const DEFAULT_AI_PROMPT = `You are a construction site documentation assistant. Using the provided JSON data and site photos, create a professional daily site report in a consistent JSON structure.

**INPUT DATA:**
Date: {{reportDate}}
Project: {{projectName}}
Works Performed: {{worksPerformed}}
Labour on Site: {{labourOnSite}}
Plant & Machinery: {{plantMachinery}}
Hours Worked: {{hoursWorked}}
Materials Used: {{materialsUsed}}
Delays/Weather: {{delaysWeather}}
Safety Incidents: {{safetyIncidents}}

**IMAGES:**
{{imageCount}} site photos are attached showing today's works.

**TASK:**
Analyze the data and images, then output a structured JSON report following this exact schema:

{
  "report_metadata": {
    "project_name": "",
    "report_date": "",
    "report_id": ""
  },
  "site_conditions": {
    "weather": "",
    "temperature": ""
  },
  "workforce": {
    "total_workers": 0,
    "worker_names": [],
    "total_hours": 0,
    "man_hours": 0
  },
  "works_summary": {
    "title": "",
    "description": "",
    "key_activities": []
  },
  "materials": {
    "items_used": [
      {
        "material": "",
        "quantity": "",
        "unit": ""
      }
    ]
  },
  "plant_equipment": {
    "equipment_used": []
  },
  "quality_compliance": {
    "compliance_status": ""
  },
  "safety_incidents": {
    "incidents_reported": [],
    "safety_observations": ""
  },
  "delays_issues": {
    "delays": [],
    "impact": ""
  },
  "photo_documentation": {
    "total_images": 0,
    "image_descriptions": []
  },
  "next_day_plan": {
    "scheduled_works": []
  }
}

**INSTRUCTIONS:**
1. Use relevant construction standards in accordance with VicRoads Standard Documents
2. Extract all relevant information from the JSON data
3. Analyze each photo and describe what it shows (e.g., "Installed SL72 mesh with bar chairs visible")
4. Infer logical next-day activities based on works performed
5. Use professional construction terminology
6. Calculate man_hours (total_workers × total_hours)
7. For report_id, use format: {PROJECT}_{DATE}_DR
8. Return ONLY valid JSON, no additional text or explanation`;

async function getOpenAIClient(): Promise<OpenAI | null> {
  // Try to get API key from database settings first
  const apiKey = await storage.getSetting('openai_api_key');
  
  if (apiKey) {
    return new OpenAI({ apiKey });
  }
  
  // Fallback to environment variable
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  
  return null;
}

export async function analyzeReport(formData: any, imageBase64Array: string[], clientId: string) {
  // Get OpenAI client with API key from database or environment
  const openai = await getOpenAIClient();
  
  // If OpenAI API key is not configured, return a mock analysis
  if (!openai) {
    console.warn("⚠️ No OpenAI API key configured in settings or environment - using mock AI analysis");
    return generateMockAnalysis(formData, imageBase64Array);
  }

  // Try with images first, fallback to text-only if images fail
  try {
    return await analyzeWithImages(openai, formData, imageBase64Array, clientId);
  } catch (error: any) {
    console.error("❌ GPT-5 analysis failed:", error);
    // If image parsing fails, retry without images
    if (error?.message?.includes('image') || error?.status === 400) {
      console.warn("⚠️ Image processing failed, retrying without images:", error.message);
      return await analyzeWithImages(openai, formData, [], clientId);
    }
    throw error;
  }
}

async function analyzeWithImages(openai: OpenAI, formData: any, imageBase64Array: string[], clientId: string) {
  // Get client-specific AI prompt template, fallback to global setting, then default
  const client = await storage.getClient(clientId);
  let promptTemplate = DEFAULT_AI_PROMPT;
  
  if (client?.aiPromptTemplate) {
    // Use client-specific prompt
    promptTemplate = client.aiPromptTemplate;
  } else {
    // Fallback to global setting if client doesn't have custom prompt
    const globalPrompt = await storage.getSetting('ai_prompt');
    if (globalPrompt) {
      promptTemplate = globalPrompt;
    }
  }
  
  // Replace template variables with actual values
  const prompt = promptTemplate
    .replace('{{reportDate}}', formData.reportDate)
    .replace('{{projectName}}', formData.projectName)
    .replace('{{worksPerformed}}', formData.worksPerformed)
    .replace('{{labourOnSite}}', formData.labourOnSite)
    .replace('{{plantMachinery}}', formData.plantMachinery || "None specified")
    .replace('{{hoursWorked}}', formData.hoursWorked)
    .replace('{{materialsUsed}}', formData.materialsUsed || "Not specified")
    .replace('{{delaysWeather}}', formData.delaysWeather || "No delays reported")
    .replace('{{safetyIncidents}}', formData.safetyIncidents || "None reported")
    .replace('{{imageCount}}', imageBase64Array.length.toString());

  const messages: any[] = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        ...imageBase64Array.map(base64 => ({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${base64}` }
        }))
      ]
    }
  ];

  console.log(`🤖 Analyzing report with GPT-5 (${imageBase64Array.length} images)...`);
  
  const response = await openai.chat.completions.create({
    model: GPT_5_MODEL,
    max_completion_tokens: 8192,
    messages,
    response_format: { type: "json_object" }
  });

  console.log(`✅ GPT-5 analysis completed successfully`);

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from GPT-5");

  return JSON.parse(content);
}

// Generate a mock analysis when OpenAI API key is not available
function generateMockAnalysis(formData: any, imageBase64Array: string[]): any {
  const date = new Date(formData.reportDate);
  const projectSlug = formData.projectName.replace(/\s+/g, '_').toUpperCase();
  const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
  
  // Parse labour count and worker names from the input
  // Handle formats like "4 × Labourers – Jack, Josh, Daniel & Simon" or "3 workers: John, Jane, Joe"
  let workerNames: string[] = [];
  let totalWorkers = 1;
  
  const labourText = formData.labourOnSite;
  const nameMatch = labourText.match(/[–:-]\s*(.+)$/);
  
  if (nameMatch) {
    // Extract names after the dash/colon
    const namesText = nameMatch[1];
    workerNames = namesText
      .split(/[,&]/)
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0 && !/^\d/.test(name));
    totalWorkers = workerNames.length || 1;
  } else {
    // Try to extract number from format like "4 workers" or "4 × Labourers"
    const countMatch = labourText.match(/(\d+)/);
    totalWorkers = countMatch ? parseInt(countMatch[1]) : 1;
  }
  
  const totalHours = parseFloat(formData.hoursWorked) || 8;
  
  return {
    report_metadata: {
      project_name: formData.projectName,
      report_date: date.toISOString().split('T')[0],
      report_id: `${projectSlug}_${dateString}_DR`
    },
    site_conditions: {
      weather: formData.delaysWeather?.toLowerCase().includes('rain') ? "Rainy" : 
               formData.delaysWeather?.toLowerCase().includes('cloud') ? "Cloudy" : "Clear",
      temperature: "18°C"
    },
    workforce: {
      total_workers: totalWorkers,
      worker_names: workerNames,
      total_hours: totalHours,
      man_hours: totalWorkers * totalHours
    },
    works_summary: {
      title: `Daily Works - ${formData.projectName}`,
      description: formData.worksPerformed,
      key_activities: formData.worksPerformed.split('.').filter((s: string) => s.trim()).slice(0, 5)
    },
    materials: {
      items_used: formData.materialsUsed 
        ? formData.materialsUsed.split(',').map((item: string) => ({
            material: item.trim(),
            quantity: "As per specification",
            unit: "various"
          }))
        : []
    },
    plant_equipment: {
      equipment_used: formData.plantMachinery
        ? formData.plantMachinery.split(',').map((e: string) => e.trim())
        : []
    },
    quality_compliance: {
      compliance_status: "Works performed in accordance with VicRoads standards and project specifications"
    },
    safety_incidents: {
      incidents_reported: formData.safetyIncidents?.toLowerCase() !== 'none' && 
                          formData.safetyIncidents?.toLowerCase() !== 'none reported'
        ? [formData.safetyIncidents]
        : [],
      safety_observations: "All safety protocols followed. Site personnel wearing required PPE."
    },
    delays_issues: {
      delays: formData.delaysWeather?.toLowerCase() !== 'none' && 
              formData.delaysWeather?.toLowerCase() !== 'no delays'
        ? [formData.delaysWeather]
        : [],
      impact: formData.delaysWeather?.toLowerCase().includes('delay') ? "Minor schedule impact" : "No impact"
    },
    photo_documentation: {
      total_images: imageBase64Array.length,
      image_descriptions: imageBase64Array.map((_, index) => 
        `Site photo ${index + 1} - Construction works in progress showing ${formData.projectName} activities`
      )
    },
    next_day_plan: {
      scheduled_works: [
        "Continue with current phase of construction",
        "Quality inspections and compliance checks",
        "Coordinate material deliveries as scheduled"
      ]
    }
  };
}
