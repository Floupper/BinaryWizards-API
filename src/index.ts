import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import * as quizzesHandler from './RequestHandlers/quizzesHandler';
import * as categoriesHandler from './RequestHandlers/categoriesHandler';
import * as difficultiesHandler from './RequestHandlers/difficultiesHandler';
import * as questionsHandler from './RequestHandlers/questionsHandler';
import * as gamesHandler from './RequestHandlers/gamesHandler';
import * as usersHandler from './RequestHandlers/usersHandler';

import { validateGameId, checkGameAccess } from './Middlewares/gamesMiddleware';
import { validateQuizId, checkQuizAccess, } from './Middlewares/quizzesMiddleware';
import { validateQuestionId } from './Middlewares/questionsMiddleware';
import { checkAuthentication } from './Middlewares/usersMiddleware';

import { verifyJwtToken } from './Middlewares/authMiddleware';

import { Quizzes, Games } from '@prisma/client';
import { requestLogger } from './Middlewares/logsMiddleware';

declare module 'express' {
  interface Request {
    quiz?: Quizzes;
    game?: Games;
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

// Add a logs on all requests
app.use(requestLogger);

// Use authentication middleware on all routes
app.use(verifyJwtToken);

// Quizzes creation and management
app.post('/quiz', quizzesHandler.create_one);
app.post('/quiz/init', quizzesHandler.init_one);
app.get('/quiz/search', quizzesHandler.get_publics_with_params);
app.get('/quiz/:quiz_id', validateQuizId, quizzesHandler.get_informations);
app.post('/quiz/:quiz_id', validateQuizId, checkQuizAccess, quizzesHandler.update_one);

// Quizzes questions
app.post('/quiz/:quiz_id/import_questions', validateQuizId, checkQuizAccess, questionsHandler.import_questions);
app.get('/quiz/:quiz_id/:question_id', validateQuizId, validateQuestionId, checkQuizAccess, questionsHandler.get_informations);
app.post('/quiz/:quiz_id/create_question', validateQuizId, checkQuizAccess, questionsHandler.create_one);
app.post('/quiz/:quiz_id/:question_id', validateQuizId, validateQuestionId, checkQuizAccess, questionsHandler.update_one);
app.delete('/quiz/:quiz_id/:question_id', validateQuizId, validateQuestionId, checkQuizAccess, questionsHandler.delete_one);

// Games questions
app.get('/game/user/started_games', checkAuthentication, gamesHandler.get_started_by_user);
app.get('/game/:quiz_id/create', validateQuizId, gamesHandler.create_one);
app.get('/game/:game_id/question', validateGameId, checkGameAccess, questionsHandler.get_one);
app.post('/game/:game_id/question', validateGameId, checkGameAccess, questionsHandler.send_answer);

// Users
app.post('/user/signup', usersHandler.create_one);
app.post('/user/username_avaible', usersHandler.username_avaible);
app.post('/user/signin', usersHandler.sign_in);
app.get('/user/quizzes', checkAuthentication, usersHandler.get_quizzes);
app.get('/user/played_games', checkAuthentication, usersHandler.get_games);
app.get('/user/:quiz_id/:question_id', checkAuthentication, validateQuizId, validateQuestionId, checkQuizAccess, usersHandler.get_question);
app.get('/user/:quiz_id', checkAuthentication, validateQuizId, checkQuizAccess, usersHandler.get_quiz);



app.get('/categories', categoriesHandler.get_all);
app.get('/difficulties', difficultiesHandler.get_all);