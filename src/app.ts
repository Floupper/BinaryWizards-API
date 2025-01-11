import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import * as quizzesHandler from './RequestHandlers/quizzesHandler';
import * as categoriesHandler from './RequestHandlers/categoriesHandler';
import * as difficultiesHandler from './RequestHandlers/difficultiesHandler';
import * as questionsHandler from './RequestHandlers/questionsHandler';
import * as gamesHandler from './RequestHandlers/gamesHandler';
import * as usersHandler from './RequestHandlers/usersHandler';
import * as uploadsHandler from './RequestHandlers/uploadsHandler';

import { validateGameId, checkGameAccess } from './Middlewares/gamesMiddleware';
import { validateQuizId, checkQuizAccess } from './Middlewares/quizzesMiddleware';
import { validateQuestionId } from './Middlewares/questionsMiddleware';
import { checkAuthentication } from './Middlewares/usersMiddleware';

import { verifyJwtToken } from './Middlewares/authMiddleware';

import { Quizzes, Games } from '@prisma/client';
import { requestLogger } from './Middlewares/logsMiddleware';

// Extending the Request interface to include custom properties
declare module 'express' {
    interface Request {
        quiz?: Quizzes; // Custom property for quiz information
        game?: Games; // Custom property for game information
        user?: {
            user_id: string; // User ID of the authenticated user
            username: string; // Username of the authenticated user
        };
    }
}

// Creating the Express application
const app = express();

// Configuring middleware
app.use(cors()); // Enable CORS (Cross-Origin Resource Sharing)
app.use((req: Request, res: Response, next: NextFunction) => {
    // Setting headers for CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, UPDATE, PUT, DELETE, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header('Access-Control-Expose-Headers', 'Count');
    next();
});

app.disable('etag');

app.use(express.json()); // Parse JSON request bodies

// Add logging for all incoming requests
app.use(requestLogger);

// Use JWT verification middleware for authentication on all routes
app.use(verifyJwtToken);

app.use(express.static(path.join(__dirname, '../public')));



// Define the application routes

// Quizzes creation and management routes
app.post('/quiz', quizzesHandler.create_one); // Create a new quiz
app.post('/quiz/init', quizzesHandler.init_one); // Initialize a quiz
app.get('/quiz/search', quizzesHandler.get_publics_with_params); // Get public quizzes with search parameters
app.get('/quiz/:quiz_id', validateQuizId, quizzesHandler.get_informations); // Get quiz information by ID
app.post('/quiz/:quiz_id', validateQuizId, checkQuizAccess, quizzesHandler.update_one); // Update a quiz by ID

// Quiz questions routes
app.post('/quiz/:quiz_id/import_questions', validateQuizId, checkQuizAccess, questionsHandler.import_questions); // Import questions into a quiz
app.get('/quiz/:quiz_id/:question_id', validateQuizId, validateQuestionId, checkQuizAccess, questionsHandler.get_informations); // Get specific question information
app.post('/quiz/:quiz_id/create_question', validateQuizId, checkQuizAccess, questionsHandler.create_one); // Create a new question in a quiz
app.post('/quiz/:quiz_id/:question_id', validateQuizId, validateQuestionId, checkQuizAccess, questionsHandler.update_one); // Update a question in a quiz
app.delete('/quiz/:quiz_id/:question_id', validateQuizId, validateQuestionId, checkQuizAccess, questionsHandler.delete_one); // Delete a question from a quiz

// Games routes
app.get('/game/user/started_games', checkAuthentication, gamesHandler.get_started_by_user); // Get the games started by the authenticated user
app.post('/game/:quiz_id/init', validateQuizId, gamesHandler.init_one); // Init a new game for a quiz
app.get('/game/:game_id/question', validateGameId, checkGameAccess, questionsHandler.get_one); // Get a question for a specific game
app.post('/game/:game_id/question', validateGameId, checkGameAccess, questionsHandler.send_answer); // Submit an answer for a question in a game
app.get('/game/:game_id/get_mode', validateGameId, gamesHandler.get_mode);
app.get('/game/:game_id/get_teams', validateGameId, gamesHandler.get_teams); // For team modes


// Users routes
app.post('/user/signup', usersHandler.create_one); // Sign up a new user
app.post('/user/username_available', usersHandler.username_available); // Check if a username is available
app.post('/user/signin', usersHandler.sign_in); // Sign in a user
app.get('/user/quizzes', checkAuthentication, usersHandler.get_quizzes); // Get quizzes created by the authenticated user
app.get('/user/played_games', checkAuthentication, usersHandler.get_games); // Get games played by the authenticated user
app.get('/user/:quiz_id/:question_id', checkAuthentication, validateQuizId, validateQuestionId, checkQuizAccess, usersHandler.get_question); // Get a question for a specific quiz
app.get('/user/:quiz_id', checkAuthentication, validateQuizId, checkQuizAccess, usersHandler.get_quiz); // Get a specific quiz created by the authenticated user

// Categories and difficulties routes
app.get('/categories', categoriesHandler.get_all); // Get all quiz categories
app.get('/difficulties', difficultiesHandler.get_all); // Get all difficulty levels



app.use('/uploads/images', express.static(path.join(__dirname, '/public/uploads/images')));
app.use('/uploads/audios', express.static(path.join(__dirname, '/public/uploads/audios')));

app.post('/upload/image', uploadsHandler.upload_image);
app.post('/upload/audio', uploadsHandler.upload_audio);


// Exporting the configured Express application
export default app;