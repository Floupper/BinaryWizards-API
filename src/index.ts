import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import * as quizzesHandler from './RequestHandlers/quizzesHandler';
import * as categoriesHandler from './RequestHandlers/categoriesHandler';
import * as difficultiesHandler from './RequestHandlers/difficultiesHandler';
import * as questionsHandler from './RequestHandlers/questionsHandler';

const config = require('./Data/config.json');

const fs = require('fs');
const https = require('https');

const app = express();
const port = config[0].port;

const sslOptions = {
  key: fs.readFileSync('../../certificat.key'),
  cert: fs.readFileSync('../../certificat-privkey.cert')
};

// Créer le serveur HTTPS et écouter sur un port sécurisé (ex. 33012)
https.createServer(sslOptions, app).listen(33012, () => {
  console.log('Serveur HTTPS lancé sur le port 33012');
});

app.use(cors());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Expose-Headers', 'Count');
  next();
});
app.use(express.json());

app.post('/quiz', quizzesHandler.create_one as (req: Request, res: Response) => Promise<void>);
app.put('/quiz/:quiz_id', quizzesHandler.reset_quiz as (req: Request, res: Response) => Promise<void>);

app.get('/categories', categoriesHandler.get_all);
app.get('/difficulties', difficultiesHandler.get_all);

app.get('/quiz/:quiz_id/question', questionsHandler.get_one as (req: Request, res: Response) => Promise<void>);
app.post('/quiz/:quiz_id/:question_id', questionsHandler.send_answer as (req: Request, res: Response) => Promise<void>);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});