const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let scale = 60;

// camera
let camX = 0;
let camY = 0;

let mouse = {x:0,y:0};
let dragging = false;
let lastMouse = {x:0,y:0};

// graphs
let graphs = [];
let idCounter = 0;

// --------------------
// VARIABLES (NEW CORE FEATURE)
// --------------------
let vars = {
    a: 1,
    b: 1,
    c: 1
};

// --------------------
// RESIZE
// --------------------
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// --------------------
// WORLD TRANSFORM
// --------------------
function worldToScreen(x,y){
    return {
        x: (x*scale - camX) + canvas.width/2,
        y: canvas.height/2 - (y*scale - camY)
    };
}

function screenToWorld(x,y){
    return {
        x: (x - canvas.width/2 + camX) / scale,
        y: (canvas.height/2 - y + camY) / scale
    };
}

// --------------------
// SAFE EVAL WITH VARIABLES
// --------------------
function makeFn(expr){

    expr = expr.replaceAll("^","**");

    return function(x){
        try {
            return Function("x","a","b","c",`
            with(Math){
                return ${expr};
            }
            `)(x, vars.a, vars.b, vars.c);
        } catch {
            return NaN;
        }
    };
}

// --------------------
// VARIABLE PARSER (NEW FEATURE)
// --------------------
function handleInput(expr){

    expr = expr.trim();

    // CASE 1: variable assignment
    if(expr.includes("=") && !expr.includes("==")){

        let [name, value] = expr.split("=").map(s=>s.trim());

        if(vars.hasOwnProperty(name)){
            let num = Number(value);

            if(!isNaN(num)){
                vars[name] = num;
                return { type:"var", ok:true };
            }
        }

        return { type:"var", ok:false };
    }

    // CASE 2: graph expression
    return { type:"expr", value:expr };
}

// --------------------
// ADD GRAPH / HANDLE INPUT
// --------------------
function addGraph(){

    const input = document.getElementById("expr").value;
    if(!input.trim()) return;

    const result = handleInput(input);

    // variable assignment
    if(result.type === "var"){
        renderUI();
        return;
    }

    let fn;
    let valid = true;
    let error = "";

    try {
        fn = makeFn(result.value);
        let test = fn(1);

        if(!isFinite(test)) throw new Error("Bad output");

    } catch(e){
        valid = false;
        error = e.message;
        fn = ()=>NaN;
    }

    graphs.push({
        id: idCounter++,
        expr: result.value,
        fn,
        color:`hsl(${Math.random()*360},100%,60%)`,
                valid,
                error
    });

    renderUI();
}

// --------------------
// REMOVE GRAPH
// --------------------
function removeGraph(id){
    graphs = graphs.filter(g => g.id !== id);
    renderUI();
}

// --------------------
// UI
// --------------------
function renderUI(){
    const list = document.getElementById("list");
    list.innerHTML = "";

    // show variables at top
    const varBox = document.createElement("div");
    varBox.style.border = "1px solid #00ffcc44";
    varBox.style.padding = "6px";
    varBox.style.marginBottom = "10px";

    varBox.innerHTML =
    `a=${vars.a}<br>b=${vars.b}<br>c=${vars.c}`;

    list.appendChild(varBox);

    // graphs
    graphs.forEach(g=>{
        const div = document.createElement("div");
        div.style.borderLeft = `2px solid ${g.color}`;
        div.style.padding = "6px";
        div.style.margin = "6px 0";

        div.innerHTML = `
        ${g.expr}
        ${!g.valid ? `<div style="color:red;font-size:10px">${g.error}</div>` : ""}
        <button onclick="removeGraph(${g.id})">x</button>
        `;

        list.appendChild(div);
    });
}

// --------------------
// CAMERA + MOUSE
// --------------------
canvas.addEventListener("mousedown",(e)=>{
    dragging = true;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
});

canvas.addEventListener("mouseup",()=>dragging=false);

canvas.addEventListener("mousemove",(e)=>{

    const rect = canvas.getBoundingClientRect();

    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    let w = screenToWorld(mouse.x, mouse.y);

    document.getElementById("cursor").innerText =
    `x:${w.x.toFixed(2)} y:${w.y.toFixed(2)} | a:${vars.a} b:${vars.b}`;

    if(dragging){
        camX -= (e.clientX - lastMouse.x);
        camY += (e.clientY - lastMouse.y);

        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
    }
});

// --------------------
// ZOOM
// --------------------
canvas.addEventListener("wheel",(e)=>{
    e.preventDefault();

    let before = screenToWorld(mouse.x, mouse.y);

    scale *= e.deltaY < 0 ? 1.1 : 0.9;

    let after = screenToWorld(mouse.x, mouse.y);

    camX += (after.x - before.x) * scale;
    camY += (after.y - before.y) * scale;
});

// --------------------
// GRID
// --------------------
function drawGrid(){
    ctx.strokeStyle = "#111";

    let step = scale;

    for(let i=-100;i<100;i++){
        ctx.beginPath();
        ctx.moveTo(camX+i*step,0);
        ctx.lineTo(camX+i*step,canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0,camY+i*step);
        ctx.lineTo(canvas.width,camY+i*step);
        ctx.stroke();
    }
}

// --------------------
// GRAPH DRAW
// --------------------
function drawGraphs(){

    graphs.forEach(g=>{
        ctx.beginPath();

        let first=true;

        for(let px=0; px<canvas.width; px++){

            let w = screenToWorld(px,0);
            let x = w.x;

            let y = g.fn(x);

            if(!isFinite(y)) continue;

            let p = worldToScreen(x,y);

            if(first){
                ctx.moveTo(p.x,p.y);
                first=false;
            } else {
                ctx.lineTo(p.x,p.y);
            }
        }

        ctx.strokeStyle = g.color;
        ctx.stroke();
    });
}

// --------------------
function loop(){
    ctx.fillStyle="black";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    drawGrid();
    drawGraphs();

    requestAnimationFrame(loop);
}
loop();
