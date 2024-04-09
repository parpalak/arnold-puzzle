/**
 * Arnold's Puzzle
 *
 * @copyright Roman Parpalak 2020
 * @license MIT
 */

window.requestAnimationFrame = window.requestAnimationFrame       ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame    ||
window.oRequestAnimationFrame      ||
window.msRequestAnimationFrame     ||
function(callback){
    window.setTimeout(callback, 1000 / 60);
};

//
// Initialize model and view
//
const eCanvas = document.getElementById('canvas');
const field = new Field();
const renderer = new Renderer(
    eCanvas,
    field,
    recalcScore,
    function (callback) {
        window.requestAnimationFrame(callback);
    }
);

//
// Score, win screen
//
function recalcScore(score, showWinMessage) {
    document.getElementById('score').innerHTML = wrapNum(score || field.darkPolygonNum());
    if (showWinMessage) {
        document.getElementById('win-next-lines-num').innerHTML = String(n + 2);
        document.getElementById('win').style.display = 'block';
        setTimeout(() => document.getElementById('win').classList.add('enabled'), 0);
    }
}

function closeWinScreen() {
    document.getElementById('win').classList.remove('enabled');
    setTimeout(() => document.getElementById('win').style.display = 'none', 200);
}

document.getElementById('win-next-level').addEventListener('click', () => {
    n = Number(document.getElementById('win-next-lines-num').innerHTML);
    changeLineNumTo(n);
    closeWinScreen();
});
document.getElementById('win-ok').addEventListener('click', closeWinScreen);

//
// Line number control, localstorage
//
let n = Number(localStorage.getItem('current_n') || 5);
changeLineNumTo(n);

function storeState() {
    localStorage.setItem('stored_' + field.lineNum, JSON.stringify(renderer.getState()));
    localStorage.setItem('current_n', String(field.lineNum));
}

document.getElementById('plus').addEventListener('click', e => {
    if (n < 33) {
        storeState();
        n += 2;
        changeLineNumTo(n);
    }
});
document.getElementById('minus').addEventListener('click', e => {
    if (n >= 5) {
        storeState();
        n -= 2;
        changeLineNumTo(n);
    }
});

function changeLineNumTo(n) {
    const storedState = localStorage.getItem('stored_' + n);
    if (storedState) {
        let parsedState = JSON.parse(storedState);
        if (Array.isArray(parsedState)) {
            // TODO remove soon
            parsedState = {
                field: {
                    points: parsedState,
                }
            }
        }
        renderer.setState(parsedState);
    } else {
        const generators = [];
        for (let i = 0; i < n; i++) {
            for (let j = i; j--;) {
                generators.push(j);
            }
        }
        field.parseGenerators(generators);
    }

    document.getElementById('line-num').innerHTML = wrapNum(n);
    document.getElementById('goal').innerHTML = wrapNum(field.darkPolygonNumLimit);
    renderer.preventFreeze();
    renderer.drawFrame();
    recalcScore();

    localStorage.setItem('current_n', String(field.lineNum));
}

//
// Mouse events
//
eCanvas.addEventListener('wheel', e => {
    let delta = e.deltaY || e.detail;

    if (!e.ctrlKey) {
        const zoomDirection = delta < 0 ? 1 : -1;
        renderer.changeZoom(Math.exp(zoomDirection * 0.2), e.offsetX, e.offsetY, e.offsetX, e.offsetY);
        renderer.drawFrame();
    }
});

let mousePressed = false, currentPointerX, currentPointerY, clickX, clickY;
eCanvas.addEventListener('mousedown', e => {
    mousePressed = true;
    clickX = currentPointerX = e.offsetX;
    clickY = currentPointerY = e.offsetY;
});
eCanvas.addEventListener('mouseup', e => {
    mousePressed = false;
    if (e.button === 0 && Math.abs(e.offsetX - clickX) < 3 && Math.abs(e.offsetY - clickY) < 3) {
        setTimeout(storeState, 1000);
        renderer.doClick(e.offsetX, e.offsetY);
    }
});
eCanvas.addEventListener('mousemove', function (e) {
    if (mousePressed) {
        if (e.buttons % 2 === 0) {
            mousePressed = false;
            return;
        }
        renderer.shift(e.offsetX - currentPointerX, e.offsetY - currentPointerY);
        renderer.drawFrame();
        currentPointerX = e.offsetX;
        currentPointerY = e.offsetY;
    } else {
        this.style.cursor = renderer.canClick(e.offsetX, e.offsetY) ? 'pointer' : 'default';
    }
});

//
// Touch events
//

const ongoingTouches = new OngoingTouches();

eCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touches = e.changedTouches;

    if (ongoingTouches.countTouch() === 0) {
        clickX = touches[0].clientX;
        clickY = touches[0].clientY;
    }

    for (let i = 0; i < touches.length; i++) {
        ongoingTouches.addTouch(touches[i]);
    }
});
eCanvas.addEventListener('touchend', e => {
    e.preventDefault();
    const touches = e.changedTouches;

    if (e.touches.length === 0) {
        ongoingTouches.clearTouches();
    } else {
        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.removeTouch(touches[i]);
        }
    }

    if (ongoingTouches.countTouch() === 0 && Math.abs(touches[0].clientX - clickX) < 3 && Math.abs(touches[0].clientY - clickY) < 3) {
        setTimeout(storeState, 1000);
        renderer.doClick(touches[0].clientX, touches[0].clientY);
    }

}, false);
eCanvas.addEventListener('touchcancel', e => {
    e.preventDefault();
    const touches = e.changedTouches;

    if (e.touches.length === 0) {
        ongoingTouches.clearTouches();
    } else {
        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.removeTouch(touches[i]);
        }
    }
}, false);
eCanvas.addEventListener('touchmove', e => {
    e.preventDefault();

    const {oldX, oldY, newX, newY, kZoom} = ongoingTouches.applyTouches(e.touches);

    renderer.changeZoom(kZoom, oldX, oldY, newX, newY);
    renderer.drawFrame();
}, false);

//
// Window resizing
//
function resizeHandler() {
    const x = eCanvas.width = eCanvas.offsetWidth;
    const y = eCanvas.height = eCanvas.offsetHeight;
    renderer.drawFrame();

    ongoingTouches.setLimits(x, y);
}

window.addEventListener('resize', resizeHandler);
document.addEventListener('readystatechange', resizeHandler);

//
// Easter egg
//
document.getElementById('copyright-sign').addEventListener('click', (e) => {
    if (e.ctrlKey) {
        displayDebugInfo();
        renderer.markAsDebug();
    }
});

function displayDebugInfo() {
    const eInfo = document.getElementById('info');
    if (eInfo) {
        eInfo.innerHTML = [
            'E: ' + (field.w_pot + field.w_kin * 0.5).toFixed(6)
            , 'W: ' + field.w_pot.toFixed(6)
            , 'K: ' + (field.w_kin * 0.5).toFixed(6)
            , 'fps: ' + renderer.fps
            , 'dt: ' + field.current_dt.toFixed(6)
//            , 'itns: ' + field.iterations
        ].map(val => '<span class="parameter">' + val + '</span>').join(' ');

        setTimeout(displayDebugInfo, 1000);
    }
}

//
// Help control
//
document.getElementById('help').addEventListener('click', () => {
    document.body.classList.toggle('shown-help');
});

document.addEventListener('keydown', e => {
    if ('key' in e ? (e.key === 'Escape' || e.key === 'Esc') : (e.keyCode === 27)) {
        const classList = document.body.classList;
        if (classList.contains('shown-help')) {
            classList.remove('shown-help');
        }
    }
});

//
// Start
//
renderer.toggleRun();
