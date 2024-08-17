const socket = io();
let loaded = false;
let user = {};
const UIdiv = document.getElementById('ui');
let grid = [];
let selected = [];
let colors = {};

const randomFacts = [
    `contrary to popular belief, froggie hates eating flys`,
    `froggie says that flys tastes like literal shit`,
    `shimmy shimmy ey shimmy ey shimmy ahh`,
    `artilery is actually more cost effective for pure damage`,
    `all artilery and engineers will die without infantry`,
    `the frog is only there to make the page feel less empty`,
    `the map is this big primarily because of @ercan, @eyequ, and @airod`,
    `@ercan, @eyequ, and @airod if you guys are reading this, go touch grass`,
    `huge thanks to game roomians, fuck you generalians`,
    `venus is one letter away from uh the word genus`
]

// the UI im talking about is in the bottom left side of the screen
const UImode = {
    custom: `<p>@1@</p>
    <button id="back">okay</button>`, // use custom for short texts with no special buttons
    mainmenu: `<p class="fat">oveview</p>
    <button id="army">army</button>
    <button id="patchnotes">patch notes</button>
    <br/><br/>
    <div class="deep">
    <p class="fat">map modes</p>
    <p>(oh these doesn't work yet)</p>
    <div class="horizontal">
    <button>political</button>
    <button>development</button>
    <button>army</button>
    </div>
    </div>`,
    patchnotes:`<p class="fat">patch notes</p>
    <p>unnumbered beta version</p>
    <div class="deep small">
    <p>-level up! we are now in beta stage</p>
    <p>-generally added army and combat</p>
    <p>-you can now train your troops</p>
    <p>-added the first unit types: infantry, artilery, engineer</p>
    <p>-your political power now finally updates every day at 23:59:59 UTC</p>
    </div>`,
    whattodo: `<div class="deep">
    <p class="fat">what to do?</p>
    <p>only click these after you selected the province that you want</p>
    </div>
    <button id="inspect">inspect</button>
    <button id="annex">annex @hi this is a nice easter egg, please no hacking thanks@ province(s)</button>`,
    comfirmdeselect: `<div class="deep">
    <p class='fat'>are you sure</p>
    <p>you can also deselect provinces by clicking on the same province</p>
    <p>this will take you to the main menu</p>
    </div>
    <button id="deselect">yes, deselect everything.</button>
    <button id="back">no, go back!</button>`,
    inspect: `<div class="deep">
    <p>the province is owned by</p>
    <p class="fat">@1@</p>
    <br/>
    <p>level: @2@</p>
    <p>political power: @3@</p>
    <br/>
    <div class="small">
    <p>their army is estimated to be</p>
    <p>@4@ infantry</p>
    <p>@5@ artilery</p>
    <p>@6@ engineer</p>
    <br/>
    <p>invading them would be @7@</p>
    <p>as they are @8@% of your level</p>
    </div>
    </div>
    <button id="back">amazing!</button>`,
    army: `<p class="fat">your army consists of</p>
    <div class="deep">
    <p>@1@ infantry<button id="recruitI">recruit</button></p>
    <p>@2@ artilery<button id="recruitA">recruit</button></p>
    <p>@3@ engineers<button id="recruitE">recruit</button></p>
    </div>`,
    wait: `<p>wait for a moment</p>`
}
UIdiv.addEventListener('click', (event) => {
  const isButton = event.target.nodeName === 'BUTTON';
  if (!isButton) {
    if (selected.length > 1) {
        UIset("comfirmdeselect");
        return;
    }
    UIset("mainmenu");
    clearSelection();
    return;
  }

  // button interections, event.target.id is the id of the button clicked
  switch (event.target.id) {
    case "annex":
        if (selected.length <= user.pp) {
            UIset("custom", [`successfully annexed ${selected.length} provinces`]);
            socket.emit("annex", selected);
            clearSelection();
        } else {
            UIset("custom", [`you need ${selected.length-user.pp} more political power to do that<br/>each provinces need 1 political power to conquer`]);
        }
        break;
    case "inspect":
        if (selected.length != 1) {
            UIset("custom", ["please just select 1 province"]);
            break;
        }
        const sx = Math.floor(selected[0]/50);
        const sy = selected[0]%50;
        const tile = grid[sx][sy];
        clearSelection();
        if (tile.ownerID == "0") {
            UIset("custom", ["sir, it's empty"]);
            break;
        }
        UIset("wait")
        socket.emit("inspect", {sx,sy});
        //UIset("inspect", ["your mom i think"])
        break;
    case "deselect":
        UIset("mainmenu");
        clearSelection();
        break;
    case "back":
        if (selected.length == 0) {
            UIset("mainmenu");
            break;
        }
        UIset("whattodo", [`${selected.length}`]);
        break;
    case "patchnotes":
        UIset("patchnotes");
        break;
    case "army":
        UIset("wait");
        socket.emit("army");
        break;
    case "recruitI":
        socket.emit("recruit", "infantry");
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
    window.location.replace("/");
    window.location.reload();
})

socket.on('userData', (syncData) => {
    console.log(syncData);
    user = syncData.user;
    colors = syncData.colors;
    grid = syncData.grid;

    let rank = "the FORBIDDEN white role";
    const ranks = ["Grasshopper", "Butterfly", "Chicken", "Wolf", "Crocodile", "Bear", "Plague Doctor", "Druid", // low ranks 0-39
        "Dragon", "UFO", "Demon", "Crabzilla", // mid ranks 40-59
        "Necromancer", "Mage", "rat king", "god finger", "robo santa", "bowling ball", "tornado", "grey goo", "super pumpkin"]; // high ranks 60+
    const rankId = Math.floor(user.level/5);

    document.getElementById('avatar').src = user.avatarUrl;
    document.getElementById('greeting').innerText = `hello, ${user.username}!`;
    //document.getElementById('discord-id').innerText = `Your Discord ID: ${user.id}`;
    document.getElementById('discord-level').innerHTML = `your level is ${user.level}!`;
    document.getElementById('discord-rank').innerHTML = `your rank is ${ranks[rankId].toLowerCase()}`;
    document.getElementById('political-power').innerHTML = `you currently have ${user.pp} political power!`;

    if (mobileCheck()) {
        document.body.style.overflow = "scroll";
        document.documentElement.style.setProperty('--fat-font-size', '1.5em');
        document.documentElement.style.setProperty('--def-font-size', '0.7em');
        document.getElementById('avatar').style.height = "5em";
    }

    if (!loaded) UIset("mainmenu");
    loaded = true;
    draw();
});

socket.on("quickData", (a) => {
    document.getElementById('political-power').innerHTML = `you currently have ${a} political power!`;
})

socket.on('mapUpdate', (data) => {
    grid = data.grid;
    colors = data.colors;
    draw();
})

socket.on('showInspect', (a) => {
    const est = [
        Math.round(user.level / 2), // infantry
        Math.round(user.level / 30),
        Math.round(user.level / 10)
    ]
    const compare = Math.round(a.level/user.level*100);
    const ranges = [
        { min: 0, max: 9, label: 'too easy' },
        { min: 10, max: 39, label: 'one sided' },
        { min: 40, max: 89, label: 'costly' },
        { min: 90, max: 110, label: 'insane' },
        { min: 111, max: Infinity, label: 'suicidal' }
      ];
      
    const difficulty = ranges.find(range => compare >= range.min && compare <= range.max).label;
    UIset('inspect', [a.username, a.level, a.pp, est[0], est[1], est[2], difficulty, compare])
})

socket.on('showArmy', (a) => {
    socket.emit("quickData");
    UIset('army', [a.infantry, a.artilery, a.engineer]);
})

function setup() {
    let canvas = createCanvas(windowHeight, windowHeight);
    canvas.parent('canvas');
    console.log("Created Canvas");
}
function windowResized() {
    //let size = min(windowWidth, windowHeight);
    resizeCanvas(windowHeight, windowHeight)
    return;
}
function draw() {
    background("#666666");
    fill(255)
    text("Pretty sure this is made for Landscape mode,", windowWidth, windowHeight/2-30);
    text("please turn your phone to sideway.", windowWidth, windowHeight/2);
    if (windowWidth < windowHeight) return;
    if (!loaded) return;
    frameRate(0)
    let s = windowHeight/50;
    stroke('rgba(0, 0, 0, 0.25)');
    for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
            let c = color(colors[grid[x][y].ownerID]);
            if (selected.includes((x*50+y))) c = selectedColor(c);
            fill(c);
            square(x*s, y*s, s);
        }
    }
}

function mouseClicked() {
    if (mouseX<0) return;
    const clickedX = Math.floor(mouseX/windowHeight*50);
    const clickedY = Math.floor(mouseY/windowHeight*50);
    const index = clickedX*50+clickedY;

    const found = selected.indexOf(index);
    if (found > -1) {
        selected.splice(found, 1);
        let s = windowHeight/50;
        let c = color(colors[grid[clickedX][clickedY].ownerID]);
        fill(c);
        square(clickedX*s, clickedY*s, s);
    } else {
        selected.push(index);
        let s = windowHeight/50;
        let c = selectedColor(color(colors[grid[clickedX][clickedY].ownerID]));
        fill(c);
        square(clickedX*s, clickedY*s, s);
    }

    if (selected.length == 0) {
        UIset("mainmenu");
        return;
    }

    UIset("whattodo", [`${selected.length}`]);
}

function UIset(mode, fillIn = []) {
    console.log(mode)
    let base = UImode[mode].split("@")

    if (base.length == 1) {
        UIdiv.innerHTML = UImode[mode];
    }

    for (let i = 0; i < fillIn.length; i++) {
        base[1+i*2] = fillIn[i];
    }

    UIdiv.innerHTML = base.join("") + `<img id="frog" alt="frog" src="/static/frog.png">`;
}

function mobileCheck() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

function selectedColor(c) {
    colorMode(HSL, 360, 100, 100);
    let h = hue(c);
    let s = saturation(c);
    let l = lightness(c)+40;

    s = constrain(s, 0, 100);
    l = constrain(l, 0, 100);

    let newColor = color(h, s, l);

    colorMode(RGB, 255);

    return newColor;
}

function clearSelection() {
    selected = [];
    draw();
    return; 
}