/**
 * Arnold's Puzzle
 *
 * @copyright Roman Parpalak 2020
 */

class Polygon {
    /**
     * @type {boolean}
     * @private
     */
    _parity;

    /**
     * @type {boolean}
     * @private
     */
    _external = false;

    /**
     * @type {Point[]}
     * @private
     */
    _points = [];

    /**
     * @type {Point[]}
     * @private
     */
    _points2 = [];

    constructor(parity) {
        this._parity = Boolean(parity);
    }

    markAsExternal() {
        this._external = true;

        return this;
    }

    get external() {
        return this._external;
    }

    get parity() {
        return this._parity;
    }

    get points() {
        return this._points;
    }

    /**
     * @param {Point} point
     */
    addLeftPoint(point) {
        point.addPolygon(this);
        this._points.push(point);
    }

    /**
     * @param {Point} point
     */
    addRightPoint(point) {
        point.addPolygon(this);
        this._points2.unshift(point);
    }

    /**
     * @param {Point} point
     */
    prependRightPoint(point) {
        point.addPolygon(this);
        this._points2.push(point);
    }

    /**
     * @param {Point}points
     */
    addTopPointsAndClose(...points) {
        points.forEach(point => point.addPolygon(this));
        this._points.push(...this._points2);
        this._points.push(...points);
        this._points2 = []

        return this;
    }

    getCount() {
        return this._points.length;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    contains(x, y) {
        let s = 0;
        const n = this._points.length;
        for (let i = n; i--;) {
            /** @type {Point} */
            const pt1 = this._points[i];
            /** @type {Point} */
            const pt2 = this._points[(i + 1) % n];
            s += signVectorProd(pt1.rx, pt1.ry, pt2.rx, pt2.ry, x, y);
        }

        return s === n || s === -n;
    }

    /**
     * @param {Point} changePoints
     */
    substitutePoints(...changePoints) {
        if (changePoints.length !== 3) {
            throw 'One may substitute only 3 points.'
        }

        let foundPointIdx = {};

        this._points.forEach((point, i) => {
            for (let j = changePoints.length; j--;) {
                if (point === changePoints[j]) {
                    foundPointIdx[i] = j;
                }
            }
        });

        const originalIndexes = Object.keys(foundPointIdx);
        if (originalIndexes.length === 1) {
            // Change 1 original point to 2 new ones.
            const origIndex = Number(originalIndexes[0]);
            const prevPoint = changePoints[(foundPointIdx[origIndex] + 2) % 3];
            const nextPoint = changePoints[(foundPointIdx[origIndex] + 1) % 3];

            this._points = this._points.slice(0, origIndex).concat(
                [prevPoint, nextPoint],
                this._points.slice(origIndex + 1)
            );

            prevPoint.addPolygon(this);
            changePoints[foundPointIdx[origIndex]].removePolygon(this);
            nextPoint.addPolygon(this);

        } else if (originalIndexes.length === 2) {
            // Change 2 original points to 1 new one.
            const origIndex1 = Number(originalIndexes[0]);
            const origIndex2 = Number(originalIndexes[1]);

            let newPoint;
            if ((foundPointIdx[origIndex1] + 1) % 3 !== foundPointIdx[origIndex2]) {
                newPoint = changePoints[(foundPointIdx[origIndex1] + 1) % 3];
            } else {
                newPoint = changePoints[(foundPointIdx[origIndex1] + 2) % 3];
            }

            if (origIndex1 === 0 && origIndex2 === this._points.length - 1
                || origIndex1 === this._points.length - 1 && origIndex2 === 0) {

                this._points = this._points.slice(1, this._points.length - 1).concat([newPoint]);

            } else if (Math.abs(origIndex1 - origIndex2) === 1) {

                this._points = this._points.slice(0, Math.min(origIndex1, origIndex2)).concat(
                    [newPoint],
                    this._points.slice(Math.max(origIndex1, origIndex2) + 1)
                );

            } else {
                throw 'One may substitute a pair of near points only.';
            }

            newPoint.addPolygon(this);
            changePoints[foundPointIdx[origIndex1]].removePolygon(this);
            changePoints[foundPointIdx[origIndex2]].removePolygon(this);
        } else {
            throw 'One may substitute a pair of near points or a point only.';
        }
    }

    isClickable() {
        return this._points.length === 3 && !this._external;
    }

    flip() {
        if (this._external) {
            // One cannot flip an external triangle.
            return;
        }

        if (this._points.length !== 3) {
            throw 'Only triangles can be flipped.';
        }

        /**
         * @type {Set<Line>}
         */
        const nearLines = new Set;

        /**
         * @type {Set<Polygon>}
         */
        const nearPolygons = new Set;

        this._points.forEach(point => {
            const pointLines = point.lines;
            nearLines
                .add(pointLines[0])
                .add(pointLines[1])
            ;

            point.polygons.forEach(nearPolygon => {
                nearPolygons.add(nearPolygon);
            });
        });

        nearLines.forEach(line => {
            line.flip(...this._points);
        });

        nearPolygons.delete(this);

        nearPolygons.forEach(nearPolygon => {
            nearPolygon.substitutePoints(...this._points);
        });

        // Invert colors and direction
        this._parity = !this._parity;
//        this._points = this._points.reverse();
    }

    getCenter() {
        const n = this._points.length;
        const x = (1.0 / n) * this._points.reduce((partial_sum, pt) => partial_sum + pt.stored_rx, 0.0);
        const y = (1.0 / n) * this._points.reduce((partial_sum, pt) => partial_sum + pt.stored_ry, 0.0);

        return {x, y};
    }

    resize(progress, center) {
        const {x, y} = center;
        this._points.forEach(point => {
            // point.stored_vx = point.vx = 0.1*(x - point.stored_rx);
            // point.stored_vy = point.vy = 0.1*(y - point.stored_ry);
            point.rx = point.stored_rx * (1 - progress) + x * progress;
            point.ry = point.stored_ry * (1 - progress) + y * progress;
        });
        //
        //
        // this._points.forEach(point => {
        //     point.stored_rx = point.rx = -point.stored_rx + x * 2;
        //     point.stored_ry = point.ry = -point.stored_ry + y * 2;
        // });
    }

    resetResize(progress) {
        this._points.forEach(point => {
            point.stored_rx = point.rx;// = point.stored_rx * (1 - progress) + x * progress;
            point.stored_ry = point.ry;// = point.stored_ry * (1 - progress) + y * progress;
        });
    }

}
