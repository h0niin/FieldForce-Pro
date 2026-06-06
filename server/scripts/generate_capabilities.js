const fs = require('fs');
const path = require('path');

const knowledgeDir = path.join(__dirname, '../docs/fsm-knowledge');
const outputFile = path.join(__dirname, '../docs/fsm-capabilities.json');

function collectFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(collectFiles(filePath));
    } else if (file.endsWith('.md') && file.toLowerCase() !== 'readme.md' && !file.toLowerCase().includes('index')) {
      results.push(filePath);
    }
  }
  return results;
}

function extractCapabilities() {
  const files = collectFiles(knowledgeDir);
  const capabilities = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const filename = path.basename(file, '.md');
    
    // Split by `## ` to separate major sections in a file
    const sections = content.split(/^##\s+/m);
    
    // If the file starts without a `## `, sections[0] is the intro or the whole file
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;

      const lines = section.split('\n').map(l => l.trim());
      const titleLine = lines[0]; // The heading text
      const titleMatch = titleLine.match(/^[A-Z0-9\-]+:\s*(.*)$/i) || titleLine.match(/^(.*)$/);
      let title = titleMatch ? titleMatch[1] : titleLine;
      
      // If it's the first section and starts with `# `, strip it for the title
      if (i === 0 && title.startsWith('# ')) {
        title = title.substring(2);
      }

      let intent_name = `${filename}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 50)}`;
      const user_questions = [
        title.toLowerCase().replace('how to ', '')
      ];
      const user_symptoms = [];
      const exact_steps = [];
      let prerequisites = "None.";
      
      let inSymptoms = false;
      let inSteps = false;

      for (let j = 1; j < lines.length; j++) {
        const line = lines[j];
        
        if (line.startsWith('**Prerequisites:**') || line.startsWith('**Important Note:**')) {
          prerequisites = line.replace(/^\*\*(Prerequisites|Important Note):\*\*\s*/i, '').trim();
          inSymptoms = false;
          inSteps = false;
        } else if (line.startsWith('**Symptoms:**')) {
          inSymptoms = true;
          inSteps = false;
        } else if (inSymptoms && line.startsWith('- "')) {
          // Extract symptom phrase
          const symptom = line.match(/- "(.*)"/);
          if (symptom) user_symptoms.push(symptom[1]);
        } else if (/^\d+\.\s/.test(line)) {
          let cleanedLine = line
            .replace(/\([^\)]*(primary|htmlType|tooltip|label|Outlined|isPending)[^\)]*\)/g, '')
            .replace(/`[^`]*(isPending|htmlType|Outlined)[^`]*`/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          exact_steps.push(cleanedLine);
          inSteps = true;
          inSymptoms = false;
        } else if (inSteps && line !== '' && !line.startsWith('---') && !line.startsWith('>')) {
          if (exact_steps.length > 0) {
            let cleanedLine = line
              .replace(/\([^\)]*(primary|htmlType|tooltip|label|Outlined|isPending)[^\)]*\)/g, '')
              .replace(/`[^`]*(isPending|htmlType|Outlined)[^`]*`/g, '')
              .replace(/\s{2,}/g, ' ')
              .trim();
            if (cleanedLine) {
              exact_steps[exact_steps.length - 1] += '\n' + cleanedLine;
            }
          }
        } else if (line.startsWith('##') || line.startsWith('# ')) {
          inSymptoms = false;
          inSteps = false;
        } else if (line !== '' && !inSteps && !inSymptoms) {
           // We'll capture general knowledge text as step 1 if there are no explicit steps
           if (exact_steps.length === 0) {
               exact_steps.push(line);
           } else if (!/^\d+\.\s/.test(exact_steps[0])) {
               exact_steps[0] += '\n' + line;
           }
        }
      }

      capabilities.push({
        intent_name,
        user_questions,
        user_symptoms,
        prerequisites,
        exact_steps
      });
    }
  }

  // Ensure the impossible conversion intent is strictly present
  const conversionIntent = capabilities.find(c => c.intent_name.includes("convert_a_work_order_to_an_estimate"));
  if (!conversionIntent) {
      capabilities.push({
          "intent_name": "convert_work_order_to_estimate_impossible",
          "user_questions": ["convert a work order to an estimate"],
          "user_symptoms": [],
          "prerequisites": "In FieldForce Pro, **you cannot convert a Work Order to an Estimate**. The system does not support backward conversion.",
          "exact_steps": [
              "1. You must create an Estimate first.",
              "2. Once the Estimate is approved, you can convert it to a Work Order.",
              "3. Converting a Work Order to an Estimate is not supported."
          ]
      });
  }

  fs.writeFileSync(outputFile, JSON.stringify(capabilities, null, 2), 'utf-8');
  console.log(`Successfully generated ${capabilities.length} capabilities from ${files.length} files into ${outputFile}`);
}

extractCapabilities();
