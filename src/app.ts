import express from 'express';
import { createServer } from 'http';
import bodyParser from "body-parser";
import CHAT from './routes/CHAT.routes';
import { initWebSocketManager } from "./service/webSocket/websocketManagerInstance";
// import cors from "cors";
import { WebSocketService } from './service/webSocket/websocket.service';

const app = express();

const server = createServer(app);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

// app.use(cors({ origin: 'http://localhost:4700' }));

app.use('/img', express.static('img'));

app.use(CHAT);

const wsManager = initWebSocketManager(server);

new WebSocketService(wsManager);

server.listen(5801, () => {
  console.log('Server Web Socket on port', 5801 + ', http://localhost:' + 5801);
});

export default app;