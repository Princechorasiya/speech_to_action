const Event = require("../models/Events");

const createLocalEvent = async (task) => {
	try {
		const startTime = new Date();
		let endTime;

		// Handle recurring events
		let recurrence = null;
		if (["Daily", "Weekly", "Monthly"].includes(task.due_date)) {
			recurrence = task.due_date; // Store recurrence rule
			endTime = new Date(); // No fixed end time for recurring tasks
		} else if (task.due_date instanceof Date) endTime = new Date(task.due_date);
		else endTime = new Date();

		const event = new Event({
			title: task.title,
			description: task.description,
			start_time: startTime,
			end_time: endTime,
			assigned_to: task.assigned_to,
			priority: task.priority,
			task_id: task._id,
			recurrence: recurrence,
			transcriptionId: task.transcriptionId,
		});

		await event.save();
		return event;
	} catch (error) {
		console.error("Error creating event:", error);
		return null;
	}
};

module.exports = createLocalEvent;
