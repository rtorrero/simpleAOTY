const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); 
        }

        // Attach user info to request
        req.user = user; 

        // Username from the request parameters
        const { username } = req.params;

        // Check if the username in the token matches the username in the request
        if (req.user.username !== username) {
            console.log("Username name in token != params")
            return res.sendStatus(403); // Forbidden
        }

        next(); 
    });
};

const authenticateAdminToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

    
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); 
        }

        // Attach user info to request
        req.user = user; 

        // Username from the request parameters
        const { username } = req.params;
       
        // Check if the username in the token matches the username in the request
        if (req.user.username !== username) {
            console.log("Username in token does not match params");
            return res.sendStatus(403); // Forbidden
        }
        
        // Check if the user role is 'admin'
        if (req.user.role !== 'admin') {
            console.log("User is not an admin");
            return res.sendStatus(403); // Forbidden
        }

        next(); 
    });
};


module.exports = {
    authenticateToken,
    authenticateAdminToken
};
