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

document.getElementById('plus').addEventListener('click', e => {
    if (n < 33) {
        localStorage.setItem('stored_' + field.lineNum, JSON.stringify(field.getState()));
        localStorage.setItem('current_n', String(field.lineNum));
        n += 2;
        changeLineNumTo(n);
    }
});
document.getElementById('minus').addEventListener('click', e => {
    if (n >= 5) {
        localStorage.setItem('stored_' + field.lineNum, JSON.stringify(field.getState()));
        localStorage.setItem('current_n', String(field.lineNum));
        n -= 2;
        changeLineNumTo(n);
    }
});

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
        renderer.shift(e.offsetX - currentPointerX, e.offsetY - currentPointerY);
        renderer.drawFrame();
        currentPointerX = e.offsetX;
        currentPointerY = e.offsetY;
    } else {
        this.style.cursor = renderer.canClick(e.offsetX, e.offsetY) ? 'pointer' : 'default';
    }
});

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

    if (ongoingTouches.countTouch() === 0 &&  Math.abs(touches[0].clientX - clickX) < 3 && Math.abs(touches[0].clientY - clickY) < 3) {
        setTimeout(() => {
            localStorage.setItem('stored_' + field.lineNum, JSON.stringify(field.getState()));
            localStorage.setItem('current_n', String(field.lineNum));
        }, 1000);
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


window.addEventListener('resize', resizeHandler);
document.addEventListener('readystatechange', resizeHandler);

document.getElementById('copyright-sign').addEventListener('click', (e) => {
    if (e.ctrlKey) {
        displayDebugInfo();
        renderer.markAsDebug();
    }
});

renderer.toggleRun();

document.getElementById('help').addEventListener('click', function () {
    document.body.classList.toggle('shown-help');
});
