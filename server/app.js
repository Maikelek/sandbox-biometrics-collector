const express = require('express'); 
const cors = require("cors"); 
const session = require('express-session');

require("dotenv").config();

const app = express()
app.use(express.json());

app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(
  session({
    key: "user",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      expires: 86400000 // 1 day
    }
  })
);

/* Backend main page */
app.get("/", (req, res) => { 
  return res.json("Backend server");

})

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

/* Application port*/ 
app.listen(process.env.PORT, () => {      
    console.log("Backend is on port " + process.env.PORT);
})