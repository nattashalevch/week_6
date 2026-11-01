export default function (express, bodyParser, createReadStream, crypto, http, mongoose) {
  const app = express();
  const LOGIN = 'nata_levch';

  app.use((req, res, next) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS,DELETE',
      'Access-Control-Allow-Headers': 'x-test,ngrok-skip-browser-warning,Content-Type,Accept,Access-Control-Allow-Headers'
    });
    next();
  });

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.get('/login/', (req, res) => {
    res.type('text/plain').send(LOGIN);
  });

  app.get('/code/', (req, res) => {
    res.type('text/plain');
    createReadStream(import.meta.url.substring(7)).pipe(res);
  });

  app.get('/sha1/:input/', (req, res) => {
    const hash = crypto.createHash('sha1').update(req.params.input).digest('hex');
    res.type('text/plain').send(hash);
  });

  const fetchAddr = (req, res) => {
    const addr = (req.body && req.body.addr) || req.query.addr;
    res.type('text/plain');
    try {
      http
        .get(addr, (remote) => {
          let data = '';
          remote.setEncoding('utf8');
          remote.on('data', (chunk) => {
            data += chunk;
          });
          remote.on('end', () => {
            res.send(data);
          });
        })
        .on('error', () => {
          res.status(500).send(LOGIN);
        });
    } catch (e) {
      res.status(500).send(LOGIN);
    }
  };

  app.route('/req/').get(fetchAddr).post(fetchAddr);

  app.post('/insert/', async (req, res) => {
    res.type('text/plain');
    const { login, password, URL } = req.body;
    let conn;
    try {
      conn = await mongoose.createConnection(URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      const User = conn.model(
        'User',
        new mongoose.Schema({ login: String, password: String }),
        'users'
      );
      await User.create({ login, password });
      res.send('OK');
    } catch (e) {
      res.status(500).send(String(e.message));
    } finally {
      if (conn) {
        await conn.close();
      }
    }
  });

  app.all('*', (req, res) => {
    res.type('text/plain').send(LOGIN);
  });

  return app;
}
