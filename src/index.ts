import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import * as quizzesHandler from './RequestHandlers/quizzesHandler';
import * as categoriesHandler from './RequestHandlers/categoriesHandler';
import * as difficultiesHandler from './RequestHandlers/difficultiesHandler';
import * as questionsHandler from './RequestHandlers/questionsHandler';
import * as gamesHandler from './RequestHandlers/gamesHandler';
import * as usersHandler from './RequestHandlers/usersHandler';

import { verifyJwtToken } from './Middlewares/authMiddleware';

declare module 'express' {
  interface Request {
    user?: {
      user_id: string;
      username: string;
    };
  }
}


const config = require('./Data/config.json');

const fs = require('fs');
const https = require('https');

const app = express();

const httpsPort = config[0].httpsPort || 33012;


let sslOptions = {};
if (process.env.APP_ENV === 'server') {
  try {
    sslOptions = {
      key: fs.readFileSync(process.env.key),
      cert: fs.readFileSync(process.env.cert),
    };
    console.log('Certificats SSL chargés avec succès.');
  } catch (err) {
    console.error('Erreur lors du chargement des certificats SSL :', err);
  }
}

if (process.env.APP_ENV === 'server') {
  https.createServer(sslOptions, app).listen(httpsPort, () => {
    console.log(`🚀 Server running on https://localhost:${httpsPort}`);
  });
}
else {
  app.listen(httpsPort, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${httpsPort}`);
  });
}




app.use(cors());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, UPDATE, PUT, DELETE, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header('Access-Control-Expose-Headers', 'Count');
  next();
});
app.use(express.json());

// Use authentication middleware on all routes
app.use(verifyJwtToken);

// Quizzes creation and management
/*used for development and tests*/ app.post('/quiz', quizzesHandler.create_one as (req: Request, res: Response) => Promise<void>);
app.post('/quiz/init', quizzesHandler.init_one as (req: Request, res: Response) => Promise<void>);
app.get('/quiz/search', quizzesHandler.get_publics_with_title as (req: Request, res: Response) => Promise<void>);
app.get('/quiz/:quiz_id', quizzesHandler.get_informations as (req: Request, res: Response) => Promise<void>);
app.post('/quiz/:quiz_id', quizzesHandler.update_one as (req: Request, res: Response) => Promise<void>);

// Quizzes questions
app.post('/quiz/:quiz_id/import_questions', questionsHandler.import_questions as (req: Request, res: Response) => Promise<void>);
app.get('/quiz/:quiz_id/:question_id', questionsHandler.get_informations as (req: Request, res: Response) => Promise<void>);
app.post('/quiz/:quiz_id/:question_id', questionsHandler.update_one as (req: Request, res: Response) => Promise<void>);
app.delete('/quiz/:quiz_id/:question_id', questionsHandler.delete_one as (req: Request, res: Response) => Promise<void>);
app.post('/quiz/:quiz_id/create_question', questionsHandler.create_one as (req: Request, res: Response) => Promise<void>);

// Games questions
app.get('/game/:quiz_id/create', gamesHandler.create_one as (req: Request, res: Response) => Promise<void>);
app.get('/game/:game_id/question', questionsHandler.get_one as (req: Request, res: Response) => Promise<void>);
app.post('/game/:game_id/question', questionsHandler.send_answer as (req: Request, res: Response) => Promise<void>);

// Users
app.post('/user/signup', usersHandler.create_one as (req: Request, res: Response) => Promise<void>);
app.post('/user/username_avaible', usersHandler.username_avaible as (req: Request, res: Response) => Promise<void>);
app.post('/user/signin', usersHandler.sign_in as (req: Request, res: Response) => Promise<void>);
app.get('/user/quizzes', usersHandler.get_quizzes as (req: Request, res: Response) => Promise<void>);
app.get('/user/played_games', usersHandler.get_games as (req: Request, res: Response) => Promise<void>);
app.get('/user/:quiz_id/:question_id', usersHandler.get_question as (req: Request, res: Response) => Promise<void>);
app.get('/user/:quiz_id', usersHandler.get_quiz as (req: Request, res: Response) => Promise<void>);



app.get('/categories', categoriesHandler.get_all);
app.get('/difficulties', difficultiesHandler.get_all);