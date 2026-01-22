import mongoose from "mongoose";

const connectDB = async() : Promise<void> => {

    try {

        const mongouri = process.env.MONGO_URI;

        if(!mongouri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        await mongoose.connect(mongouri);

        console.log("MongoDB connected successfully");
    }
    catch(err) {

        console.error("MongoDB connection failed");
        console.error(err);
        process.exit(1);
    }

}

export default connectDB;