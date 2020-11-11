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

        let oldX = 0.0, oldY = 0.0, newX = 0.0, newY = 0.0;

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
                newX += newTouch.clientX;
                newY += newTouch.clientY;

                oldX += oldTouch.clientX;
                oldY += oldTouch.clientY;

                oldTouch.clientX = newTouch.clientX;
                oldTouch.clientY = newTouch.clientY;
            }
        });

        const newSquaredDistance = this._touches.length >= 2 ? (
            sqr(this._touches[1].clientX - this._touches[0].clientX)
            + sqr(this._touches[1].clientY - this._touches[0].clientY)
        ) : 1.0;

        const kZoom = Math.sqrt(newSquaredDistance/oldSquaredDistance);

        oldX /= this._touches.length;
        oldY /= this._touches.length;

        newX /= this._touches.length;
        newY /= this._touches.length;

        return {oldX, oldY, newX, newY, kZoom};
    }

    countTouch() {
        return this._touches.length;
    }
}
