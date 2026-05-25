import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface DiagnosisResponse {
  category: string;
  urgency: string;
  estimated_issue: string;
  recommended_tools: string[];
}

@Injectable()
export class AiDiagnosisService {
  private readonly logger = new Logger(AiDiagnosisService.name);

  constructor(private readonly configService: ConfigService) {}

  async diagnoseIssue(description: string): Promise<DiagnosisResponse> {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openaiModel = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o');
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    const anthropicModel = this.configService.get<string>('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514');

    const systemPrompt = `You are a master field service technician. Analyze the customer's plain text description of their problem.
You must return a single, structured JSON object with exactly the following keys:
- category: A string representing the trade category. It must be one of: "HVAC", "Plumbing", "Electrical", "Roofing", "Appliance", "General", "Other". Select the most appropriate category based on the description.
- urgency: A string representing the urgency level. It must be one of: "Low", "Medium", "High", "Critical".
- estimated_issue: A short (1-2 sentences), highly professional summary of the estimated physical issue based on the symptoms described.
- recommended_tools: A list of specific tools, parts, or diagnostic equipment (as strings) that a field technician should bring to diagnose or repair this issue.

Response Requirements:
- Do not output any markdown code blocks, backticks (e.g. \`\`\`json), or explanations outside of the JSON.
- Return ONLY the raw JSON string.
- Your response must be parseable by standard JSON.parse().`;

    // 1. Try OpenAI if configured
    if (openaiKey && openaiKey.trim().length > 0) {
      try {
        this.logger.log(`Initiating OpenAI AI Diagnosis using model ${openaiModel}`);
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: openaiModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: description },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiKey}`,
            },
            timeout: 10000,
          }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        return this.parseAndSanitizeJson(content);
      } catch (err) {
        this.logger.error(`OpenAI Diagnosis failed: ${err.message}`);
        // If Anthropic is also available, we let it fall through, otherwise throw
        if (!anthropicKey || anthropicKey.trim().length === 0) {
          throw new InternalServerErrorException(`AI Diagnosis failed: ${err.message}`);
        }
      }
    }

    // 2. Try Anthropic if configured
    if (anthropicKey && anthropicKey.trim().length > 0) {
      try {
        this.logger.log(`Initiating Anthropic AI Diagnosis using model ${anthropicModel}`);
        const response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: anthropicModel,
            system: systemPrompt,
            messages: [{ role: 'user', content: description }],
            max_tokens: 1000,
            temperature: 0.2,
          },
          {
            headers: {
              'content-type': 'application/json',
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
            },
            timeout: 10000,
          }
        );

        const content = response.data?.content?.[0]?.text;
        if (!content) {
          throw new Error('Empty response from Anthropic');
        }

        return this.parseAndSanitizeJson(content);
      } catch (err) {
        this.logger.error(`Anthropic Diagnosis failed: ${err.message}`);
        throw new InternalServerErrorException(`AI Diagnosis failed: ${err.message}`);
      }
    }

    // 3. Heuristic Mock Fallback (if no API keys are provided)
    this.logger.warn('No OpenAI or Anthropic API keys configured in .env. Running local expert heuristic engine for diagnosis.');
    return this.getMockHeuristicDiagnosis(description);
  }

  private parseAndSanitizeJson(rawText: string): DiagnosisResponse {
    let sanitizedText = rawText.trim();
    
    // Strip markdown formatting if the model returned it
    if (sanitizedText.startsWith('```')) {
      sanitizedText = sanitizedText.replace(/^```(json)?\n?/, '');
      sanitizedText = sanitizedText.replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(sanitizedText.trim());
      
      // Ensure all fields exist with fallback values
      return {
        category: typeof parsed.category === 'string' ? parsed.category : 'Other',
        urgency: typeof parsed.urgency === 'string' ? parsed.urgency : 'Medium',
        estimated_issue: typeof parsed.estimated_issue === 'string' ? parsed.estimated_issue : 'General inspection required.',
        recommended_tools: Array.isArray(parsed.recommended_tools) ? parsed.recommended_tools : ['Standard toolkit'],
      };
    } catch (err) {
      this.logger.error(`Failed to parse LLM JSON: ${sanitizedText}`, err.stack);
      throw new InternalServerErrorException('AI returned an invalid JSON response format.');
    }
  }

  private getMockHeuristicDiagnosis(description: string): DiagnosisResponse {
    const lower = description.toLowerCase();

    // HVAC Heuristic
    if (
      lower.includes('cool') ||
      lower.includes('heat') ||
      lower.includes(' ac') ||
      lower.includes('air cond') ||
      lower.includes('furnace') ||
      lower.includes('thermostat') ||
      lower.includes('fan') ||
      lower.includes('compressor') ||
      lower.includes('hvac')
    ) {
      return {
        category: 'HVAC',
        urgency: lower.includes('smoke') || lower.includes('freezing') || lower.includes('burning') ? 'Critical' : 'High',
        estimated_issue: 'Climate control system malfunction, potentially due to a refrigerant leak, thermostat calibration error, or compressor blockage.',
        recommended_tools: ['Digital Multimeter', 'Manifold Gauge Set', 'Refrigerant Leak Detector', 'A/C Fin Comb', 'Replacement Air Filters'],
      };
    }

    // Plumbing Heuristic
    if (
      lower.includes('leak') ||
      lower.includes('pipe') ||
      lower.includes('water') ||
      lower.includes('drain') ||
      lower.includes('clog') ||
      lower.includes('faucet') ||
      lower.includes('sink') ||
      lower.includes('toilet') ||
      lower.includes('shower') ||
      lower.includes('flood')
    ) {
      return {
        category: 'Plumbing',
        urgency: lower.includes('flood') || lower.includes('burst') || lower.includes('gushing') ? 'Critical' : 'High',
        estimated_issue: 'Fluid containment failure or drain pipeline obstruction causing pressure build-up and leaks.',
        recommended_tools: ['Adjustable Pipe Wrench', 'Thread Seal Tape (Teflon)', 'Plumbing Snake (Auger)', 'Plunger', 'Replacement Washers and Gaskets'],
      };
    }

    // Electrical Heuristic
    if (
      lower.includes('wire') ||
      lower.includes('power') ||
      lower.includes('switch') ||
      lower.includes('outlet') ||
      lower.includes('breaker') ||
      lower.includes('fuse') ||
      lower.includes('electric') ||
      lower.includes('spark') ||
      lower.includes('shock') ||
      lower.includes('light')
    ) {
      return {
        category: 'Electrical',
        urgency: lower.includes('spark') || lower.includes('smoke') || lower.includes('fire') ? 'Critical' : 'High',
        estimated_issue: 'Electrical circuit disruption or load imbalance, indicating a possible short-circuit, damaged insulation, or breaker failure.',
        recommended_tools: ['Non-Contact Voltage Tester', 'Insulated Screwdriver Set', 'Wire Strippers', 'Electrical Tape', 'Digital Multimeter'],
      };
    }

    // Roofing Heuristic
    if (
      lower.includes('roof') ||
      lower.includes('shingle') ||
      lower.includes('ceiling') ||
      lower.includes('gutter') ||
      lower.includes('chimney')
    ) {
      return {
        category: 'Roofing',
        urgency: lower.includes('gushing') || lower.includes('storm') ? 'High' : 'Medium',
        estimated_issue: 'External building envelope breach allowing atmospheric water intrusion, likely from loose shingles or damaged roof valleys.',
        recommended_tools: ['Safety Harness & Lanyard', 'Roofing Hammer', 'Pry Bar', 'Silicone Waterproof Sealant', 'Roofing Nails'],
      };
    }

    // Appliance Heuristic
    if (
      lower.includes('fridge') ||
      lower.includes('refrigerator') ||
      lower.includes('washer') ||
      lower.includes('dryer') ||
      lower.includes('oven') ||
      lower.includes('stove') ||
      lower.includes('dishwasher') ||
      lower.includes('appliance')
    ) {
      return {
        category: 'Appliance',
        urgency: lower.includes('leak') || lower.includes('warm') ? 'Medium' : 'Low',
        estimated_issue: 'Appliance subsystem failure, likely involving a heating element, control board relay, or pump motor wear.',
        recommended_tools: ['Nut Driver Set', 'Socket Wrench Set', 'Appliance Dolly', 'Replacement Thermal Fuses', 'Screwdriver Set'],
      };
    }

    // General Heuristic
    if (
      lower.includes('lock') ||
      lower.includes('key') ||
      lower.includes('door') ||
      lower.includes('window') ||
      lower.includes('hinge') ||
      lower.includes('wall') ||
      lower.includes('paint') ||
      lower.includes('cabinet') ||
      lower.includes('drywall') ||
      lower.includes('gate')
    ) {
      return {
        category: 'General',
        urgency: lower.includes('broken lock') || lower.includes('shattered') ? 'High' : 'Low',
        estimated_issue: 'General facility maintenance requirement involving minor hardware misalignment, physical wear, or cosmetic degradation.',
        recommended_tools: ['Utility Knife', 'Cordless Drill & Bits', 'Measuring Tape', 'Hand Saw', 'Wood Glue / Adhesive'],
      };
    }

    // Default Fallback
    return {
      category: 'Other',
      urgency: 'Medium',
      estimated_issue: 'General mechanical or technical malfunction. Requires on-site manual diagnosis to identify root causes.',
      recommended_tools: ['Standard Mechanic Toolkit', 'High-Lumen Flashlight', 'Measuring Tape', 'Inspection Mirror', 'Diagnostic Notepad'],
    };
  }
}
