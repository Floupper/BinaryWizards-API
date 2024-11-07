import express, { Request, Response, NextFunction } from 'express';

const app = express();
const port = 3000;

app.post('/quiz', (req: Request, res: Response) => {
  res.status(201).json({ "quizz créé": "true" });
});

app.get('/quiz/:quiz_id/question', (req: Request, res: Response) => {
  res.status(200).json({
    "question": {
      "question_id": "aaaaa-bbbb-cccc-dddd",
      "text": "Quelle est la capitale de la France ?",
      "options": ["Paris", "Londres", "Rome", "Berlin"]
    }
  });
});

app.post('/quiz/:quiz_id/:question_id', (req: Request, res: Response) => {
  res.status(200).json({
    "correct": 1,
    "score": "10",
    "answer": 2
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
