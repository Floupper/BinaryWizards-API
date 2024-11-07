import express, { Request, Response, NextFunction } from 'express';

const app = express();
const port = 3000;

app.post('/quiz', (req: Request, res: Response) => {
  res.status(201).json({ "quizz_id": "123e4567-e89b-12d3-a456-426614174000" });
});

app.get('/quiz/:quiz_id/question', (req: Request, res: Response) => {
  res.status(200).json({
    "question": {
      "question_text": "Quelle est la capitale de la France ?",
      "options": ["Paris", "Londres", "Rome", "Berlin"],
      "question_index": 1,
      "nb_questions_total": 20,
      "score": 10,
      "question_type": "multiple",// ou "boolean"
      "question_difficulty": "easy",
      "question_category": "Geography"
    }
  });
});

app.post('/quiz/:quiz_id/:question_id', (req: Request, res: Response) => {
  res.status(200).json({
    "correct": 1,
    "score_updated": 11,
    "answer_index": 0
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
