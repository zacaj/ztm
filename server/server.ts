import * as mysql from 'mysql2/promise';
import express, { Express } from 'express';
import { OkPacket, RowDataPacket } from 'mysql2/promise';
const cors = require('cors');

const app = express();
let conn: mysql.Connection;

app.use(express.json());
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Method', 'GET, PUT, OPTIONS');
//   next();
// })

app.use(cors());

async function getLatestTournament(id: string) {
  const [rows, fields] = await conn.query(`
    SELECT t.*, d.* FROM tournaments t 
    INNER JOIN data d ON t.id = d.tournament_id 
    LEFT OUTER JOIN data d2 ON d.tournament_id = d2.tournament_id AND d.version < d2.version 
    WHERE id = ? AND d2.tournament_id IS NULL`
  , [id]);
  const row = (rows as RowDataPacket[])[0];
  return row;
}

app.get('/tournaments/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const row = await getLatestTournament(id);
    if (!row)
      res.status(404).send();
    else
      res.send(row);
  }
  catch (err) {
    console.error('error getting tournament with id %s', id, err);
    res.status(500).send(err);
  }
});

app.put('/tournaments', async (req, res) => {
  const id = req.body.id;
  const version = req.body.version;
  try {
    if (!id || !version) {
      res.status(400).send('invalid payload');
      return;
    }
    const cur = await getLatestTournament(id);
    if (!cur)
      res.status(404).send();
    else if (cur.version !== version-1) {
      res.status(400).send(cur);
      return;
    }
    const [r, fields] = await conn.query(`INSERT INTO data (tournament_id, version, json) VALUES (?, ?, ?)`, [id, version, JSON.stringify(req.body, null, 2)]);
    const rows = (r as OkPacket).affectedRows;
    if (!rows)
      res.status(404).send();
    else
      res.send(await getLatestTournament(id));
  }
  catch (err) {
    console.error('error getting tournament with id %s', id, err);
    res.status(500).send(err);
  }
});

async function connect() {
  conn = await mysql.createConnection({
    host: 'localhost',
    user: 'ztm',
    database: 'ztm',
    password: 'ztm',
  });
  conn.on('error', err => {
    console.error('connection error ', err);
    void connect();
  });
  console.log('connected to db');
}

connect()
.then(async () => {
  await new Promise<void>(r => app.listen(3000, r));
  console.log('listening on port 3000');
})
.catch(err => {
  console.error('fatal error!', err);
});
