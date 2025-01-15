import axios from "axios";
import { decrement_questions_index, get_total_questions, increment_questions_index } from "../Repositories/questionsRepository";
import { SocketError } from "../Sockets/SocketError";


export async function get_total_questions_count(quiz_id: string) {
    return await get_total_questions(quiz_id);
}


export async function change_questions_indexes(quiz_id: string, currentIndex: number, newIndex: number) {
    if (newIndex !== currentIndex) {
        if (newIndex < currentIndex) {
            await increment_questions_index(quiz_id, currentIndex, newIndex);
        } else if (newIndex > currentIndex) {
            await decrement_questions_index(quiz_id, currentIndex, newIndex);
        }
    }
}


export function get_correct_option_index(question: any) {
    const correctOption = question.options.find(
        (option: any) => option.is_correct_answer
    );

    if (!correctOption) {
        throw new SocketError('Correct answer not found');
    }

    return correctOption.option_index;
}

export async function complete_options_request(prompt: string) {
    const response = await axios.post(String(process.env.OLLAMA_URL), {
        model: 'llama3.2:1b',
        prompt: prompt,
        stream: false,
        format: {
            "type": "object",
            "properties": {
                "correct_answer": {
                    "type": "string"
                },
                "incorrect_answers": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            },
            "required": [
                "correct_answer",
                "incorrect_answers"
            ]
        },
        num_ctx: 512,
        num_predict: 256,
        temperature: 0.7,
        top_p: 0.9,
        repeat_penalty: 1.1
    });

    const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Response format invalid');
    }

    return JSON.parse(jsonMatch[0]);
}