import { hibidRouter } from './api/hibid-api.js';
import { aiServiceRouter } from './api/ai-service-api.js';
import cors from "cors";
import express from 'express';
import { dbRouter } from './api/db-api.js';

const PORT = 8080;
const corsOptions = {
  origin: '*',
  credentials: true
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/hibid", hibidRouter);
app.use('/ai-service', aiServiceRouter);
app.use("/db", dbRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// graphql
// jquery
// rest
// other
// playwrite for interacting with sites that are dynamic