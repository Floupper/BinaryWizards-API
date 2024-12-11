import { Prisma } from '@prisma/client';
import { prisma } from '../db'


export async function persist_option(option: Prisma.OptionsCreateInput) {
    return await prisma.options.create({
        data: option,
    });
}


export async function delete_from_question(question_id: string) {
    await prisma.options.deleteMany({
        where: { questionsQuestion_id: question_id },
    });
}


export async function persist_option_content(optionContent: Prisma.OptionContentsCreateInput) {
    return await prisma.optionContents.create({ data: optionContent });
}