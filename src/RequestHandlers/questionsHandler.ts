import { Request, Response } from 'express';
import { assert } from 'superstruct';
import { CompleteOptionsData, QuestionAnswerData, QuestionCreationData, QuestionUpdateData } from '../Validation/question';
import { delete_question, get_all_questions, get_current_question, get_question_informations, persist_question, update_question } from '../Repositories/questionsRepository';
import { persist_answer } from '../Repositories/answersRepository';
import { change_questions_indexes, complete_options_request, get_total_questions_count } from '../Helpers/questionsHelper';
import { get_game, persist_game_update } from '../Repositories/gamesRepository';
import { QuestionImportData } from '../Validation/quiz';
import axios from 'axios';
import he from 'he';
import { delete_from_question, persist_option } from '../Repositories/optionsRepository';
import { SingleplayerQuestionControllerFactory } from '../Controllers/Questions/Factory/SingleplayerQuestionControllerFactory';


export async function get_one(req: Request, res: Response) {
    const { game_id } = req.params;

    try {
        const game = await get_game(game_id);

        if (!game) {
            res.status(404).json({ error: 'Game not found.' });
            return;
        }

        // Attach the game to the request so it is accessible in the controller
        req.game = game;

        // Instantiate the appropriate controller
        const questionController = SingleplayerQuestionControllerFactory.getController(game.mode);

        // Delegate the request handling to the controller
        await questionController.get_one(req, res);
    } catch (error: any) {
        // Specific error handling
        if (error.message === 'Invalid game mode') {
            res.status(400).json({ error: 'Invalid game mode.' });
            return;
        }

        console.error('Error in get_one:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function send_answer(req: Request, res: Response) {
    const { game_id } = req.params;

    try {
        const game = await get_game(game_id);

        if (!game) {
            res.status(404).json({ error: 'Game not found.' });
            return;
        }

        // Attach the game to the request so it is accessible in the controller
        req.game = game;

        // Instantiate the appropriate controller
        const questionController = SingleplayerQuestionControllerFactory.getController(game.mode);

        // Delegate the request handling to the controller
        await questionController.send_answer(req, res);
    } catch (error: any) {

        // Specific error handling
        if (error.message === 'Invalid game mode') {
            res.status(400).json({ error: 'Invalid game mode.' });
            return;
        }

        console.error('Error in send_answer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}



export async function import_questions(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        assert(req.body, QuestionImportData);
    } catch (error) {
        res.status(400).json({ error: 'Data is invalid: \n- category must be a number between 9 and 32\n- difficulty must be a string\n- amount must be a number between 1 and 50' });
        return;
    }

    try {
        const { category, difficulty, amount } = req.body;

        // Build object params
        const params: any = {
            amount,
            category,
            difficulty
        };

        /**** Get questions from API Open Trivia Database ****/
        // Build request string
        const queryString = new URLSearchParams(params).toString();

        // Build the full URL for the API request
        const fullURL = `https://opentdb.com/api.php?${queryString}`;

        // Get questions from the API Open Trivia Database
        const apiResponse = await axios.get(fullURL);

        const { response_code, results } = apiResponse.data;

        if (response_code !== 0) {
            if (response_code == 1) {
                res.status(422).json({ error: 'The API does not have enough questions with these parameters' })
                return;
            }
            res.status(400).json({ error: 'Error retrieving questions from the API.' });
            return;
        }

        const total_questions = await get_total_questions_count(quiz_id);

        // Browsing questions and options
        for (let index = 0; index < results.length; index++) {
            const questionData = results[index];

            // Decode texts
            const questionText = he.decode(questionData.question);
            const correctAnswer = he.decode(questionData.correct_answer);
            const incorrectAnswers = questionData.incorrect_answers.map((ans: string) => he.decode(ans));



            // Create question
            const question = await persist_question(total_questions + index, questionText, questionData.category, questionData.difficulty, "text", req.params.quiz_id);

            // Prepare the options
            const optionsData = [];

            // Add the correct answer
            optionsData.push({
                option_index: 0,
                is_correct_answer: true,
                questionsQuestion_id: question.question_id,
                option_content: correctAnswer
            });


            // Add incorrect answers
            for (const [index, incorrectAnswer] of incorrectAnswers.entries()) {

                optionsData.push({
                    option_index: index + 1,
                    is_correct_answer: false,
                    questionsQuestion_id: question.question_id,
                    option_content: incorrectAnswer
                });
            }

            // Sort options randomly
            optionsData.sort(() => Math.random() - 0.5);

            // Update option_index after random
            optionsData.forEach((option, index) => {
                option.option_index = index;
            });

            // Save options to the database
            for (const option of optionsData) {
                persist_option(option);
            }
        }

        res.status(201).json({ message: 'Questions added' });
    } catch (error: any) {
        if (String(error.message).includes('429')) {
            res.status(429).json({ error: 'Too Many Requests (Rate Limit Exceeded)' });
            return;
        }
        console.error('Error while importing questions:', error);
        res.status(500).json({ error: 'Error while importing questions', details: error.message });
    }
}

export async function get_informations(req: Request, res: Response) {
    const { quiz_id, question_id } = req.params;

    try {
        const question = await get_question_informations(question_id);

        if (!question) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }

        if (question.quizzesQuiz_id !== quiz_id) {
            res.status(404).json({ error: 'Question does not belong to the provided quiz' });
            return;
        }

        res.status(201).json({ message: 'Question found', question });
    } catch (error: any) {
        console.error('Error while retrieving question :', error);
        res.status(500).json({ error: 'Error while retrieving question', details: error.message });
    }
}



export async function create_one(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        assert(req.body, QuestionCreationData);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Data is invalid' });
        return;
    }

    try {
        const {
            question_text,
            question_difficulty,
            question_category,
            question_type,
            options,
        } = req.body;

        // Verify that there is a correct answer
        const correctOptions = options.filter((option) => option.is_correct_answer === true);
        if (correctOptions.length != 1) {
            res.status(400).json({ error: 'There must be a correct answer' });
            return;
        }


        const question_index = await get_total_questions_count(quiz_id);

        const question = await persist_question(question_index, question_text, question_category, question_difficulty, question_type, req.params.quiz_id);

        const optionsData = options.map((option: any, index: number) => ({
            option_index: index,
            is_correct_answer: option.is_correct_answer,
            questionsQuestion_id: question.question_id,
            option_content: option.option_content
        }));

        // Sort options randomly
        optionsData.sort(() => Math.random() - 0.5);

        // Update option_index after random
        optionsData.forEach((option, index) => {
            option.option_index = index;
        });

        // Save options to the database
        for (const option of optionsData) {
            persist_option(option);
        }

        res.status(201).json({ message: 'Question created', question_id: question.question_id })
    } catch (error: any) {
        console.error('Error creating question :', error);
        res.status(500).json({ error: 'Error creating question', details: error.message });
    }
}



export async function delete_one(req: Request, res: Response) {
    const { quiz_id, question_id } = req.params;

    try {
        const question = await get_question_informations(question_id);

        if (!question) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }

        if (question.quizzesQuiz_id !== quiz_id) {
            res.status(404).json({ error: 'Question does not belong to the provided quiz' });
            return;
        }
        await delete_from_question(question_id);
        await delete_question(question_id);

        const remainingQuestions = await get_all_questions(quiz_id);

        for (let i = 0; i < remainingQuestions.length; i++)
            await update_question(remainingQuestions[i].question_id, i, remainingQuestions[i].question_text, remainingQuestions[i].question_category, remainingQuestions[i].question_difficulty, remainingQuestions[i].question_type, quiz_id);

        res.status(200).json({ error: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);

        if (error instanceof Error && (error as any).code === 'P2025') {
            res.status(404).json({ error: 'Question not found' });
        } else {
            res.status(500).json({ error: 'Error while deleting question' });
        }
    }
}


export async function update_one(req: Request, res: Response) {
    const { quiz_id, question_id } = req.params;

    try {
        assert(req.body, QuestionUpdateData);
    } catch (error) {
        res.status(400).json({ error: 'Data is invalid' });
        return;
    }

    try {
        const existingQuestion = await get_question_informations(question_id);

        if (!existingQuestion) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }

        if (existingQuestion.quizzesQuiz_id !== quiz_id) {
            res.status(404).json({ error: 'Question does not belong to the provided quiz' });
            return;
        }

        const updateData = req.body;
        const { options, ...questionFields } = updateData;


        const currentIndex = existingQuestion.question_index;
        const newIndex = questionFields.question_index ?? currentIndex;

        if (newIndex >= await get_total_questions_count(quiz_id) || newIndex < 0) {
            res.status(400).json({ error: 'Invalid question index' });
            return;
        }

        change_questions_indexes(quiz_id, currentIndex, newIndex)

        await update_question(
            question_id,
            questionFields.question_index ?? existingQuestion.question_index,
            questionFields.question_text ?? existingQuestion.question_text,
            questionFields.question_category ?? existingQuestion.question_category,
            questionFields.question_difficulty ?? existingQuestion.question_difficulty,
            questionFields.question_type ?? existingQuestion.question_type,
            existingQuestion.quizzesQuiz_id
        );




        // If options are provided, delete existing options and create new ones
        if (options) {
            await delete_from_question(question_id);

            const optionsData = options.map((option: any, index: number) => ({
                option_index: index,
                is_correct_answer: option.is_correct_answer,
                questionsQuestion_id: question_id,
                option_content: option.option_content
            }));


            for (const option of optionsData) {
                persist_option(option);
            }
        }

        res.status(200).json({ message: 'Question updated successfully', question_id: question_id });
    } catch (error) {
        console.error('Error deleting question:', error);

        if (error instanceof Error && (error as any).code === 'P2025') {
            res.status(404).json({ error: 'Question not found' });
        } else {
            res.status(500).json({ error: 'Error while deleting question' });
        }
    }
}



export async function complete_options_ai(req: Request, res: Response) {
    try {
        assert(req.body, CompleteOptionsData);
    } catch (error) {
        res.status(400).json({ error: 'Data is invalid: question_text and options_type must be given' });
        return;
    }

    const { question_text, options_type, nb_options } = req.body;

    const prompt = `You are a quiz generator. For the question "${question_text}", generate exactly one correct answer and exactly ${nb_options - 1} incorrect answers. The theme should be ${options_type}. The incorrect_answers array must contain exactly ${nb_options - 1} items.`;

    try {

        let generatedAnswers = await complete_options_request(prompt);

        if (!generatedAnswers.correct_answer || !Array.isArray(generatedAnswers.incorrect_answers) ||
            generatedAnswers.incorrect_answers.length !== nb_options - 1) {
            throw new Error('Response structure invalid');
        }

        res.status(200).json({ generatedAnswers });
    } catch (error) {
        console.error('Error while generating options: ' + error);
        res.status(500).json({ error: 'Error while generating options' });
    }
}