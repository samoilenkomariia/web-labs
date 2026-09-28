const express = require('express');
const mongoose = require('mongoose');
const authRouter = require('./authRouter');
const Role = require('./models/Role');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use('/auth', authRouter);

async function initRoles() {
    const count = await Role.countDocuments();
    if (count == 0) {
        await new Role({ value: 'USER' }).save();
        await new Role({ value: 'ADMIN' }).save();
        console.log('Roles USER & ADMIN created in DB');
    }
}

const start = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/auth_roles');
        console.log('Connected to MongoDB');

        await initRoles();

        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (e) {
        console.log(e);
    }
}

start();