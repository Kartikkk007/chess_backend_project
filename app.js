const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require("path");

const app = express();

const server = http.createServer(app);


// Update your socket initialization (line 12 approx):
const io = socket(server, {
    cors: {
        origin: "*", // Or your specific Render URL like "https://your-chess-app.onrender.com"
        methods: ["GET", "POST"]
    }
});

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function(uniquesocket) {
    console.log("A user connected:", uniquesocket.id);

    // Assign roles to the first two players
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    // Send the current board state to the new connection
    uniquesocket.emit("boardState", chess.fen());

    uniquesocket.on("disconnect", function() {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
        
        // Optional: Reset game if a player leaves
        if (Object.keys(players).length === 0) {
            chess.reset();
        }
        console.log("User disconnected:", uniquesocket.id);
    });

    uniquesocket.on("move", (move) => {
        try {
            // Validate that the correct player is moving
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move attempted:", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (error) {
            console.error("Error processing move:", error);
            uniquesocket.emit("error", "An error occurred while processing your move.");
        }
    });
});

// Render provides the port via an environment variable
const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
    console.log(`listening on port ${port}`);
});