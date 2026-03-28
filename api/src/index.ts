import 'dotenv/config';

import { app } from './app.js';

const rawPort = process.env.PORT;
const port = rawPort !== undefined && rawPort !== '' ? Number(rawPort) : 3000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT: ${rawPort ?? '(empty)'}`);
}

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
