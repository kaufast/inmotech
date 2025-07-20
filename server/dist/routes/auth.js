"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../utils/auth");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const validatedData = validation_1.registerSchema.parse(req.body);
        const { email, password, firstName, lastName } = validatedData;
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const passwordHash = await (0, auth_1.hashPassword)(password);
        const newUser = await prisma_1.prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: passwordHash,
                isVerified: false,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            }
        });
        const token = (0, auth_1.generateToken)(newUser.id);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: newUser,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const validatedData = validation_1.loginSchema.parse(req.body);
        const { email, password } = validatedData;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await (0, auth_1.comparePassword)(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = (0, auth_1.generateToken)(user.id);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map