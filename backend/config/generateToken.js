// here i will be defining the functions to generate JWTs for user authentication

import jwt from "jsonwebtoken";

// short-lived — sent back in the response body and used as the normal
// Authorization header, same as before, just with a much shorter life
export const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });
}

// long-lived — only ever set as an httpOnly cookie, never returned in a
// JSON body or stored in localStorage. Carries tokenVersion so bumping
// that field on the user (e.g. on logout) invalidates it immediately
// even though the JWT itself hasn't expired yet.
export const generateRefreshToken = (id, tokenVersion) => {
    return jwt.sign({ id, tokenVersion }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '30d',
    });
}
