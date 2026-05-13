const express = require('express');
const cors = require('cors');
const session = require('express-session');

require('dotenv').config();

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://kodometria.sk',
    'https://www.kodometria.sk',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use(
  session({
    key: 'user',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false,
    },
  })
);

/* Backend main page */
app.get('/', (req, res) => {
  return res.json('Backend server');
});

/* Routes */
const registerRouter = require('./routes/registerRouter');
app.use('/register', registerRouter);

const authRouter = require('./routes/authRouter');
app.use('/auth', authRouter);

const problemRouter = require('./routes/problemRouter');
app.use('/problem', problemRouter);

const codeRouter = require('./routes/codeRouter');
app.use('/code', codeRouter);

const resetPasswordRouter = require('./routes/resetPasswordRouter');
app.use('/reset-password', resetPasswordRouter);

const adminRouter = require('./routes/adminRouter');
app.use('/admin', adminRouter);

/* Application port */
const PORT = process.env.PORT || 1234;

app.listen(PORT, () => {
  console.log('Backend is on port ' + PORT);
});