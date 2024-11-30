import request from 'supertest';
import app from '../../app';

let server: any;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

beforeAll(() => {
    server = app.listen(0, () => {
        console.log('Test server running');
    });
});

afterAll(() => {
    server.close(() => {
        console.log('Test server stopped');
    });
});

describe('Quizzes Handler Tests', () => {
    let quizId: string;

    // Test for quiz creation
    describe('POST /quiz', () => {
        it('should create a new quiz', async () => {
            await delay(5000); // delay to avoid code 429 from open trivia db cause of too many requests error
            const response = await request(app)
                .post('/quiz')
                .send({ category: 9, difficulty: 'easy', amount: 10, title: 'My Quiz' });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('quiz_id');
            quizId = response.body.quiz_id;
        }, 10000);

        it('should return 400 for invalid data', async () => {
            await delay(5000); // delay to avoid code 429 from open trivia db cause of too many requests error
            const response = await request(app)
                .post('/quiz')
                .send({ category: 100, difficulty: 'wrong_difficulty', amount: 60 });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        }, 10000);
    });

    // Test for quiz initialization
    describe('POST /quiz/init', () => {
        it('should initialize a new quiz', async () => {
            const response = await request(app)
                .post('/quiz/init')
                .send();

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('quiz_id');
        });
    });

    // Test for getting public quizzes with search parameters
    describe('GET /quiz/search', () => {
        it('should return a list of public quizzes', async () => {
            const response = await request(app)
                .get('/quiz/search')
                .query({ text: 'easy', page: 1, pageSize: 5 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('quizzes');
            expect(Array.isArray(response.body.quizzes)).toBe(true);
        });
    });

    // Test for getting quiz information by ID
    describe('GET /quiz/:quiz_id', () => {
        it('should return quiz information for a valid quiz_id', async () => {
            const response = await request(app)
                .get(`/quiz/${quizId}`)
                .send();

            if (quizId) {
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('quiz');
            } else {
                expect(response.status).toBe(404);
            }
        });

        it('should return 404 for a non-existing quiz_id', async () => {
            const response = await request(app)
                .get('/quiz/QUxxxxxx')
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });

    // Test for updating a quiz
    describe('POST /quiz/:quiz_id', () => {
        it('should update quiz information for a valid quiz_id', async () => {
            const response = await request(app)
                .post(`/quiz/${quizId}`)
                .send({ title: 'Updated Quiz Title', difficulty: 'medium' });

            if (quizId) {
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Quiz updated successfully');
            } else {
                expect(response.status).toBe(404);
            }
        });

        it('should return 400 for invalid update data', async () => {
            const response = await request(app)
                .post(`/quiz/${quizId}`)
                .send({ difficulty: 100 });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
});