const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const getSummary = async (transcript) => {
	if (!transcript) {
		throw new Error("Transcript is required");
	}

	const prompt = `Summarize the following transcript. Return a concise summary in plain text:
  Transcript: ${transcript}`;

	try {
		const result = await model.generateContent(prompt);
		let data = await result.response.text();

		// Clean the response if necessary
		data = data.replace(/```/g, "").trim();

		return data; // Return the summary as plain text
	} catch (error) {
		console.error("Error with Gemini API:", error.message);
		return null; // Return null on failure
	}
};

module.exports = getSummary; // Export the function correctly
