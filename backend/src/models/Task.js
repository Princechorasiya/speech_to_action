const mongoose = require("mongoose");
const Transcription = require("./Transcription");

const TaskSchema = new mongoose.Schema({
	title: String,
	description: String,
	due_date: String,
	assigned_to: String,
	priority: String,
	canSchedule: Boolean,
	transcriptionId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Transcript",
	},
	event_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Event",
		default: null,
	}, // Store event reference
});

module.exports = mongoose.model("Task", TaskSchema);
