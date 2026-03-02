require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await User.deleteMany({});
        console.log('Cleared existing users');

        const hashedPassword = await bcrypt.hash('securepassword123', 10);

        const user = new User({
            name: 'Jane Traffic',
            email: 'jane@smartcity.gov',
            username: 'jane',
            password: 'securepassword123',
            role: 'Traffic Department Officer',
            isActive: true,
        });
        await user.save();

        const admin = new User({
            name: 'Director Fury',
            email: 'fury@smartcity.gov',
            username: 'fury',
            password: 'securepassword123',
            role: 'Super Admin',
            isActive: true,
        });
        await admin.save();

        console.log('User created successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createUser();