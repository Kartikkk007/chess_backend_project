const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ""; 

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        // FIX: Ensure this is the index, not the element
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");                   
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    // FIX: Moved outside loops and fixed the duplicate class addition
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};
const handleMove = (source,target) => {
  const move ={
    from: `${String.fromCharCode(97+source.col)}${8-source.row}`,
    to:`${String.fromCharCode(97+target.col)}${8-target.row}`,
    promotion:'q' 
  };
  socket.emit("move",move);
  
};

const getPieceUnicode = (piece) => {
 const unicodePieces = {
       k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙", 
        // Black Pieces (Solid/Filled versions)
        K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟",
    };
    // If piece is black, we check the Uppercase version
    const key = piece.color === "w" ? piece.type : piece.type.toUpperCase();
    return unicodePieces[key] || "";
};

socket.on("playerRole", function(role){
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole",function(){
  playerRole = null;
  renderBoard();
});

socket.on("boardState",function(fen){
  chess.load(fen);
  renderBoard();
});

socket.on("move",function(move){
  chess.move(move);
  renderBoard();
});

renderBoard()

