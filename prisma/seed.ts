import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Admin Account
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@taixiu.com';

    const existingAdmin = await prisma.user.findUnique({
        where: { username: adminUsername },
    });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = await prisma.user.create({
            data: {
                username: adminUsername,
                password: hashedPassword,
                email: adminEmail,
                role: Role.ADMIN,
                wallet: {
                    create: {
                        balance: 1000000000,
                    },
                },
            },
        });
        console.log(`✅ Created Admin: ${admin.username} (${admin.email})`);
    } else {
        console.log(`ℹ️  Admin already exists: ${existingAdmin.username}`);
    }

    // 2. Demo User
    const userUsername = 'player1';
    const userPassword = 'player123';

    const existingUser = await prisma.user.findUnique({
        where: { username: userUsername },
    });

    if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        const user = await prisma.user.create({
            data: {
                username: userUsername,
                password: hashedPassword,
                role: Role.USER,
                wallet: {
                    create: {
                        balance: 50000,
                    },
                },
            },
        });
        console.log(`✅ Created User: ${user.username}`);
    } else {
        console.log(`ℹ️  User already exists: ${existingUser.username}`);
    }

    console.log('🎉 Seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
