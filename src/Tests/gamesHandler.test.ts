import request from 'supertest';
import app from '../app';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let server: any;
let quizId: any;

beforeAll(async () => {
    server = app.listen(0, () => {
        console.log('Test server running');
    });

    await delay(5000); // delay to avoid code 429 from open trivia db cause of too many requests error
    quizId = (await request(app)
        .post('/quiz/init')
        .send()).body.quiz_id;

    await request(app)
        .post(`/quiz/${quizId}`)
        .send({ type: 1 });

    await delay(5000); // delay to avoid code 429 from open trivia db cause of too many requests error

    await request(app)
        .post(`/quiz/${quizId}/import_questions`)
        .send({ amount: 5, category: 10, difficulty: "easy" });
}, 15000);


describe('Games Routes', () => {
    describe('GET /game/user/started_games', () => {
        it('should get the games started by the authenticated user', async () => {
            const signupResponse = await request(app)
                .post('/user/signup')
                .send({ username: `startedgamesuser_${Date.now()}`, password: 'testpassword' });
            const token = signupResponse.body.token;

            const response = await request(app)
                .get('/game/user/started_games')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('unfinished_games');
            expect(Array.isArray(response.body.unfinished_games)).toBe(true);
        });
    });

    describe('POST /game/:quiz_id/init', () => {
        it('should create a new game for a quiz', async () => {
            const signupResponse = await request(app)
                .post('/user/signup')
                .send({ username: `createquizuser_${Date.now()}`, password: 'testpassword' });
            const token = signupResponse.body.token;



            const response = await request(app)
                .post(`/game/${quizId}/init`)
                .send({ mode: 'standard' })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Game created');
            expect(response.body).toHaveProperty('game_id');
        });

        it('should return 404 if quiz is not found', async () => {
            const signupResponse = await request(app)
                .post('/user/signup')
                .send({ username: `quiznotfounduser_${Date.now()}`, password: 'testpassword' });
            const token = signupResponse.body.token;

            const quizId = "QUxxxxxx"; // Assume this quiz ID does not exist
            const response = await request(app)
                .post(`/game/${quizId}/init`)
                .send({ mode: 'standard' })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Quiz not found.');
        });
    });

    describe('GET /game/:game_id/question', () => {
        it('should get a question for a specific game', async () => {
            const signupResponse = await request(app)
                .post('/user/signup')
                .send({ username: `gamequestionuser_${Date.now()}`, password: 'testpassword' });
            const token = signupResponse.body.token;

            // Create a new game first
            const createGameResponse = await request(app)
                .post(`/game/${quizId}/init`)
                .send({ mode: 'standard' })
                .set('Authorization', `Bearer ${token}`);

            const gameId = createGameResponse.body.game_id;

            // Get a question for the game
            const response = await request(app)
                .get(`/game/${gameId}/question`)
                .set('Authorization', `Bearer ${token}`);


            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('correct_answers_nb', 0);
            expect(response.body).toHaveProperty('game_finished', false);
            expect(response.body).toHaveProperty('nb_questions_total', 5);
            expect(Array.isArray(response.body.options)).toBe(true);
            expect(response.body).toHaveProperty('question_category');
            expect(response.body).toHaveProperty('question_difficulty');
            expect(response.body).toHaveProperty('question_index', 1);
            expect(response.body).toHaveProperty('question_text');
            expect(response.body).toHaveProperty('question_type');
            expect(response.body).toHaveProperty('quiz_id');
        });
    });

    describe('POST /game/:game_id/question', () => {
        it('should submit an answer for a question in a game', async () => {
            const signupResponse = await request(app)
                .post('/user/signup')
                .send({ username: `answerquestionuser_${Date.now()}`, password: 'testpassword' });
            const token = signupResponse.body.token;

            // Create a new game first
            const createGameResponse = await request(app)
                .post(`/game/${quizId}/init`)
                .send({ mode: 'standard' })
                .set('Authorization', `Bearer ${token}`);

            const gameId = createGameResponse.body.game_id;

            // Submit an answer for the question
            const response = await request(app)
                .post(`/game/${gameId}/question`)
                .set('Authorization', `Bearer ${token}`)
                .send({ question_index: 1, option_index: 0 });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('is_correct');
            expect(response.body).toHaveProperty('correct_option_index');
        });
    });
});