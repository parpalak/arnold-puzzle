/**
 * Arnold's Puzzle
 *
 * @copyright Roman Parpalak 2020
 * @license MIT
 */

class OngoingTouches {

    _touches = [];
    _width = 0;
    _height = 0;

    setLimits(width, height) {
        this._width = width;
        this._height = height;
    }

    addTouch(touch) {
        if (this._touches.length < 2) {
            this._touches.push(this.copyTouch(touch));
        }
    }

    removeTouch(touch) {
        const idx = this.ongoingTouchIndexById(touch.identifier);
        if (idx >= 0) {
            this._touches.splice(idx, 1);
        }
    }

    clearTouches() {
        this._touches = [];
    }

    copyTouch({identifier, clientX, clientY}) {
        return {identifier, clientX, clientY};
    }

    ongoingTouchIndexById(idToFind) {
        for (let i = 0; i < this._touches.length; i++) {
            if (this._touches[i].identifier === idToFind) {
                return i;
            }
        }

        return -1;
    }

    applyTouches(touches) {
        const oldSquaredDistance = this._touches.length >= 2 ? (
            sqr(this._touches[1].clientX - this._touches[0].clientX)
            + sqr(this._touches[1].clientY - this._touches[0].clientY)
        ) : 1.0;

        let oldX = 0.0, oldY = 0.0, newX = 0.0, newY = 0.0, count = 0;

        this._touches.forEach((oldTouch, i) => {
            let newTouch = null;

            for (let j = 0; j < touches.length; j++) {
                if (oldTouch.identifier === touches[j].identifier) {
                    newTouch = touches[j];
                    break;
                }
            }

            if (newTouch === null) {
                // TODO maybe one should clear missing touches.
            } else {
                // Some browsers (e.g. Chrome on Linux) returns insane coords like 21735
                // when move fingers upward out of the browser. That's why we check boundary conditions.
                const x = newTouch.clientX >= 0 && newTouch.clientX <= this._width ? newTouch.clientX : oldTouch.clientX;
                const y = newTouch.clientY >= 0 && newTouch.clientY <= this._height ? newTouch.clientY : oldTouch.clientY;

                newX += x;
                newY += y;

                oldX += oldTouch.clientX;
                oldY += oldTouch.clientY;

                oldTouch.clientX = x
                oldTouch.clientY = y;

                count++;
            }
        });

        const newSquaredDistance = this._touches.length >= 2 ? (
            sqr(this._touches[1].clientX - this._touches[0].clientX)
            + sqr(this._touches[1].clientY - this._touches[0].clientY)
        ) : 1.0;

        const kZoom = Math.sqrt(newSquaredDistance/oldSquaredDistance);

        if (count === 0) {
            count = 1; // If there are no touches, return equal points.
        }

        oldX /= count;
        oldY /= count;

        newX /= count;
        newY /= count;

        return {oldX, oldY, newX, newY, kZoom};
    }

    countTouch() {
        return this._touches.length;
    }
}
