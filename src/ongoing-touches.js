class OngoingTouches {

    _touches = [];

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

        let dx = 0, dy = 0;

        this._touches.forEach((currentTouch, i) => {
            let newTouch = null;

            for (let j = 0; j < touches.length; j++) {
                if (currentTouch.identifier === touches[j].identifier) {
                    newTouch = touches[j];
                    break;
                }
            }

            if (newTouch === null) {
                // TODO maybe one should clear missing touches.
            } else {
                dx += newTouch.clientX - currentTouch.clientX;
                dy += newTouch.clientY - currentTouch.clientY;

                currentTouch.clientX = newTouch.clientX;
                currentTouch.clientY = newTouch.clientY;
            }
        });

        const newSquaredDistance = this._touches.length >= 2 ? (
            sqr(this._touches[1].clientX - this._touches[0].clientX)
            + sqr(this._touches[1].clientY - this._touches[0].clientY)
        ) : 1.0;

        return {dx, dy, k_zoom: Math.sqrt(newSquaredDistance/oldSquaredDistance)};
    }

    countTouch() {
        return this._touches.length;
    }
}
