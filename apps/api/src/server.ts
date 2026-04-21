import "dotenv/config";
import { app } from "./app";
import "./workers/payrollWorker";

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`NovaPay API running at http://localhost:${port}`);
});
