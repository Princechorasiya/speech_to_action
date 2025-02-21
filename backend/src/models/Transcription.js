const mongoose = require("mongoose");

const TranscriptionSchema = new mongoose.Schema({
	filePath: String,
	transcript: String,
	summary: String,
});

module.exports = mongoose.model("Transcription", TranscriptionSchema);
