class Renderer {
    eCanvas;
    /**
     * @type {Field}
     * @private
     */
    _field;
    _zoom = 50;
    _canvasX = 0;
    _canvasY = 0;
    _fps = 0;

    constructor(eCanvas, field) {
        this.eCanvas = eCanvas;
        this._field = field;
    }

    /**
     * @param {number} canvasX
     * @param {number} canvasY
     */
    shift(canvasX, canvasY) {
        this._canvasX += canvasX;
        this._canvasY += canvasY;
    }

    _isRunning = false;

    processFrame() {
        this._field.calculateStep();
        this._field.calculateStep();
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
        const canvasWidth = this.eCanvas.width;
        const canvasHeight = this.eCanvas.height;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();

        /**
         * Canvas methods for direct transform from system to screen coordinates
         */
        ctx.translate(canvasWidth / 2 + this._canvasX, canvasHeight / 2 + this._canvasY);
        ctx.scale(this._zoom, -this._zoom); // Scale and change the y-axis direction to a Cartesian kind
        ctx.lineWidth = 1 / this._zoom;

        /**
         * Draw force vectors
         */
        // ctx.strokeStyle = '#f55';
        // const allPoints = this._field.points;
        // for (let i = 0; i < allPoints.length; i++) {
        //     const pt = allPoints[i];
        //     ctx.beginPath();
        //     ctx.moveTo(pt.rx, pt.ry);
        //     ctx.lineTo(pt.rx + pt.fx, pt.ry + pt.fy);
        //     ctx.stroke();
        // }

        const polygons = this._field.polygons;
        for (let i = polygons.length; i--; ) {
            const polygon = polygons[i];
            // if (polygon.parity) {
            //     continue;
            // }

            const polygonPoints = polygon.points;
            const pt = polygonPoints[polygonPoints.length - 1];

            ctx.fillStyle = polygon.color || (polygon.color = getRandomColor());
            ctx.strokeStyle = polygon.color || (polygon.color = getRandomColor());

            ctx.beginPath();
            ctx.moveTo(pt.rx, pt.ry);
            for (let j = polygonPoints.length - 1; j--;) {
                const pt = polygonPoints[j];

                ctx.lineTo(pt.rx, pt.ry);
            }
            ctx.closePath();
            // ctx.stroke();
            ctx.fill();

        }

        /**
         * Draw lines
         */
        // const lines = this._field.lines;
        // for (let i = lines.length; i--;) {
        //     const line = lines[i];
        //     const linePoints = line.points;
        //     const pt = linePoints[linePoints.length - 1];
        //
        //     ctx.strokeStyle = line.color;
        //
        //     ctx.beginPath();
        //     ctx.moveTo(pt.rx, pt.ry);
        //     for (let j = linePoints.length - 1; j--;) {
        //         const pt = linePoints[j];
        //
        //         ctx.lineTo(pt.rx, pt.ry);
        //     }
        //     ctx.stroke();
        // }

        ctx.restore();
    }

    /**
     * @param {number} zoomDirection +1 or -1 to zoom in or out
     */
    changeZoom(zoomDirection) {
        this._zoom *= Math.exp(zoomDirection * 0.2);
    }

    /**
     * @param {number} canvasX
     * @param {number} canvasY
     */
    doClick(canvasX, canvasY) {
        // Reverse transform from screen to system coordinates
        const x = (canvasX - this.eCanvas.width * 0.5 - this._canvasX) / this._zoom;
        const y = - (canvasY - this.eCanvas.height * 0.5 - this._canvasY) / this._zoom;

        this._field.flipTriangle(x, y);
    }
}
