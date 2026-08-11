// Load environment variables and the package used to create JWTs
require("dotenv").config();
const jwt = require("jsonwebtoken");

// Keep the signing secret outside the code and make tokens expire after two hours
const secret = process.env.JWT_SECRET;
const expiration = "2h";

// Create a signed token containing the logged-in user's safe information
const signToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  return jwt.sign({ data: payload }, secret, {
    expiresIn: expiration,
  });
};

// Check protected requests for a valid Bearer token
const authMiddleware = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  // Stop if the request did not include a correctly formatted token
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Bearer token not supplied",
    });
  }

  // Remove "Bearer " from the header to get the token itself
  const token = authorizationHeader.split(" ").pop().trim();

  try {
    // Verify the signature and place the user information on the request
    const { data } = jwt.verify(token, secret);
    req.user = data;

    // Continue to the protected route
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = { signToken, authMiddleware };
