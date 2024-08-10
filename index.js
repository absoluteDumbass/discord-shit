const express = require('express');
const os = require('os');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport');
const session = require('express-session');
const Strategy = require('passport-discord').Strategy;
const mee6 = require("mee6-levels-api");
const path = require('path');
const { getColorFromURL } = require("color-thief-node");
const sql = require('connect-sqlite3')(session);
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure Passport
passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI,
    scope: ['identify']
},
function(accessToken, refreshToken, profile, done) {
    // In a real application, you might store the profile in a database
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const sessionMiddleware = session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new sql()
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', passport.authenticate('discord'));

app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication
        res.redirect('/profile');
    }
);

app.get('/profile', (req, res) => {
    //if (!req.isAuthenticated() || !req.user) return res.redirect('/login');
    if (!req.user) res.redirect('/');
	mee6.getUserXp("522561390330904585", req.user.id).then(user => {
        getColorFromURL(user.avatarUrl)
            .then(color => {
                console.log(`[COLOR] ${user.id} is rgb(${color.join(',')})`);
                // Store the dominant color in your server or database
                colors[user.id] = `rgb(${color.join(", ")})`;
                user.pp = 999;
                userList[req.user.id] = user;
                res.sendFile(path.join(__dirname, 'public', 'index.html'));
            })
            .catch(err => {
                console.error('Error:', err);
            });
	})
});

app.get('/get/:file', (req, res) => {
    // i kinda overcomplicted this
    switch (req.params.file) {
        case "script.js": break;
        case "style.css": break;
        case "marioFont.ttf": break;
        default: 
            res.send("fuck you");
            console.log(`[WARNING] gosh damn someone tryna grab something called ${req.params.file}`);
            return;
    }
    res.sendFile(path.join(__dirname, 'public', req.params.file));
});

app.get('/developer.js', (req, res) => {
    if (userList[req.user.id].id != "930064591961079849")
    res.sendFile(path.join(__dirname, 'public', 'script.js'));
})

const userList = {};
const colors = {
    "0": "#116600"
};
let grid = [];

for (let x = 0; x < 20; x++) {
    grid.push([]);
    for (let y = 0; y < 20; y++) {
        grid[x].push({
            ownerID: "0"
        })
    }
}

// i have NO idea what this chunk does but its essential
const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
io.use((socket, next) => {
    if (socket.request.user) {
        next();
    } else {
        next(new Error("unauthorized"));
    }
});

io.on('connection', (socket) => {

    socket.on('requestUserData', () => {
        const user = userList[socket.request.user.id];
        if (typeof user == "undefined") {
            console.log("someone was bugged idk who")
            socket.emit("loginAgain");
            return;
        }
        console.log(`[JOIN] ${user.username} joined the party!`);
        socket.emit('userData', {user, colors, grid});
    });

    socket.on('annex', (selected) => {
        const user = userList[socket.request.user.id];
        if (selected.length*2 > user.pp) return;
        selected.forEach((index) => {
            const sx = Math.floor(index/20);
            const sy = index%20;

            if (grid[sx][sy].ownerID == user.id) return;
            grid[sx][sy].ownerID = user.id;
            user.pp -= 2;
        })
        console.log(`[ANNEX] ${user.username} annexed ${selected.length} provinces`);
        io.emit('mapUpdate', {grid, colors});
        socket.emit('userData', {user, colors, grid});
    })

    socket.on('inspect', (data) => {
        const { sx, sy } = data;
        const tile = grid[sx][sy];
        const user = userList[tile.ownerID]

        socket.emit('showInspect', {tile, user});
    })

    socket.on('disconnect', () => {
        console.log(`[LEAVE] soemone left :(`);
    });
});

function serverIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            // Skip over non-IPv4 addresses and internal (127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on ${serverIP()}:${PORT}`);
});
