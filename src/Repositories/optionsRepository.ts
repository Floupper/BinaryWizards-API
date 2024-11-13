import { Prisma } from '@prisma/client';
import { prisma } from '../db'


export async function persist_option(option: Prisma.OptionsCreateInput) {
    return await prisma.options.create({
        data: option,
    });
}