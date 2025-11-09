import OpenAI from "openai";

// This is using OpenAI's API, which requires your own API key
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function analyzeReport(formData: any, imageBase64Array: string[]) {
  // If OpenAI API key is not configured, return a mock analysis
  if (!openai) {
    console.warn("⚠️ OPENAI_API_KEY not configured - using mock AI analysis");
    return generateMockAnalysis(formData, imageBase64Array);
  }
  const prompt = `You are a construction site documentation assistant. Using the provided JSON data and site photos, create a professional daily site report in a consistent JSON structure.

**INPUT DATA:**
Date: ${formData.reportDate}
Project: ${formData.projectName}
Works Performed: ${formData.worksPerformed}
Labour on Site: ${formData.labourOnSite}
Plant & Machinery: ${formData.plantMachinery || "None specified"}
Hours Worked: ${formData.hoursWorked}
Materials Used: ${formData.materialsUsed || "Not specified"}
Delays/Weather: ${formData.delaysWeather || "No delays reported"}
Safety Incidents: ${formData.safetyIncidents || "None reported"}

**IMAGES:**
${imageBase64Array.length} site photos are attached showing today's works.

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

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    max_completion_tokens: 8192,
    messages,
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from GPT-5");

  return JSON.parse(content);
}

// Generate a mock analysis when OpenAI API key is not available
function generateMockAnalysis(formData: any, imageBase64Array: string[]): any {
  const date = new Date(formData.reportDate);
  const projectSlug = formData.projectName.replace(/\s+/g, '_').toUpperCase();
  const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
  
  // Parse labour count from the input
  const labourParts = formData.labourOnSite.split(',').map((s: string) => s.trim());
  const totalWorkers = labourParts.length;
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
      worker_names: labourParts,
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
