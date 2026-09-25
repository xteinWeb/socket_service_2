import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
import { app, server } from './app';

const PORT = app.get('port') || 5801;

server.listen(PORT, () => {
  console.log('Server HTTP and WebSocket listening on port ' + PORT);
});