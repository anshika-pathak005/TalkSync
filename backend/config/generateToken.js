// here i will be defining the function to generate JWT token for user authentication

import jwt from "jsonwebtoken";

export const generateToken = (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET,{
        expiresIn:'30d',
    });
}