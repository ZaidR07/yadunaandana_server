



import mongoose from "mongoose";

const checkExisting = async (email) => {
    try {
        console.log(email);
        
        const db = mongoose.connection.db;
        return await db.collection("admin").findOne({ email });
    } catch (error) {
        console.error("Error in checkExisting:", error);
        throw new Error("Database error");
    }
};

const verification = async (email, password) => {
    try {
        const db = mongoose.connection.db;
        const admin = await db.collection("admin").findOne({ email });

        if (!admin) {
            throw new Error("Admin not found");
        }


        if (admin.password != password) {
            throw new Error("Incorrect Password");
        }

        return true;
    } catch (error) {
        console.error("Error in verification:", error);
        throw new Error(error.message);
    }
};

export const adminlogin = async (req, res) => {
    console.log("hit");
    
    try {
        const data = req.body.payload;


        if (!data.email || !data.password) {
            return res.status(400).json({ message: "Email and Password are required" });
        }

        const admin = await checkExisting(data.email);

        if (!admin) {
            return res.status(404).json({ message: "Wrong Email" });
        }

        const isVerified = await verification(data.email, data.password);

        if (!isVerified) {
            return res.status(400).json({ message: "Incorrect Password" });
        }

        return res.status(200).json({ message: "Login Successful" });

    } catch (error) {
        console.error("Error in adminlogin:", error);
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};