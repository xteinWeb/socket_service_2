import 'dotenv/config'
import { app, server } from './app';

const PORT = app.get('port') || 5801;

server.listen(PORT, () => {
  console.log('Server HTTP and WebSocket listening on port ' + PORT);
});