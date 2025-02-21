const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
	title: String,
	description: String,
	start_time: Date,
	end_time: Date,
	assigned_to: String,
	priority: String,
	task_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Task",
	},
	recurrence: {
		type: String, // "Daily", "Weekly", "Monthly"
		default: null,
	},
	transcriptionId: {
		type: String,
		default: null,
	},
});

module.exports = mongoose.model("Event", EventSchema);
