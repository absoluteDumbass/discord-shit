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
const cfg = require("./config.json")
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
app.use("/static", express.static(__dirname + '/public'));

// Routes
app.get('/', (req, res) => {
    // Check if this is an actual page visit (e.g., by checking a query parameter, user-agent, etc.)
    const isBot = req.headers['user-agent'].includes('bot'); // Example for bots/crawlers
    const isSharedLink = req.query.shared === 'true'; // Example query parameter for shared links

    if (isBot || isSharedLink) {
        // Serve the root page with custom meta tags
        res.send(`
            <html>
                <head>
                    <title>poo poo</title>
                    <meta name="title" content="${cfg.meta.title}">
                    <meta name="description" content="${cfg.meta.description}">
                    <meta name="keywords" content="${cfg.meta.tags}">
                    <meta name="robots" content="index, follow">
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                    <meta name="language" content="English">
                </head>
                <body>
                    <h1>go away scrapers!</h1>
                </body>
            </html>
        `);
    } else {
        // Redirect to login for other visits
        res.redirect('/login');
    }
});

app.get('/login', passport.authenticate('discord'));

app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication
        res.redirect('/profile');
    }
);

app.get('/profile', (req, res) => {
    if (!req.isAuthenticated() || !req.user) res.redirect('/');

	mee6.getUserXp("522561390330904585", req.user.id).then(user => {
        getColorFromURL(user.avatarUrl)
            .then(color => {
                console.log(`[COLOR] ${user.id} is rgb(${color.join(',')})`);
                // Store the dominant color in your server or database
                colors[user.id] = `rgb(${color.join(", ")})`;
                if (userList[req.user.id]) {
                    userList[req.user.id].level = user.level
                    userList[req.user.id].username = user.username
                    userList[req.user.id].avatarUrl = user.avatarUrl
                    user = userList[req.user.id];
                } else {
                    // initialization
                    user.pp = user.level;
                    user.army = {
                        infantry: 0,
                        artilery: 0,
                        engineer: 0
                    }
                }
                userList[req.user.id] = user;
                res.sendFile(path.join(__dirname, 'public', 'index.html'));
            })
            .catch(err => {
                console.error('Error:', err);
            });
	})
});

const userList = {};
const colors = {
    "0": "#116600"
};
let grid = [];

for (let x = 0; x < 50; x++) {
    grid.push([]);
    for (let y = 0; y < 50; y++) {
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
    if (socket.request.user || !userList[socket.request.user.id]) {
        next();
    } else {
        next(new Error("unauthorized"));
    }
});

// Error-handling middleware
app.use((err, req, res, next) => {
    if (err.message === 'Unauthorized') {
        // Redirect to login page
        return res.redirect('/login');
    }

    // For other errors, send a generic error response
    res.status(500).json({
        message: err.message || 'Internal Server Error'
    });
});

io.on('connection', (socket) => {
    const user = userList[socket.request.user.id];
    socket.on('requestUserData', () => {
        if (!user) {
            console.log("someone was bugged and apparently his id is " + socket.request.user.id)
            socket.emit("loginAgain");
            return;
        }
        console.log(`[JOIN] ${user.username} joined the party!`);
        socket.emit('userData', {user, colors, grid});
    });

    socket.on("quickData", () => {
        socket.emit("quickData", user.pp)
    })

    socket.on('annex', (selected) => {
        if (selected.length > user.pp) return;
        const target = grid[(Math.floor(selected[0]/50))][(selected[0]%50)].ownerID;
        if (target == user.id) return;
        
        let mul = false;
        selected.forEach((index) => {
            const sx = Math.floor(index/50);
            const sy = index%50;

            if (!(grid[sx][sy].ownerID == target))  mul = true;
        })

        if (mul) {
            socket.emit("message", "it would be nice if you only attack 1 person at a time")
            return;
        }

        if (target === "0") {
            user.pp -= selected.length;
        } else {
            // battle logic!
            console.log(`[ATTACK] ${user.username} is attacking ${target} for ${selected.length} provinces!`);
            const atk = {
                atk: 0,
                def: 0
            }
            const def = {
                atk: 0,
                def: 0
            }
            let temp = userList[target].army;
            atk.atk += temp.infantry * cfg.infantry.attack;
            atk.atk += temp.artilery * cfg.artilery.attack;

            atk.def += temp.infantry * cfg.infantry.defense;
            atk.def += temp.engineer * cfg.artilery.defense;

            temp = user.army
            def.atk += temp.infantry * cfg.infantry.attack;
            def.atk += temp.artilery * cfg.artilery.attack;

            def.def += temp.infantry * cfg.infantry.defense;
            def.def += temp.engineer * cfg.artilery.defense;
            if (atk.atk <= def.atk) {
                const aloss = Math.max((def.atk-atk.def)/2, 5);
                const dloss = Math.max((atk.atk-def.def)/2, 5);

                user.pp--;
                socket.emit("message", `your attack has failed. you suffered ${dloss} while dealing ${aloss}.`);
            } else {
                const aloss = Math.max((def.atk-atk.def)/2, 5);
                const dloss = Math.max((atk.atk-def.def), 5);

                selected.forEach((index) => {
                    const sx = Math.floor(index/50);
                    const sy = index%50;
        
                    grid[sx][sy].ownerID = user.id;
                    user.pp--;
                });

                socket.emit("message", `success! you suffered ${dloss} while dealing ${aloss}.`);
            }
        }

        io.emit('mapUpdate', {grid, colors});
        socket.emit('userData', {user, colors, grid});
    })

    socket.on('inspect', (data) => {
        const { sx, sy } = data;
        const tile = grid[sx][sy];
        const target = userList[tile.ownerID]

        socket.emit('showInspect', target);
    });

    socket.on("army", () => {
        socket.emit("showArmy", user.army);
    })

    socket.on('recruit', (type) => {
        const price = cfg[type].traincost;
        if (user.pp < price) {
            return;
        }
        user.pp -= price;
        user.army[type]++;
        socket.emit("showArmy", user.army);
    })

    socket.on('disconnect', () => {
        console.log(`[LEAVE] soemone left :(`);
    });
});

// For non-technical people who don't understand what this is: 
// No, this is not an IP logger. I'm trying to know where the server is hosted in.
function serverIP() {
    const interfaces = os.networkInterfaces(); // this only gets the list of IPs from my own OS
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
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
