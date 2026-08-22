const jwt = require("jsonwebtoken");
const userModel = require("../Model/userModel");

module.exports = async (req, res, next) => {
    try {

        console.log("🔥 AUTH MIDDLEWARE HIT");


        const authHeader = req.headers.authorization;
        console.log("AUTH HEADER:", authHeader);


        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token missing or invalid"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        const userDetails = await userModel.findById(decoded.id);

        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        console.log("✅ AUTH PASSED:", userDetails._id);

        req.user = userDetails;

        next();

    } catch (error) {

        console.error("Auth Middleware Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};