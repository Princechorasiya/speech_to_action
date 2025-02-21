const axios = require("axios");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const extractTasks = async (transcript) => {
	const prompt = `Extract tasks from the transcript and provide due dates, responsible persons, priority, and if they can be scheduled. Return ONLY valid JSON (no explanations, no text before or after):
  {
    "tasks": [
      { "title": "Task title", "description": "Task details", "due_date": "YYYY-MM-DD", "assigned_to": "Person name", "priority": "High/Medium/Low", "canSchedule": true/false }
    ]
  }
  Transcript: ${transcript}`;

	try {
		const result = await model.generateContent(prompt);
		let data = await result.response.text();

		console.log("Raw API Response:", data);

		// Clean unwanted markdown or text
		data = data.replace(/```json|```/g, "").trim();

		// Ensure valid JSON
		const parsedData = JSON.parse(data);
		if (!parsedData.tasks || !Array.isArray(parsedData.tasks)) {
			throw new Error("Invalid JSON structure");
		}

		return parsedData.tasks;
	} catch (error) {
		console.error("Error with Gemini API:", error.message);
		return [];
	}
};

extractTasks(`
  Alright team, let's wrap this up. Also, sdfkjsd fsdj! 
  - Mike, ughh yeah budget... report? EOD Friday, don't forget!
  - Sarah, UX feedback—Tuesday, right? No? Ahh, check it please.
  - Vendor stuff... mid-next week? James, legal follow-up, make it happen.
  - %&*(!! oh deployment? Monday, confirm. DevOps knows? Who knows.
  - Yeah yeah, lunch on Thursday! But wait, sdfkjsdfj can't forget the server reboot.
  - 3094jefw sldfj23 sdklfj secret feature launch. Top priority. Thursday. Midnight.
  - "John, get the API keys ASAP!!! Production blocked!!" 
  - Sally said she'd help but idk anymore. Can someone remind her?
`)
	.then((tasks) => console.log("Extracted Tasks:", tasks))
	.catch((err) => console.error("Extraction Error:", err));

module.exports = { extractTasks };
