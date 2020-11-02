class Renderer {
    eCanvas;
    /**
     * @type {Field}
     * @private
     */
    _field;
    _zoom = 50;
    _x = 0;
    _y = 0;
    _fps = 0;

    constructor(eCanvas, field) {
        this.eCanvas = eCanvas;
        this._field = field;
    }

    shift(x, y) {
        this._x += x;
        this._y += y;
    }

    _isRunning = false;

    processFrame() {
        this._field.calculateStep();
        // this._field.calculateStep();
        // console.log(this._field.w_pot + this._field.w_kin * 0.5, this._field.w_pot, this._field.w_kin * 0.5);
        this.drawFrame();
        this._fps++;
        if (this._isRunning) {
            window.requestAnimationFrame(() => {
                this.processFrame();
            });
        }
    };

    get fps() {
        const fps = this._fps;

        this._fps = 0;
        return fps;
    }

    toggleRun() {
        if (this._isRunning) {
            this._isRunning = false;
            return;
        }

        this._isRunning = true;
        this.processFrame();
    }

    drawFrame() {
        const ctx = this.eCanvas.getContext('2d');
        const width = this.eCanvas.width;
        const height = this.eCanvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.save();

        ctx.translate(width / 2 + this._x, height / 2 + this._y);

        ctx.lineWidth = 1 / this._zoom;
        ctx.scale(this._zoom, -this._zoom);


        // Draw force vectors
        ctx.strokeStyle = '#f55';
        const allPoints = this._field.points;
        for (let i = 0; i < allPoints.length; i++) {
            const pt = allPoints[i];
            ctx.beginPath();
            ctx.moveTo(pt.rx, pt.ry);
            ctx.lineTo(pt.rx + pt.fx, pt.ry + pt.fy);
            ctx.stroke();
        }

        // Draw lines
        const lines = this._field.lines;
        for (let i = lines.length; i--;) {
            const line = lines[i];
            const linePoints = line.points;
            const pt = linePoints[linePoints.length - 1];

            ctx.strokeStyle = line.color;

            ctx.beginPath();
            ctx.moveTo(pt.rx, pt.ry);
            for (let j = linePoints.length - 1; j--;) {
                const pt = linePoints[j];

                ctx.lineTo(pt.rx, pt.ry);
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    changeZoom(number) {
        this._zoom *= Math.exp(number / 5);
        console.log('zoom', this._zoom);
    }
}
