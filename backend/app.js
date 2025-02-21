require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/db");
const transcriptionRoutes = require("./src/routes/transcription");
// const actionsRoutes = require("./src/routes/actionsRoutes");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/uploads", transcriptionRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
