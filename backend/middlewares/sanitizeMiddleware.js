// Strips keys that look like Mongo operators ($gt, $where, ...) or contain
// a "." out of incoming request data, so a crafted JSON body like
// { "email": { "$ne": null } } can't be used to manipulate a query such as
// User.findOne({ email }).
//
// Written by hand instead of pulling in express-mongo-sanitize: that
// package reassigns req.query wholesale, which throws on Express 5 (query
// is a read-only getter there). This only ever mutates object properties
// in place, so it's safe regardless of Express version.
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".")) {
            delete obj[key];
            continue;
        }
        if (obj[key] && typeof obj[key] === "object") {
            sanitizeObject(obj[key]);
        }
    }

    return obj;
};

export const sanitizeInput = (req, res, next) => {
    sanitizeObject(req.body);
    sanitizeObject(req.params);
    sanitizeObject(req.query);
    next();
};
