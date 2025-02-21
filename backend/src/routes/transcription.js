const express = require("express");
const fs = require("fs");
const { createClient } = require("@deepgram/sdk");
const Transcription = require("../models/Transcription");
const upload = require("../middleware/upload");
const extractTasks = require("../middleware/task_extractor");
const createLocalEvent = require("../service/eventService");
const Task = require("../models/Task");
const Event = require("../models/Events");
const getSummary = require("../middleware/getSummary");

const router = express.Router();

// Route to handle file upload and transcription
router.post("/upload", upload.single("audio"), async (req, res) => {
	// Check if a file was uploaded
	if (!req.file) return res.status(400).json({ error: "No file uploaded" });

	const filePath = req.file.path; // Get the file path of the uploaded file
	const deepgram = createClient(process.env.DEEPGRAM_API_KEY); // Create a Deepgram client using the API key

	try {
		// Transcribe the audio file using Deepgram's API
		const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
			fs.readFileSync(filePath), // Read the file content
			{ model: "nova-3", smart_format: true } // Specify the transcription model and options
		);

		// Throw an error if the transcription failed
		if (error) throw error;
		const summary = await getSummary(
			result.results.channels[0].alternatives[0].transcript
		);
		// Create a new Transcription document with the file path and transcript
		const transcription = new Transcription({
			filePath,
			transcript: result.results.channels[0].alternatives[0].transcript,
			summary: summary,
		});
		await transcription.save(); // Save the transcription to the database

		// Send the transcription ID and transcript as a JSON response
		res.json({
			id: transcription._id,
			transcript: transcription.transcript,
			summary: summary,
		});
	} catch (err) {
		// Handle any errors that occurred during the process
		res.status(500).json({ error: err.message });
	}
});

router.get("/transcription/:id", async (req, res) => {
	try {
		const transcription = await Transcription.findById(req.params.id);
		if (!transcription) return res.status(404).json({ error: "Not found" });
		res.json(transcription);
	} catch (err) {
		res.status(500).json({ error: "Error retrieving transcription" });
	}
});

router.put("/transcription/:id", async (req, res) => {
	try {
		const transcription = await Transcription.findByIdAndUpdate(
			req.params.id,
			{ transcript: req.body.transcript },
			{ new: true }
		);
		if (!transcription) return res.status(404).json({ error: "Not found" });
		res.json(transcription);
	} catch (err) {
		res.status(500).json({ error: "Error updating transcription" });
	}
});

router.post("/extract-tasks/:id", async (req, res) => {
	try {
		// Fetch transcription from DB
		const transcription = await Transcription.findById(req.params.id);
		if (!transcription) {
			return res.status(404).json({ error: "Transcription not found" });
		}

		// Extract tasks using Gemini API
		// console.log("transcription.text", transcription.transcript);

		const tasks = await extractTasks(transcription.transcript);
		console.log("tasks", tasks);

		const savedTasks = await Promise.all(
			tasks.map(async (task) => {
				const newTaskData = {
					...task,
					transcriptionId: req.params.id,
				};

				const newTask = await Task.create(newTaskData);
				console.log("newTask", newTask);
				// If the task can be scheduled, create an event
				if (task.canSchedule) {
					const event = await createLocalEvent(newTask);
					if (event) {
						newTask.event_id = event._id;
						await newTask.save();
					}
				}

				return newTask;
			})
		);

		res.status(200).json({ tasks: savedTasks });
		// } else res.status(201).json({ status: false, message: "No tasks found" });
	} catch (err) {
		console.error("Error extracting tasks:", err);
		res.status(500).json({ error: "Error extracting tasks" });
	}
});

router.get("/events/:id", async (req, res) => {
	try {
		const events = await Event.find({
			transcriptionId: req.params.id,
		});
		console.log("events", events);
		res.status(200).json({ events: events });
		// res.status(200).json({ message: "Events route" });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router; // Export the router
