import { Request, Response } from 'express';
import { assert } from 'superstruct';
import { QuestionAnswerData, QuestionCreationData, QuestionUpdateData } from '../Validation/question';
import { delete_question, get_all_questions, get_current_question, get_question_informations, persist_question, update_question } from '../Repositories/questionsRepository';
import { persist_answer } from '../Repositories/answersRepository';
import { change_questions_indexes, get_total_questions_count } from '../Helpers/questionsHelper';
import { get_correct_answers_count } from '../Helpers/answersHelper';
import { persist_game_update } from '../Repositories/gamesRepository';
import { QuestionImportData } from '../Validation/quiz';
import axios from 'axios';
import he from 'he';
import { delete_from_question, persist_option, persist_option_content } from '../Repositories/optionsRepository';


export async function get_one(req: Request, res: Response) {
    const { game_id } = req.params;

    try {
        const game = req.game;

        if (game) { // The game is not null cause of validation with checkGameAccess in gamesMiddleware, this condition is for ts errors

            // Count the number of questions
            const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);


            // Verify if the game is finished
            if (game.current_question_index >= nb_questions_total) {

                res.status(200).json({
                    game_finished: true,
                    correct_answers_nb: await get_correct_answers_count(game_id),
                    nb_questions_total: nb_questions_total,
                    quiz_id: game.quizzesQuiz_id
                });
                return;
            }

            // Find actual question
            const question = await get_current_question(game.quizzesQuiz_id, game.current_question_index);

            if (!question) {
                res.status(404).json({ error: 'Question not found' });
                return;
            }

            // Find all options for questions
            const options = question.options.map((option, index) => ({
                option_index: option.option_index,
                option_content: option.option_content
            }));



            // Build the response
            res.status(200).json({
                game_finished: false,
                question_text: question.question_text,
                options: options,
                question_index: question.question_index + 1,
                nb_questions_total: nb_questions_total,
                correct_answers_nb: await get_correct_answers_count(game_id),
                question_type: question.question_type,
                question_difficulty: question.question_difficulty,
                question_category: question.question_category,
                quiz_id: game.quizzesQuiz_id,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export async function send_answer(req: Request, res: Response) {
    const { game_id } = req.params;


    let { question_index, option_index } = req.body;

    try {
        assert(req.body, QuestionAnswerData);
    } catch (error) {
        res.status(400).json({ error: 'Data is invalid: \n- question_index must be between 1 and 50\n- option_index must be between 0 and 3' });
        return;
    }

    // In DB, question_index starts at 0
    question_index--;

    try {
        const game = req.game;

        if (game) { // The game is not null cause of validation with checkGameAccess in gamesMiddleware, this condition is for ts errors
            // Verify that there in no desynchronization
            if (question_index !== game.current_question_index) {
                res.status(400).json({ error: 'Question\'s index invalid' });
                return;
            }

            // Count the number of questions
            const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);

            if (question_index >= nb_questions_total) {
                res.status(400).json({ error: 'Quiz is finished' });
                return;
            }

            // Find corresponding question
            const question = await get_current_question(game.quizzesQuiz_id, question_index);

            if (!question) {
                res.status(404).json({ error: 'Question not found' });
                return;
            }

            // Find chosen option
            const chosenOption = question.options.find(
                (option) => option.option_index === option_index
            );

            if (!chosenOption) {
                res.status(400).json({ error: 'Invalid option index' });
                return;
            }

            // Determine if the answer is correct
            const isCorrect = chosenOption.is_correct_answer;

            // Find correct answer's index
            const correctOption = question.options.find(
                (option) => option.is_correct_answer
            );

            if (!correctOption) {
                res.status(500).json({ error: 'Correct answer not found' });
                return;
            }

            const correctOptionIndex = correctOption.option_index;

            // Update game in DB
            await persist_game_update(game_id, game.current_question_index + 1);

            // Add answer
            await persist_answer(game_id, question.question_id, chosenOption.option_id,);

            // Build the response
            res.status(200).json({
                is_correct: isCorrect,
                correct_option_index: correctOptionIndex,
            });
        }
    } catch (error) {
        console.error(error);
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

        // CBuild the full URL for the API request
        const fullURL = `https://opentdb.com/api.php?${queryString}`;

        // Get questions from API Open Trivia Database
        const apiResponse = await axios.get(fullURL);

        const { response_code, results } = apiResponse.data;

        if (response_code !== 0) {
            if (response_code == 1) {
                res.status(422).json({ error: 'The API have not enough questions with this parameters' })
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
            const question = await persist_question(total_questions + index, questionText, questionData.category, questionData.difficulty, questionData.type, req.params.quiz_id);

            // Prepare the options
            const optionsData = [];

            const correctOptionContent = await persist_option_content({
                type: 'text',
                content: correctAnswer
            });

            // Add the correct answer
            optionsData.push({
                option_index: 0,
                is_correct_answer: true,
                questionsQuestion_id: question.question_id,
                optionContentsOptionContent_id: correctOptionContent.optionContent_id
            });


            // Add incorrect answers
            for (const [index, incorrectAnswer] of incorrectAnswers.entries()) {
                const incorrectOptionContent = await persist_option_content({
                    type: 'text',
                    content: incorrectAnswer
                });

                optionsData.push({
                    option_index: index + 1,
                    is_correct_answer: false,
                    questionsQuestion_id: question.question_id,
                    optionContentsOptionContent_id: incorrectOptionContent.optionContent_id
                });
            }

            // Sort questions randomly
            optionsData.sort(() => Math.random() - 0.5);

            // Update option_index after random
            optionsData.forEach((option, index) => {
                option.option_index = index;
            });

            // Save options to database
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
        console.log(error);
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
            option_content: {
                type: option.option_content.type,
                content: option.option_content.content,
            },
        }));

        // Sort questions randomly
        optionsData.sort(() => Math.random() - 0.5);

        // Update option_index after random
        optionsData.forEach((option, index) => {
            option.option_index = index;
        });

        // Save options to database
        for (const option of optionsData) {
            const { option_content, ...option_fields } = option;
            persist_option_content(option_content);
            persist_option(option_fields);
        }

        res.status(201).json({ message: 'Question created' })
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




        // if options are provided, delete existing options and create new ones
        if (options) {
            await delete_from_question(question_id);

            const optionsData = options.map((option: any, index: number) => ({
                option_index: index,
                is_correct_answer: option.is_correct_answer,
                questionsQuestion_id: question_id,
                option_content: {
                    type: option.option_content.type,
                    content: option.option_content.content,
                },
            }));


            for (const option of optionsData) {
                const { option_content, ...optionFields } = option;
                persist_option_content(option_content);
                persist_option(optionFields);
            }
        }

        res.status(200).json({ message: 'Question updated successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);

        if (error instanceof Error && (error as any).code === 'P2025') {
            res.status(404).json({ error: 'Question not found' });
        } else {
            res.status(500).json({ error: 'Error while deleting question' });
        }
    }
}