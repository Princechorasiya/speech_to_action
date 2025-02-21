const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const extractTasks = async (transcript) => {
	if (!transcript) {
		throw new Error("Transcript is required");
	}

	const prompt = `Extract tasks from the transcript and provide due dates, responsible persons, priority, and if they can be scheduled. Return a valid JSON object with only the JSON, nothing else:
	{
	  "tasks": [
	    { "title": "Task title", "description": "Task details", "due_date": "YYYY-MM-DD", "assigned_to": "Person name", "priority": "High/Medium/Low", "canSchedule": true/false }
	  ]
	}
	DO NOT include explanations, formatting, or extra text.
	Transcript: ${transcript}`;

	try {
		const result = await model.generateContent(prompt);
		let data = await result.response.text();

		// Extract only the JSON part using regex
		const jsonMatch = data.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error("No valid JSON found in response");
		}

		const cleanJson = jsonMatch[0].trim(); // Remove any extra whitespace

		// Parse the JSON safely
		const parsedData = JSON.parse(cleanJson);

		if (!parsedData.tasks || !Array.isArray(parsedData.tasks)) {
			throw new Error("Invalid task format");
		}

		return parsedData.tasks;
	} catch (error) {
		console.error("Error with Gemini API:", error.message);
		return []; // Return an empty array to prevent failures
	}
};

module.exports = extractTasks;
