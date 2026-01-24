import { config } from "dotenv";
import path from "path";

// Load .env.local explicitly
config({ path: path.resolve(process.cwd(), ".env.local") });

import { prisma } from "./lib/prisma";

async function main() {
    console.log('--- Checking User Records ---');
    try {
        const users = await prisma.user.findMany({
            take: 10,
            select: {
                id: true,
                email: true,
                name: true,
                hashedPassword: true,
                createdAt: true
            }
        });

        if (users.length === 0) {
            console.log("No users found in database.");
        }

        users.forEach(user => {
            console.log(`ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Name: ${user.name}`);
            console.log(`Has Password: ${!!user.hashedPassword}`);
            console.log(`Created: ${user.createdAt}`);
            console.log('---');
        });
    } catch (error) {
        console.error("Error fetching users:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
