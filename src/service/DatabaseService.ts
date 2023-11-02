import { PrismaClient, User } from "@prisma/client";

export class DatabaseService {
    private readonly prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async addUser(user: User) {
        await this.prisma.user.create({
            data: user
        });
    }

    async getUser(discordId: string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: { discordId }
        });
    }

    async updateUserCalendar(discordId: string, calendar: string) {
        await this.prisma.user.update({
            where: { discordId },
            data: { calendar }
        });
    }
}