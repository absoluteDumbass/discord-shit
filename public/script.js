const socket = io();
let loaded = false;
let user = {};
const UIdiv = document.getElementById('ui');
let grid = [];
let selected = [];
let colors = {};

// the UI im talking about is in the bottom left side of the screen
const UImode = {
    custom: `<p>@1@</p>
    <button id="back">okay</button>`, // use custom for short texts with no special buttons
    mainmenu: `<p class="fat">MAP MODES</p>
    <button>political</button>
    <button>development</button>
    <button>army</button>
    <hr/>
    <p class="fat">THINGS THAT HAPPENED</p>
    <p>to your beautiful nation</p>
    <p>(insert NEWS here)</p>
    <hr/>
    <p>click to SELECT provinces!</p>
    <p>click on the left side of the screen to DESELECT everything!</p>`,
    whattodo: `<p class="fat">what to do?</p>
    <p>ONLY click these after you selected the province that you want</p>
    <button id="inspect">inspect</button>
    <button id="conquerUI">conquer</button>`,
    conquer: `<p class="fat">CONQUEST</p>
    <p>each provinces CONQUERED need 2 political power!</p>
    <p>you can only ANNEX @1@ provinces</p>
    <button id="annex">ANNEX @hi this is a nice easter egg, please no hacking thanks@ province(s)</button>`,
    comfirmdeselect: `<p class='fat'>are you sure</p>
    <p>you can also deselect individual provinces by clicking on the same province</p>
    <button id="deselect">YES, deselect everything.</button>
    <button id="back">NO, go back!</button>`,
    inspect: `<p>the province is owned by</p>
    <p class="fat">@1@</p>
    <p>he is currently LEVEL @2@ with</p>
    <p>@3@ POLITICAL POWER</p>`,
    wait: `<p>WAIT FOR A MOMENT</p>`
}
UIdiv.addEventListener('click', (event) => {
  const isButton = event.target.nodeName === 'BUTTON';
  if (!isButton) {
    if (selected.length) {
        UIset("comfirmdeselect");
        return;
    }
    UIset("mainmenu");
    return;
  }

  // button interections, event.target.id is the id of the button clicked
  switch (event.target.id) {
    case "annex":
        if (selected.length*2 <= user.pp) {
            UIset("custom", [`successfully ANNEXED ${selected.length} provinces`]);
            socket.emit("annex", selected);
            selected = [];
        } else {
            UIset("custom", [`you need ${selected.length*2-user.pp} more POLITICAL POWER to do that`]);
        }
        break;
    case "inspect":
        if (selected.length != 1) {
            UIset("custom", ["please just select 1 province"]);
            break;
        }
        const sx = Math.floor(selected[0]/20);
        const sy = selected[0]%20;
        const tile = grid[sx][sy];
        selected = [];
        if (tile.ownerID == "0") {
            UIset("custom", ["sir, it's EMPTY"]);
            break;
        }
        UIset("wait")
        socket.emit("inspect", {sx,sy});
        //UIset("inspect", ["your mom i think"])
        break;
    case "conquerUI":
        if (selected.length == 0) {
            UIset("custom", ["you need to select 1 or more provinces"]);
            break;
        }
        UIset("conquer", [`${Math.floor(user.pp/2)}`, `${selected.length}`]);
        break;
    case "deselect":
        UIset("mainmenu");
        selected = [];
        break;
    case "back":
        UIset("whattodo");
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
    colors = syncData.colors;
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
    document.getElementById('discord-level').innerHTML = `your <span class="capitalized">LEVEL</span> is at a fascinating number ${user.level}!`;
    document.getElementById('discord-rank').innerHTML = `you have the rank of <span class="capitalized">${ranks[rankId].toUpperCase()}</span>`;
    document.getElementById('political-power').innerHTML = `you currently have ${user.pp} <span class="capitalized">POLITICAL POWER!</span>`;

    if (mobileCheck()) {
        document.body.style.overflow = "scroll";
        document.documentElement.style.setProperty('--fat-font-size', '1.5em');
        document.documentElement.style.setProperty('--def-font-size', '0.7em');
        document.getElementById('avatar').style.height = "5em";
    }

    if (!loaded) UIset("mainmenu");
    loaded = true;
});

socket.on('mapUpdate', (data) => {
    grid = data.grid;
    colors = data.colors;
})

socket.on('showInspect', (a) => {
    UIset('inspect', [a.user.username, a.user.level, a.user.pp])
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
    let s = windowHeight/20;
    for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
            let c = color(colors[grid[x][y].ownerID]);
            if (selected.includes((x*20+y))) c = selectedColor(c);
            fill(c);
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

    //UIset("conquer", [`${selected.length}/${Math.floor(user.pp/2)}`]);
    UIset("whattodo");
}

function UIset(mode, fillIn = []) {
    console.log(mode)
    let base = parseHTML(UImode[mode]).split("@")

    if (mode == "custom") {
        fillIn.forEach((v, i, a) => {
            a[i] = v.replace(/[A-Z]/g, letter => `<span class="capitalized">${letter}</span>`);
        });
    }

    if (base.length == 1) {
        UIdiv.innerHTML = UImode[mode];
    }

    for (let i = 0; i < fillIn.length; i++) {
        base[1+i*2] = fillIn[i];
    }

    UIdiv.innerHTML = base.join("");

    // add a class to identify texts with both capitalized and fat class for custom css
    const elements = UIdiv.querySelectorAll('.capitalized');

    elements.forEach(element => {
        if (element.closest('.fat')) {
            element.classList.add('combined');
        }
    });
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

// HOLY SHIT this is cancer
function parseHTML(text) {
    let base = text.split('<');
    let base2 = [];

    // split in < and > so i dont hit the tags
    base.forEach((str) => {
        str.split(">").forEach((wtf) => {
            base2.push(wtf);
        })
    });

    // adding "capitalized" class to uppercase letters
    base = base2;
    base2 = "";
    for (let i = 2; i < base.length; i += 2) {
        base2 += `<${base[i-1]}>${base[i].replace(/[A-Z]/g, letter => `<span class="capitalized">${letter}</span>`)}`;
    }

    return base2;
}