import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
const openai = new OpenAI({apiKey: process.env.OPEN_AI_KEY});

const PROMPT_FILE = "prompts.json";

// Load old prompts
let usedPrompts = [];
if (fs.existsSync(PROMPT_FILE)) {
  usedPrompts = JSON.parse(fs.readFileSync(PROMPT_FILE, "utf-8"));
}

async function generatePrompt(includeSam) {
  const characterContext = `
There is a curly red hair character named Ryan "Slippy" Beatled. He is a senior mechanical engineering student at UW. 
He likes to play video games (League of Legends mostly) and watch football. He struggles with intuitive tasks and is often the butt of the joke. 
He loves chocolate milk and Cheez-Its.

Sometimes his best friend Sam appears. Sam is witty, intuitive, and much better at video games. He often gets mad at Slippy for his incompetence, both in games and in real life.
  `;

  let systemMessage = "You are a comic strip writer. Generate a single-sentence idea for a daily comic panel.";
  let userMessage = `${characterContext}\n\nGenerate a comic strip idea about Slippy's daily college life.`;

  if (includeSam) {
    userMessage += " This one should include Sam as well.";
  }

  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ],
    max_tokens: 80,
  });

  const newPrompt = result.choices[0].message.content.trim();

  // Ensure uniqueness
  if (usedPrompts.includes(newPrompt)) {
    console.log("⚠️ Duplicate prompt detected, regenerating...");
    return generatePrompt(includeSam);
  }

  usedPrompts.push(newPrompt);
  fs.writeFileSync(PROMPT_FILE, JSON.stringify(usedPrompts, null, 2));

  return newPrompt;
}

async function generateImage(prompt, referencedImageIds) {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: `Comic strip panel, cartoon style. ${prompt}`,
    size: "512x512",
    response_format: "b64_json",
    referenced_image_ids: referencedImageIds
  });

  const image_base64 = result.data[0].b64_json;
  const buffer = Buffer.from(image_base64, "base64");

  const filename = `comic_${Date.now()}.png`;
  fs.writeFileSync(filename, buffer);

  return filename;
}

async function main() {
  // Upload character references
  const slippyUpload = await openai.files.create({
    file: fs.createReadStream("slippy.png"),
    purpose: "vision"
  });

  const referencedImageIds = [slippyUpload.id];

  // 40% chance Sam appears
  const includeSam = Math.random() < 0.4;
  if (includeSam) {
    const samUpload = await openai.files.create({
      file: fs.createReadStream("sam.png"),
      purpose: "vision"
    });
    referencedImageIds.push(samUpload.id);
  }

  // Generate prompt + image
  const newPrompt = await generatePrompt(includeSam);
  const filename = await generateImage(newPrompt, referencedImageIds);

  console.log(`✅ New comic generated: ${filename}`);
  console.log(`📝 Prompt: ${newPrompt}`);
  if (includeSam) console.log("👬 Sam appeared in this one!");
}

main();
