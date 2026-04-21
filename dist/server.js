"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = require("./app.js");
const port = Number(process.env.PORT ?? 3000);
app_js_1.app.listen(port, () => {
    console.log(`NovaPay API running at http://localhost:${port}`);
});
