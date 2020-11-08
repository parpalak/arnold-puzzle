class Line {
    /**
     * @type {Point[]}
     */
    _points = [];

    /**
     * @type {string}
     * @private
     */
    _color;

    constructor(color) {
        this._color = color;
    }

    get points() {
        return this._points;
    }

    /**
     * @param {number} index
     * @returns {Point|null}
     */
    getInternalPoint(index) {
        return index > 0 && index < this._points.length - 1 ? this._points[index] : null;
    }

    get color() {
        return this._color;
    }

    addPoint(point) {
        this._points.push(point);
        point.addLine(this);
    }

    prependPoint(point) {
        this._points.unshift(point);
        point.addLine(this);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    getClosestPoint(x, y) {
        let nearestDistance2 = sqr(infinity);

        /** @type {Point} */
        let nearestPoint = null;
        for (let i = this._points.length; i--;) {
            const pt = this._points[i];
            const distance2 = pt.squaredDistanceFrom(x, y);
            if (distance2 < nearestDistance2) {
                nearestDistance2 = distance2;
                nearestPoint = pt;
            }
        }

        return nearestPoint;
    }

    flip(...points) {
        const ptSet = new Set(points);
        let idx1;

        for (let i = this._points.length; i--;) {
            const point = this._points[i];
            if (ptSet.has(point)) {
                if (!idx1) {
                    idx1 = i;
                } else {
                    this._points[i] = this._points[idx1];
                    this._points[idx1] = point;
                    break;
                }
            }
        }
    }

    /**
     * @param {number} k_elastic
     * @returns {number}
     */
    addElasticForce(k_elastic) {
        let w = 0;
        for (let i = this._points.length - 2; i > 0; i--) {
            w += add_elastic_force(this._points[i - 1], this._points[i], this._points[i + 1], k_elastic);
        }

        return w;
    }

    /**
     * @param {number} q2
     * @returns {number}
     */
    addElectricForce(q2) {
        let w = 0;
        for (let i = this._points.length - 2; i > 1; i--) {
            w += add_electric_force(this._points[i - 1], this._points[i], q2);
        }

        return w;
    }
}
