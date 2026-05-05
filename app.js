const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// --------------------
// CAMERA STATE
// --------------------
let scale = 40;

// camera position (world origin offset)
let camX = 450;
let camY = 300;

// velocity (for inertia)
let velX = 0;
let velY = 0;

let dragging = false;
let lastMouse = { x:0, y:0 };

let mouse = { x:0, y:0 };

// --------------------
// MOUSE TRACKING
// --------------------
canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
});

canvas.addEventListener("mouseup", () => {
    dragging = false;
});

canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;

    // world coords display
    let wx = (mouse.x - camX) / scale;
    let wy = (camY - mouse.y) / scale;

    document.getElementById("cursor").innerText =
        `x: ${wx.toFixed(2)}, y: ${wy.toFixed(2)}`;

    // PAN (drag camera)
    if (dragging) {
        let dx = e.clientX - lastMouse.x;
        let dy = e.clientY - lastMouse.y;

        velX = dx;
        velY = dy;

        camX += dx;
        camY += dy;

        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
    }
});

// --------------------
// ZOOM (centered on mouse)
// --------------------
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    let zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    // world position under cursor before zoom
    let wx = (mouse.x - camX) / scale;
    let wy = (camY - mouse.y) / scale;

    scale *= zoomFactor;

    // keep cursor locked on same world point
    camX = mouse.x - wx * scale;
    camY = mouse.y + wy * scale;

    draw();
});

// --------------------
// SAFE PARSER
// --------------------
function compile(expr) {
    expr = expr
        .replaceAll("^", "**")
        .replaceAll("sin", "Math.sin")
        .replaceAll("cos", "Math.cos")
        .replaceAll("tan", "Math.tan")
        .replaceAll("sqrt", "Math.sqrt")
        .replaceAll("abs", "Math.abs");

    return new Function("x", `return ${expr};`);
}

// --------------------
// GRID
// --------------------
function grid() {
    ctx.strokeStyle = "#ddd";

    for (let x = -50; x < 50; x++) {
        ctx.beginPath();
        ctx.moveTo(camX + x*scale, 0);
        ctx.lineTo(camX + x*scale, 600);
        ctx.stroke();
    }

    for (let y = -50; y < 50; y++) {
        ctx.beginPath();
        ctx.moveTo(0, camY + y*scale);
        ctx.lineTo(900, camY + y*scale);
        ctx.stroke();
    }

    ctx.strokeStyle = "black";

    ctx.beginPath();
    ctx.moveTo(camX, 0);
    ctx.lineTo(camX, 600);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, camY);
    ctx.lineTo(900, camY);
    ctx.stroke();
}

// --------------------
// DRAW GRAPH
// --------------------
function draw() {
    // 🌟 WHITE BACKGROUND (fixed)
    ctx.clearRect(0, 0, 900, 600);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 900, 600);

    grid();

    const input = document.getElementById("expr").value || "x*x";
    const f = compile(input);

    ctx.strokeStyle = "blue";
    ctx.beginPath();

    let first = true;

    for (let px = 0; px < 900; px++) {

        let x = (px - camX) / scale;

        let y = 0;
        try {
            y = f(x);
        } catch {
            y = 0;
        }

        let py = camY - y * scale;

        if (first) {
            ctx.moveTo(px, py);
            first = false;
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.stroke();
}

// --------------------
// INERTIA UPDATE LOOP
// --------------------
function update() {
    // inertia decay
    velX *= 0.85;
    velY *= 0.85;

    // optional: slow camera drift feel
    camX += velX;
    camY += velY;
}

// main loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
