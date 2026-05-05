const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let scale = 40; // zoom level (pixels per unit)
let offsetX = 450;
let offsetY = 300;

let mouse = { x: 0, y: 0 };

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    let worldX = (mouse.x - offsetX) / scale;
    let worldY = (offsetY - mouse.y) / scale;

    document.getElementById("coords").innerText =
        `x: ${worldX.toFixed(2)}, y: ${worldY.toFixed(2)}`;
});

// ----------------------------
// EXPRESSION PARSER (safe-ish)
// ----------------------------
function parseExpr(expr) {
    expr = expr
        .replaceAll("^", "**")
        .replaceAll("sin", "Math.sin")
        .replaceAll("cos", "Math.cos")
        .replaceAll("tan", "Math.tan");

    return function(x) {
        try {
            return eval(expr.replaceAll("x", `(${x})`));
        } catch {
            return 0;
        }
    };
}

// ----------------------------
// DRAW GRID (like matplotlib)
// ----------------------------
function drawGrid() {
    ctx.strokeStyle = "#111";

    for (let x = -50; x < 50; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * scale, 0);
        ctx.lineTo(offsetX + x * scale, 600);
        ctx.stroke();
    }

    for (let y = -50; y < 50; y++) {
        ctx.beginPath();
        ctx.moveTo(0, offsetY + y * scale);
        ctx.lineTo(900, offsetY + y * scale);
        ctx.stroke();
    }

    // axes
    ctx.strokeStyle = "#00ffcc";

    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, 600);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offsetY);
    ctx.lineTo(900, offsetY);
    ctx.stroke();
}

// ----------------------------
// DRAW GRAPH
// ----------------------------
function drawGraph() {
    const input = document.getElementById("expr").value || "x*x";
    const f = parseExpr(input);

    ctx.clearRect(0, 0, 900, 600);

    drawGrid();

    ctx.strokeStyle = "#00ffcc";
    ctx.beginPath();

    let first = true;

    for (let px = 0; px < 900; px++) {
        let x = (px - offsetX) / scale;
        let y = f(x);

        let py = offsetY - y * scale;

        if (first) {
            ctx.moveTo(px, py);
            first = false;
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.stroke();
}

// ----------------------------
// ZOOM (Matplotlib-style feel)
// ----------------------------
function zoomIn() {
    scale *= 1.2;
    drawGraph();
}

function zoomOut() {
    scale /= 1.2;
    drawGraph();
}

// initial render
drawGraph();
