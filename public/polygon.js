class Polygon {
    /**
     * @type {boolean}
     * @private
     */
    _parity;

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
        this._parity = parity;
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
        this._points.push(point);
    }

    /**
     * @param {Point} point
     */
    addRightPoint(point) {
        this._points2.unshift(point);
    }

    /**
     * @param {Point} point
     */
    prependRightPoint(point) {
        this._points2.push(point);
    }

    /**
     * @param {Point}points
     */
    addTopPointsAndClose(...points) {
        this._points.push(...this._points2);
        this._points.push(...points);
        this._points2 = []
    }

    get isClosed() {
        return this._points.length + this._points2.length >= 3;
    }
}