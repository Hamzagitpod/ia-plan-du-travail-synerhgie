// Fix: Changed import to use namespace to avoid type conflicts with global Response type.
import * as express from "express";

const app = express();

app.get("/", (_req: express.Request, res: express.Response) => {
  res.send("API Synerhgie OK ✅");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
