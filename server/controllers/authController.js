const bcrypt = require("bcryptjs");
const db = require("../db");

require("dotenv").config();


const validateUser = async (req, res) => {
    const { email, password, validation } = req.body;

    if (!email || !password) {
        return res.json({ message: "You must insert email and password" });
    }

    db.query("SELECT * FROM `users` WHERE user_email = ?", [email], async (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "User does not exist" });
        }

        const userRecord = results[0];

        const passwordMatch = await bcrypt.compare(password, userRecord.user_password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Wrong credentials!" });
        }

        const userId = userRecord.user_id;
        const user = {
            id: userId,
            name: userRecord.user_name,
            email: userRecord.user_email,
            consent: userRecord.user_consent,
            isValid: userRecord.user_isValid,
        };

        if (!validation) {
            req.session.user = user;
            return res.status(200).json({ user });
        }

        db.query(
            "SELECT * FROM `validation_codes` WHERE validation_code = ? AND validation_isUsed = 0 AND validation_forUser = ?",
            [validation, userId],
            (error, validationResults) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json();
                }

                if (validationResults.length === 0) {
                    return res.status(401).json({ message: "Wrong validation code!" });
                }

                db.query(
                    "UPDATE `validation_codes` SET validation_isUsed = 1 WHERE validation_code = ? AND validation_forUser = ?",
                    [validation, userId],
                    (error) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).json();
                        }

                        db.query(
                            "UPDATE `users` SET user_isValid = 1 WHERE user_id = ?",
                            [userId],
                            (error) => {
                                if (error) {
                                    console.error(error);
                                    return res.status(500).json();
                                }

                                user.isValid = 1;
                                req.session.user = user;
                                
                                return res.status(200).json({ user });
                            }
                        );
                    }
                );
            }
        );
    });
};
 


const sessionExists = (req, res) => {
    if ( req.session.user) {
        res.send({ auth: true, user: req.session.user});
    } else {
        res.send({ auth: false, user:{role: null}});
    }
};

const deleteSession = (req, res) => {
    if ( req.session.user ) {
        req.session.destroy(err => {
            if (err) {
                res.send({logout: false, message: "Problem with logging out"})
            } else {
                res.send({logout: true}) 
            }
        })
    } else {
          res.send({logout: false, message: "Session does not exist"})
    }
}
   

module.exports = {
    validateUser,
    sessionExists,
    deleteSession
};