import app from "./app.js";
import process from "process";
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server listening on", PORT));
