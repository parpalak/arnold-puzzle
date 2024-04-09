/**
 * Arnold's Puzzle
 *
 * @copyright Roman Parpalak 2020
 * @license MIT
 */

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
    _isDebug = false;

    /**
     * @param eCanvas
     * @param {Field} field
     * @param scoreCallback
     * @param requestAnimationFrame
     */
    constructor(eCanvas, field, scoreCallback, requestAnimationFrame) {
        this.eCanvas = eCanvas;
        this._field = field;
        this._scoreCallback = scoreCallback;
        this._requestAnimationFrame = requestAnimationFrame;
    }

    markAsDebug() {
        this._isDebug = true;
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

    _skippedFrame = 120;
    _flippingPolygon = null;

    processFrame() {
        if (this._flippingPolygon !== null) {
            // Animation for flipping triangle
            const finalProgress = 1.7;
            const frameNum = 8;

            this._flippingPolygon.i++;
            if (this._flippingPolygon.i <= frameNum / finalProgress && this._flippingPolygon.i + 1 > frameNum / finalProgress) {
                // Triangle is collapsed
                this._flippingPolygon.polygon.flip();
                this._scoreCallback(this._field.darkPolygonNum(), this._field.shouldCongratulate());
                // Loop Iteration
                this._flippingPolygon.polygon.resize(finalProgress * this._flippingPolygon.i / frameNum, this._flippingPolygon.center);
            }
            if (this._flippingPolygon.i >= frameNum) {
                // End of loop
                this._flippingPolygon.polygon.resetResize(finalProgress);
                this._flippingPolygon = null;

                this.preventFreeze();
                this._field.moderateFloatStep()
            } else {
                // Loop Iteration
                this._flippingPolygon.polygon.resize(finalProgress * this._flippingPolygon.i / frameNum, this._flippingPolygon.center);
            }
            this.drawFrame();

        } else if (this._field.w_kin > 0.001 || this._skippedFrame++ > 60) {
            // Physics animation.
            // Slow down speed when kinetic energy is low and the configuration is almost stopped.
            this._skippedFrame = 0;
            this._field.calculateStep();
            this._field.calculateStep();
            this.drawFrame();
            this._fps++;
        }

        if (this._isRunning || this._flippingPolygon !== null) {
            this._requestAnimationFrame(() => {
                this.processFrame();
            });
        }
    };

    preventFreeze() {
        this._skippedFrame = 120;
    }

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

        ctx.globalAlpha = 0.8;

        /**
         * Canvas methods for direct transform from system to screen coordinates.
         * @see changeZoom for the same transform in equations.
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
        for (let i = polygons.length; i--;) {
            const polygon = polygons[i];
            if (!this._isDebug && !polygon.parity && polygon.getCount() >= 4) {
                continue;
            }

            const polygonPoints = polygon.points;
            const pt = polygonPoints[polygonPoints.length - 1];

            if (polygon.parity) {
                ctx.fillStyle = polygon.getCount() === 3 ? '#001a3b' : '#15003b';
            } else {
                switch (polygon.getCount()) {
                    case 3:
                        ctx.fillStyle = '#aed099';
                        break;
                    case 4:
                        ctx.fillStyle = '#c1824b';
                        break;
                    case 5:
                        ctx.fillStyle = '#458a69';
                        break;
                    case 7:
                        ctx.fillStyle = '#ce89d6';
                        break;
                    case 8:
                        ctx.fillStyle = '#4044cd';
                        break;
                    default:
                        continue;
                }
            }

            ctx.beginPath();
            ctx.moveTo(pt.rx, pt.ry);
            for (let j = polygonPoints.length - 1; j--;) {
                const pt = polygonPoints[j];

                ctx.lineTo(pt.rx, pt.ry);
            }
            ctx.closePath();
            ctx.fill();
        }

        /**
         * Draw lines
         */
        // ctx.fillStyle = '#000';
        // ctx.font = "1px serif";
        // const lines = this._field.lines;
        // for (let i = lines.length; i--;) {
        //     const line = lines[i];
        //     const linePoints = line.points;
        //     const pt = linePoints[linePoints.length - 1];
        //
        //     ctx.strokeStyle = line.color;
        //     ctx.fillStyle = line.color;
        //
        //     ctx.beginPath();
        //     ctx.moveTo(pt.rx, pt.ry);
        //     for (let j = linePoints.length - 1; j--;) {
        //         const pt = linePoints[j];
        //
        //         ctx.lineTo(pt.rx, pt.ry);
        //         // if (i=== 1)
        //         //     ctx.fillText(j, pt.rx, pt.ry - 0.5);
        //         // if (i=== 3)
        //         //     ctx.fillText(j, pt.rx, pt.ry+ 1);
        //         // if (i=== 2)
        //             ctx.fillText(j, pt.rx, pt.ry + i *0.5);
        //     }
        //     ctx.stroke();
        // }

        ctx.restore();
    }

    /**
     * @param {number} kZoom
     * @param {number} cnvX1 - old screen coords of a point
     * @param {number} cnvY1
     * @param {number} cnvX2 - new screen coords of that point
     * @param {number} cnvY2
     */
    changeZoom(kZoom, cnvX1, cnvY1, cnvX2, cnvY2) {
        const minZoom = 1.0;

        // Maintain minimal zoom
        kZoom = Math.max(kZoom, minZoom/this._zoom);

        const newZoom = kZoom * this._zoom;

        /**
         * Direct transform of coordinates.
         * @see drawFrame for the same transform in terms of canvas zoom and translate.
         */
        this._canvasX = cnvX2 - 0.5 * this.eCanvas.width - newZoom * this.getSystemXFromCanvas(cnvX1);
        this._canvasY = cnvY2 - 0.5 * this.eCanvas.height + newZoom * this.getSystemYFromCanvas(cnvY1);

        this._zoom = newZoom;
    }

    /**
     * @param {number} canvasX
     * @param {number} canvasY
     */
    doClick(canvasX, canvasY) {
        // Reverse transform from screen to system coordinates
        const x = this.getSystemXFromCanvas(canvasX);
        const y = this.getSystemYFromCanvas(canvasY);

        const polygon = this._field.findTriangleToFlip(x, y);
        if (polygon !== null) {
            this._flippingPolygon = {
                center: polygon.getCenter(),
                polygon,
                i: 0,
            }
        }
    }

    /**
     * @param {number} canvasX
     * @param {number} canvasY
     */
    canClick(canvasX, canvasY) {
        // Reverse transform from screen to system coordinates
        const x = this.getSystemXFromCanvas(canvasX);
        const y = this.getSystemYFromCanvas(canvasY);

        return this._field.findTriangleToFlip(x, y) !== null;
    }

    /**
     * @param {number} canvasX
     * @returns {number}
     */
    getSystemXFromCanvas(canvasX) {
        return (canvasX - this.eCanvas.width * 0.5 - this._canvasX) / this._zoom;
    }

    /**
     * @param {number} canvasY
     * @returns {number}
     */
    getSystemYFromCanvas(canvasY) {
        return -(canvasY - this.eCanvas.height * 0.5 - this._canvasY) / this._zoom;
    }

    getState() {
        return {
            field: this._field.getState(),
            canvasX: this._canvasX,
            canvasY: this._canvasY,
            zoom: this._zoom,
        }
    }

    setState(state) {
        this._canvasX = state.canvasX || this._canvasX;
        this._canvasY = state.canvasY || this._canvasY;
        this._zoom = state.zoom || this._zoom;
        this._field.setState(state.field);
    }
}
