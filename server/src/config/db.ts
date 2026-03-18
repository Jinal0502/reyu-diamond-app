import mongoose from "mongoose";
import logger from "../utils/logger";

const connectDB = async() : Promise<void> => {

    try {

        const mongouri = process.env.MONGO_URI;

        if(!mongouri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        await mongoose.connect(mongouri);

        logger.info("MongoDB connected successfully");
    }
    catch(err) {

        logger.error("MongoDB connection failed", { error: err });
        process.exit(1);
    }

}

export default connectDB;
