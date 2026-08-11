// Create the user router and import its database and authentication tools
const router = require("express").Router();
const { User } = require("../models");
const { signToken, authMiddleware } = require("../utils/auth");

// Register a new user and return their first token
router.post("/", async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    const token = signToken(user);

    // Return safe user fields without returning the hashed password
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Unable to register user",
      error: error.message,
    });
  }
});

// Log in by finding the email and checking the submitted password
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.body.email },
    });

    // Use the same message for an unknown email or incorrect password
    if (!user || !user.checkPassword(req.body.password)) {
      return res.status(400).json({
        message: "Incorrect email or password",
      });
    }

    const token = signToken(user);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to log in",
      error: error.message,
    });
  }
});

// Return the user represented by a valid token
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "email", "createdOn"],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve user",
      error: error.message,
    });
  }
});

// JWT logout happens in the browser by deleting the stored token
router.post("/logout", (req, res) => {
  res.status(204).end();
});

module.exports = router;
