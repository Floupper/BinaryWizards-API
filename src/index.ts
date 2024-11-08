import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import * as quizHandler from './RequestHandlers/quizHandler';
import * as categoriesHandler from './RequestHandlers/categoriesHandler';
import * as questionsHandler from './RequestHandlers/questionsHandler';

const app = express();
const port = 3000;

app.use(cors());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Expose-Headers', 'Count');
  next();
});
app.use(express.json());

app.post('/quiz', quizHandler.create_one as (req: Request, res: Response) => Promise<void>);

app.get('/categories', categoriesHandler.get_all);

app.get('/quiz/:quiz_id/question', questionsHandler.get_one as (req: Request, res: Response) => Promise<void>);

app.post('/quiz/:quiz_id/:question_id', (req: Request, res: Response) => {
  res.status(200).json({
    "correct": 1,
    "score_updated": 11,
    "answer_index": 0
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
