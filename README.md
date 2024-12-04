# Installation
```
git clone <project_remote_URL>
```

Before launching the API, you need to create a *.env* file containing the following information:
```
PORT=<a port>
DATABASE_URL="file:./dev.db"
JWT_SECRET=<a secret key>
JWT_EXPIRES_IN=10h
```

Once the *.env* file is created and filled out, you can install the dependencies and launch the application with the following commands:
```
npm install
npx prisma db push
npx prisma generate
npm start
```
# API Documentation

## Quizzes Creation and Management

### Create a New Quiz
- **Endpoint:** `/quiz`
- **Method:** `POST`
- **Description:** Create a new quiz.
- **Request Body:**
  - `category` (Number, required, between 9 and 32)
  - `difficulty` (String, required)
  - `amount` (Number, required, 1-50)

### Initialize a Quiz
- **Endpoint:** `/quiz/init`
- **Method:** `POST`
- **Description:** Initializes a new quiz for create a personalized one.

### Get Public Quizzes with Search Parameters
- **Endpoint:** `/quiz/search`
- **Method:** `GET`
- **Description:** Retrieve public quizzes using search parameters.
- **Query Parameters:**
  - `text` (String, optional)
  - `difficulty` (String, optional)
  - `page` (Number, optional, default: 1)
  - `pageSize` (Number, optional, default: 10)

### Get Quiz Information by ID
- **Endpoint:** `/quiz/:quiz_id`
- **Method:** `GET`
- **Description:** Retrieve detailed information about a specific quiz by its ID.
- **Path Parameters:**
  - `quiz_id` (String, required, format: `^QU[A-Z0-9]{6}$`)

### Update a Quiz
- **Endpoint:** `/quiz/:quiz_id`
- **Method:** `POST`
- **Description:** Update an existing quiz.
- **Path Parameters:**
  - `quiz_id` (String, required)
- **Request Body:**
  - `difficulty` (String, optional, values: `easy`, `medium`, `hard`)
  - `title` (String, optional)
  - `type` (Number, optional)
  - `description` (String, optional)

## Quiz Questions Management

### Import Questions into a Quiz
- **Endpoint:** `/quiz/:quiz_id/import_questions`
- **Method:** `POST`
- **Description:** Import questions into a quiz.
- **Path Parameters:**
  - `quiz_id` (String, required)
- **Request Body:**
  - `category` (Number, required, between 9 and 32)
  - `difficulty` (String, required)
  - `amount` (Number, required, 1-50)

### Get Specific Question Information
- **Endpoint:** `/quiz/:quiz_id/:question_id`
- **Method:** `GET`
- **Description:** Retrieve information about a specific question.
- **Path Parameters:**
  - `quiz_id` (String, required)
  - `question_id` (String, required)

### Create a New Question in a Quiz
- **Endpoint:** `/quiz/:quiz_id/create_question`
- **Method:** `POST`
- **Description:** Create a new question within a specific quiz.
- **Path Parameters:**
  - `quiz_id` (String, required)
- **Request Body:**
  - `question_text` (String, required)
  - `question_difficulty` (String, required)
  - `question_category` (String, required)
  - `question_type` (String, required)
  - `options` (Array, required, at least two options)
    - `option_text` (String, required)
    - `is_correct_answer` (Boolean, required)

### Update a Question
- **Endpoint:** `/quiz/:quiz_id/:question_id`
- **Method:** `POST`
- **Description:** Update a question within a quiz.
- **Path Parameters:**
  - `quiz_id` (String, required)
  - `question_id` (String, required)
- **Request Body:** (Partial fields allowed)
  - `question_text`, `question_difficulty`, `question_category`, `question_type`, `options`

### Delete a Question
- **Endpoint:** `/quiz/:quiz_id/:question_id`
- **Method:** `DELETE`
- **Description:** Delete a specific question from a quiz.
- **Path Parameters:**
  - `quiz_id` (String, required)
  - `question_id` (String, required)

## Games Management

### Get Started Games by the User
- **Endpoint:** `/game/user/started_games`
- **Method:** `GET`
- **Description:** Retrieve all games that have been started by the authenticated user.

### Create a New Game for a Quiz
- **Endpoint:** `/game/:quiz_id/create`
- **Method:** `GET`
- **Description:** Create a new game instance for a specific quiz.
- **Path Parameters:**
  - `quiz_id` (String, required)

### Get a Question for a Specific Game
- **Endpoint:** `/game/:game_id/question`
- **Method:** `GET`
- **Description:** Retrieve the current question for a given game.
- **Path Parameters:**
  - `game_id` (String, required, format: `^GA[A-Z0-9]{6}$`)

### Submit an Answer for a Game Question
- **Endpoint:** `/game/:game_id/question`
- **Method:** `POST`
- **Description:** Submit an answer to a question in the game.
- **Path Parameters:**
  - `game_id` (String, required)
- **Request Body:**
  - `question_index` (Number, required)
  - `option_index` (Number, required, 0-3)

## User Management

### Sign Up a New User
- **Endpoint:** `/user/signup`
- **Method:** `POST`
- **Description:** Register a new user.
- **Request Body:**
  - `username` (String, required)
  - `password` (String, required, 8-64 characters)

### Check Username Availability
- **Endpoint:** `/user/username_avaible`
- **Method:** `POST`
- **Description:** Check if a given username is available.
- **Request Body:**
  - `username` (String, required)

### Sign In a User
- **Endpoint:** `/user/signin`
- **Method:** `POST`
- **Description:** Sign in an existing user.
- **Request Body:**
  - `username` (String, required)
  - `password` (String, required)

### Get User's Quizzes
- **Endpoint:** `/user/quizzes`
- **Method:** `GET`
- **Description:** Get quizzes created by the authenticated user.

### Get Games Played by the User
- **Endpoint:** `/user/played_games`
- **Method:** `GET`
- **Description:** Retrieve games played by the authenticated user.

### Get Specific Quiz Created by User
- **Endpoint:** `/user/:quiz_id`
- **Method:** `GET`
- **Description:** Retrieve a specific quiz created by the user.
- **Path Parameters:**
  - `quiz_id` (String, required)

## Categories and Difficulties

### Get All Quiz Categories
- **Endpoint:** `/categories`
- **Method:** `GET`
- **Description:** Retrieve all available quiz categories.

### Get All Difficulty Levels
- **Endpoint:** `/difficulties`
- **Method:** `GET`
- **Description:** Retrieve all available quiz difficulty levels.

## Data Validation
- **Quiz ID:** Must match the pattern `^QU[A-Z0-9]{6}$`
- **Game ID:** Must match the pattern `^GA[A-Z0-9]{6}$`
- **Category ID:** Must be a number between 9 and 32
- **Username:** Must be between 8 and 64 characters in length
- **Options:** Each question must have at least two options, and one correct answer