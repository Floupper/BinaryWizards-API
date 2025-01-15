import request from 'supertest';
import app from '../app';

let server: any;

beforeAll(() => {
    server = app.listen(0, () => {
        console.log('Test server running');
    });
});


const uniqueUsername = `testuser_${Date.now()}`;
const uniqueUsername2 = `signinuser_${Date.now()}`;
const uniqueUsername3 = `quizuser_${Date.now()}`;
const uniqueUsername4 = `gameuser_${Date.now()}`;

describe('User Routes', () => {
    describe('POST /user/signup', () => {
        it('should create a new user', async () => {
            const response = await request(app)
                .post('/user/signup')
                .send({ username: uniqueUsername, password: 'testpassword' });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('should not create a user with an existing username', async () => {
            await request(app)
                .post('/user/signup')
                .send({ username: uniqueUsername, password: 'testpassword' });

            const response = await request(app)
                .post('/user/signup')
                .send({ username: uniqueUsername, password: 'testpassword' });
            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('error', 'Username already exists');
        });
    });

    describe('POST /user/username_available', () => {
        it('should return true if username is available', async () => {
            const response = await request(app)
                .post('/user/username_available')
                .send({ username: 'uniqueuser' });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('is_available', true);
        });

        it('should return false if username is taken', async () => {
            await request(app)
                .post('/user/signup')
                .send({ username: uniqueUsername, password: 'testpassword' });

            const response = await request(app)
                .post('/user/username_available')
                .send({ username: uniqueUsername });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('is_available', false);
        });
    });

    describe('POST /user/signin', () => {
        it('should sign in a user with correct credentials', async () => {
            await request(app)
                .post('/user/signup')
                .send({ username: uniqueUsername2, password: 'testpassword' });

            const response = await request(app)
                .post('/user/signin')
                .send({ username: uniqueUsername2, password: 'testpassword' });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('should not sign in a user with incorrect credentials', async () => {
            const response = await request(app)
                .post('/user/signin')
                .send({ username: uniqueUsername2, password: 'wrongpassword' });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid username or password');
        });
    });

    describe('GET /user/quizzes', () => {
        it('should get quizzes created by the authenticated user', async () => {
            const signupResponse = await request(app)
                .post('/user/signup')
                .send({ username: uniqueUsername3, password: 'testpassword' });
            const token = signupResponse.body.token;

            const response = await request(app)
                .get('/user/quizzes')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /user/played_games', () => {
        it('should get games played by the authenticated user', async () => {
            const signupResponse = await request(app)
                .post('/user/signup')
                .send({ username: uniqueUsername4, password: 'testpassword' });
            const token = signupResponse.body.token;

            const response = await request(app)
                .get('/user/played_games')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});
