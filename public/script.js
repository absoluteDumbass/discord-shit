const socket = io();
let loaded = false;
let user = {};
const UIdiv = document.getElementById('ui');
let grid = [];
let selected = [];
let color = {}

// the UI im talking about is in the bottom left side of the screen
const UImode = {
    empty: "",
    conquer: `<p class="fat">CONQUEST</p>
    <p>each provinces CONQUERED need 2 political power!</p>
    <button id="annex">ANNEX @hi this is a nice easter egg, please no hacking thanks@ provinces</button>`,
    needpp: "<p>FAILED! you need @1@ more POLITICAL POWER!</p>",
    annexed: "<p>you successfully ANNEXED @1@ provinces!</p>",
    notyours: "<p>unfortunately, you don't own all of the selected provinces.</p>"
}
UIdiv.addEventListener('click', (event) => {
  const isButton = event.target.nodeName === 'BUTTON';
  if (!isButton) {
    UIset("empty", []);
    selected = [];
    return;
  }

  // button interections, event.target.id is the id of the button clicked
  switch (event.target.id) {
    case "annex":
        if (selected.length == 0) return;
        if (selected.length*2 <= user.pp) {
            UIset("annexed", [selected.length]);
            socket.emit("annex", selected);
            selected = [];
        } else {
            UIset("needpp", [selected.length*2-user.pp]);
        }
        break;
    default:
        console.log("Try changing the id in the switch statement too smh");
        break;
  }
})

socket.on('connect', () => {
    socket.emit('requestUserData');
    console.log("Connected!")
});

socket.on("loginAgain", () => {
    window.location.href = "/";
})

socket.on('userData', (syncData) => {
    console.log(syncData);
    user = syncData.user;
    color = syncData.colors;
    grid = syncData.grid;

    if (user.length < 1) {
        window.location.href = "/";
        return;
    }

    let rank = "the FORBIDDEN white role";
    const ranks = ["Grasshopper", "Butterfly", "Chicken", "Wolf", "Crocodile", "Bear", "Plague Doctor", "Druid", // low ranks 0-39
        "Dragon", "UFO", "Demon", "Crabzilla", // mid ranks 40-59
        "Necromancer", "Mage", "rat king", "god finger", "robo santa", "bowling ball", "tornado", "grey goo", "super pumpkin"]; // high ranks 60+
    const rankId = Math.floor(user.level/5);
    
    document.getElementById('avatar').src = user.avatarUrl;
    document.getElementById('greeting').innerText = `hello, ${user.username}!`;
    //document.getElementById('discord-id').innerText = `Your Discord ID: ${user.id}`;
    document.getElementById('discord-level').innerHTML = `your LEVEL is at a fascinating number ${user.level}!`;
    document.getElementById('discord-rank').innerHTML = `you have the rank of ${ranks[rankId].toUpperCase()}`;
    document.getElementById('political-power').innerText = `you currently have ${user.pp} POLITICAL POWER!`;
    loaded = true;
});

socket.on('mapUpdate', (data) => {
    grid = data.grid;
    color = data.colors;
})

function setup() {
    let canvas = createCanvas(windowHeight, windowHeight);
    canvas.parent('canvas');
    console.log("Created Canvas");
}
function windowResized() {
    //let size = min(windowWidth, windowHeight);
    resizeCanvas(windowHeight, windowHeight);
}
function draw() {
    if (!loaded) return;
    background("#666666");
    fill(255)
    text("does a chicken have toes?", windowHeight/2, windowHeight/2, 30);
    let s = windowHeight/20;
    for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
            fill(color[grid[x][y].ownerID]);
            if (selected.includes((x*20+y))) {
                fill(255);
            }
            square(x*s, y*s, s);
        }
    }
}

function mouseClicked() {
    if (mouseX<0) return;
    const clickedX = Math.floor(mouseX/windowHeight*20);
    const clickedY = Math.floor(mouseY/windowHeight*20);
    const index = clickedX*20+clickedY;

    const found = selected.indexOf(index);
    if (found > -1) {
        selected.splice(found, 1);
    } else {
        selected.push(index);
    }

    UIset("conquer", [`${selected.length}/${Math.floor(user.pp/2)}`]);
}

function UIset(mode, fillIn) {
    let base = UImode[mode].split("@");

    if (base.length == 1) {
        UIdiv.innerHTML = UImode[mode];
    }

    for (let i = 0; i < fillIn.length; i++) {
        base[1+i*2] = fillIn[i];
    }

    UIdiv.innerHTML = base.join("");
}