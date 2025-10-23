import express from "express";

const app = express();

app.get("/", (_req, res) => {
  res.send("API Synerhgie OK ✅");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});