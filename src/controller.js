function recalcScore(score) {
    document.getElementById('score').innerHTML = score || field.darkPolygonNum();
}

function changeLineNumTo(n) {
    const storedState = localStorage.getItem('stored_' + n);
    if (storedState) {
        field.setState(JSON.parse(storedState));
    } else {
        const generators = [];
        for (let i = 0; i < n; i++) {
            for (let j = i; j--;) {
                generators.push(j);
            }
        }
        field.parseGenerators(generators);
    }

    document.getElementById('line-num').innerHTML = String(n);
    document.getElementById('goal').innerHTML = String(field.darkPolygonNumLimit());
    renderer.drawFrame();
    recalcScore();
}

function displayDebugInfo() {
    const eInfo = document.getElementById('info');
    if (eInfo) {
        eInfo.innerHTML = [
            'E: ' + (field.w_pot + field.w_kin * 0.5).toFixed(6)
            , 'W: ' + field.w_pot.toFixed(6)
            , 'K: ' + (field.w_kin * 0.5).toFixed(6)
            , 'fps: ' + renderer.fps
//            , 'itns: ' + field.iterations
        ].map(val => '<span class="parameter">' + val + '</span>').join(' ');

        setTimeout(displayDebugInfo, 1000);
    }
}

function resizeHandler() {
    eCanvas.width = eCanvas.offsetWidth;
    eCanvas.height = eCanvas.offsetHeight;
    renderer.drawFrame();
}

const eCanvas = document.getElementById('canvas');
const field = new Field();
const renderer = new Renderer(eCanvas, field, recalcScore);

let n = Number(localStorage.getItem('current_n') || 9);
changeLineNumTo(n);

document.getElementById('plus').addEventListener('click', (e) => {
    if (n < 33) {
        localStorage.setItem('stored_' + field.lineNum, JSON.stringify(field.getState()));
        localStorage.setItem('current_n', String(field.lineNum));
        n += 2;
        changeLineNumTo(n);
    }
});
document.getElementById('minus').addEventListener('click', (e) => {
    if (n >= 5) {
        localStorage.setItem('stored_' + field.lineNum, JSON.stringify(field.getState()));
        localStorage.setItem('current_n', String(field.lineNum));
        n -= 2;
        changeLineNumTo(n);
    }
});

eCanvas.addEventListener('wheel', function (e) {
    let delta = e.deltaY || e.detail;

    if (!e.ctrlKey) {
        renderer.changeZoom(delta < 0 ? 1 : -1);
        renderer.drawFrame();
    }
});

let mousePressed = false, x, y, clickX, clickY;
eCanvas.addEventListener('mousedown', function (e) {
    mousePressed = true;
    clickX = x = e.offsetX;
    clickY = y = e.offsetY;
});
eCanvas.addEventListener('mouseup', function (e) {
    mousePressed = false;
    if (e.button === 0 && Math.abs(e.offsetX - clickX) < 3 && Math.abs(e.offsetY - clickY) < 3) {
        setTimeout(() => {
            localStorage.setItem('stored_' + field.lineNum, JSON.stringify(field.getState()));
            localStorage.setItem('current_n', String(field.lineNum));
        }, 1000);
        renderer.doClick(e.offsetX, e.offsetY);
    }
});
eCanvas.addEventListener('mousemove', function (e) {
    if (mousePressed) {
        if (e.buttons % 2 === 0) {
            mousePressed = false;
            return;
        }
        renderer.shift(e.offsetX - x, e.offsetY - y);
        renderer.drawFrame();
        x = e.offsetX;
        y = e.offsetY;
    } else {
        this.style.cursor = renderer.canClick(e.offsetX, e.offsetY) ? 'pointer' : 'default';
    }
});

window.addEventListener('resize', resizeHandler);
document.addEventListener('readystatechange', resizeHandler);

document.getElementById('copyright-sign').addEventListener('click', (e) => {
    if (e.ctrlKey) {
        displayDebugInfo();
        renderer.markAsDebug();
    }
});

renderer.toggleRun();
