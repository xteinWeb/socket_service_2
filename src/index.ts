import 'dotenv/config'
import app from './app';

app.listen(app.get('port'));

// console.log('Server Socket.IO on port', app.get('port')+', http://localhost:'+app.get('port'));