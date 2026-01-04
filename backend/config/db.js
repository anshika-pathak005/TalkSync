// this file would be responsible for connecting to the database

import mongoose from "mongoose";
import dotenv from "dotenv";
import color from "colors";


const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI,{
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    }catch(error){
        console.error(`Error: ${error.message}`.red);
        process.exit();
    }
}
export default connectDB;
// module.exports = connectDB;