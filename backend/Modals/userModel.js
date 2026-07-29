// const mongoose = require("mongoose");
import mongoose from "mongoose";
import bcrypt from 'bcryptjs'

const userModel = mongoose.Schema(
    {
        name:{type:String, required:true},
        email:{type:String, required:true, unique:true},
        password:{type:String, required:true},
        pic:{
            type:String,
            // required:true,
            default:"https://i.pinimg.com/736x/8d/4e/22/8d4e220866ec920f1a57c3730ca8aa11.jpg"
        },
        // bumped on logout to invalidate every outstanding refresh token at
        // once, without needing a separate token-blacklist collection
        tokenVersion: { type: Number, default: 0 },
    },
    {
        timestamps:true,
    },
)

// method to match the password
userModel.methods.matchPassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

// before saving the user to db we will hash the password, middleware
userModel.pre("save", async function (next){

    // if password is not modified then move on to the next middleware
    if (!this.isModified("password")){
        next();
    }
    // generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

})

const User = mongoose.model("User",userModel);

// module.exports = User;
export default User;