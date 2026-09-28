const User = require('./models/User');
const Role = require('./models/Role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secret, studentInfo } = require('./config');

const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles,
        student: studentInfo.student,
        group: studentInfo.group,
        variant: studentInfo.variant
    };
    const expiresIn = 60 + studentInfo.variant;

    return jwt.sign(payload, secret, {expiresIn: `${expiresIn}s`})
}

class authController {
    async registration(req, res) {
        try {
            const { username, password, role } = req.body;
            const candidate = await User.findOne({ username });
            if (candidate) {
                return res.status(400).json({ message: 'That username is already occupied' });
            }

            const hashPassword = bcrypt.hashSync(password, 7);

            const userRole = await Role.findOne({ value: role || 'USER' });
            if (!userRole) {
                return res.status(400).json({ message: 'Role not found' });
            }

            const user = new User({ username, password: hashPassword, roles: [userRole._id] });
            await user.save();
            return res.json({ message: 'Registration successful' });
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: 'Registration error' });
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username }).populate('roles');
            if (!user) {
                return res.status(400).json({ message: `User ${username} not found` });
            }

            const validPassword = bcrypt.compareSync(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ message: 'Wrong password' });
            }

            const roleValues = user.roles.map(r => r.value);
            const token = generateAccessToken(user._id, roleValues);
            return res.json({ token });
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: 'Login error' });
        }
    }

    async getUsers(req, res) {
        try {
            const users = await User.find().select('-password').populate('roles');
            res.json(users);
        } catch (e) {
            console.log(e);
        }
    }

    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id).select('-password').populate('roles');
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.json({
                user,
                tokenPayload: req.user
            });
        } catch (e) {
            console.log(e);
            res.status(500).json({ message: "Failed to fetch profile" });
        }
    }
}

module.exports = new authController();
