const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

// =====================
// CAMERA
// =====================
let camX = 0;
let camY = 0;
let scale = 60;

// =====================
// INPUT
// =====================
let mouse = {x:0,y:0};
let dragging = false;
let lastMouse = {x:0,y:0};

// =====================
// VARIABLES
// =====================
let vars = { a:1, b:1, c:1 };

// =====================
// GRAPHS
// =====================
let graphs = [];
let idCounter = 0;

// =====================
// RESIZE
// =====================
window.addEventListener("resize", ()=>{
    canvas.width = innerWidth;
    canvas.height = innerHeight;
});

// =====================
// TRANSFORM
// =====================
function worldToScreen(x,y){
    return {
        x:(x-camX)*scale + canvas.width/2,
        y:canvas.height/2 - (y-camY)*scale
    };
}

function screenToWorld(x,y){
    return {
        x:(x-canvas.width/2)/scale + camX,
        y:(canvas.height/2-y)/scale + camY
    };
}

// =====================
// SAFE EXPRESSION ENGINE (FIXED)
// =====================
function makeFn(expr){

    expr = expr
    .replace(/\^/g,"**")
    .replace(/(\d)([a-zA-Z])/g,"$1*$2")
    .replace(/([a-zA-Z])(\d)/g,"$1*$2");

    return function(x){
        try {
            return Function("x","a","b","c",`
            const {sin,cos,tan,log,sqrt,abs,PI,E} = Math;
            return ${expr};
            `)(x, vars.a, vars.b, vars.c);
        } catch {
            return NaN;
        }
    };
}

// =====================
// PARSE INPUT
// =====================
function parseInput(input){

    input = input.trim();

    // variable assignment
    if(input.includes("=") && !input.includes("==")){
        let [name,value] = input.split("=").map(s=>s.trim());

        if(vars.hasOwnProperty(name)){
            try{
                vars[name] = Function("a","b","c",`
                const {sin,cos,tan,log,sqrt,abs,PI,E} = Math;
                return ${value};
                `)(vars.a, vars.b, vars.c);

                return {type:"var"};
            }catch{
                return {type:"error"};
            }
        }
    }

    return {type:"graph", expr:input};
}

// =====================
// ADD FORMULA
// =====================
function addFormula(){

    const input = document.getElementById("expr").value;
    if(!input.trim()) return;

    let res = parseInput(input);

    if(res.type === "var"){
        updateUI();
        return;
    }

    graphs.push({
        id:idCounter++,
        expr:res.expr,
        fn:makeFn(res.expr),
                color:`hsl(${Math.random()*360},100%,60%)`
    });

    updateUI();
}

// =====================
// REMOVE
// =====================
function removeGraph(id){
    graphs = graphs.filter(g=>g.id!==id);
    updateUI();
}

// =====================
// UI
// =====================
function updateUI(){

    const list = document.getElementById("list");
    list.innerHTML = "";

    // variables
    const v = document.createElement("div");
    v.innerHTML = `a=${vars.a}<br>b=${vars.b}<br>c=${vars.c}`;
    v.style.marginBottom = "10px";
    list.appendChild(v);

    // graphs
    graphs.forEach(g=>{
        const div = document.createElement("div");

        div.style.borderLeft = `2px solid ${g.color}`;
        div.style.padding = "5px";
        div.style.margin = "5px 0";

        div.innerHTML = `
        ${g.expr}
        <button onclick="removeGraph(${g.id})">x</button>
        `;

        list.appendChild(div);
    });
}

// =====================
// MOUSE
// =====================
canvas.addEventListener("mousemove",(e)=>{

    const rect = canvas.getBoundingClientRect();

    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    const w = screenToWorld(mouse.x,mouse.y);

    document.getElementById("cursor").innerText =
    `x:${w.x.toFixed(2)} y:${w.y.toFixed(2)}`;

    if(dragging){
        camX -= (e.clientX-lastMouse.x)/scale;
        camY += (e.clientY-lastMouse.y)/scale;

        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
    }
});

canvas.addEventListener("mousedown",(e)=>{
    dragging = true;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
});

canvas.addEventListener("mouseup",()=>dragging=false);

// =====================
// ZOOM
// =====================
canvas.addEventListener("wheel",(e)=>{
    e.preventDefault();

    const before = screenToWorld(mouse.x,mouse.y);

    scale *= e.deltaY < 0 ? 1.1 : 0.9;

    const after = screenToWorld(mouse.x,mouse.y);

    camX += before.x - after.x;
    camY += before.y - after.y;
});

// =====================
// GRID
// =====================
function drawGrid(){

    ctx.strokeStyle = "#111";

    for(let i=-100;i<100;i++){

        let x = worldToScreen(i,0).x;
        let y = worldToScreen(0,i).y;

        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x,canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(canvas.width,y);
        ctx.stroke();
    }
}

// =====================
// DRAW GRAPHS
// =====================
function drawGraphs(){

    graphs.forEach(g=>{
        ctx.beginPath();

        let first = true;

        for(let px=0;px<canvas.width;px++){

            let w = screenToWorld(px,0);
            let x = w.x;

            let y = g.fn(x);

            if(!isFinite(y)) continue;

            let p = worldToScreen(x,y);

            if(first){
                ctx.moveTo(p.x,p.y);
                first = false;
            } else {
                ctx.lineTo(p.x,p.y);
            }
        }

        ctx.strokeStyle = g.color;
        ctx.stroke();
    });
}

// =====================
// LOOP
// =====================
function loop(){
    ctx.fillStyle="black";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    drawGrid();
    drawGraphs();

    requestAnimationFrame(loop);
}
loop();
