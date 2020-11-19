/**
 * Arnold's Puzzle
 *
 * @copyright Roman Parpalak 2020
 * @license MIT
 */

// Coefficients for Kutta-Merson method
const beta = [
    [1 / 3, 0, 0, 0, 0],
    [1 / 6, 1 / 6, 0, 0, 0],
    [1 / 8, 0, 3 / 8, 0, 0],
    [1 / 2, 0, -3 / 2, 2, 0]
];
const beta_last = [1 / 6, 0, 0, 2 / 3, 1 / 6];
const beta_error = [1 / 15, 0, -0.3, 4 / 15, -1 / 30];

const m = 1;

class Point {
    // position
    rx = 0.0;
    ry = 0.0;
    stored_rx = 0.0;
    stored_ry = 0.0;

    // velocity
    vx = 0.0;
    vy = 0.0;
    stored_vx = 0.0;
    stored_vy = 0.0;

    // force acting on the point
    fx = 0.0;
    fy = 0.0;

    // derivatives for Runge-Kutta method
    k_rx = [0.0, 0.0, 0.0, 0.0, 0.0];
    k_ry = [0.0, 0.0, 0.0, 0.0, 0.0];
    k_vx = [0.0, 0.0, 0.0, 0.0, 0.0];
    k_vy = [0.0, 0.0, 0.0, 0.0, 0.0];

    /**
     * @type {Line[]}
     * @private
     */
    _lines = [];

    /**
     * @type {Polygon[]}
     * @private
     */
    _polygons = [];

    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.setState(x, y);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setState(x, y) {
        this.rx = x;
        this.ry = y;
        this.stored_rx = x;
        this.stored_ry = y;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    squaredDistanceFrom(x, y) {
        return sqr(x - this.rx) + sqr(y - this.ry);
    }

    /**
     * @param {number} stepIndex
     */
    makeStep(stepIndex) {
        this.rx = this.stored_rx;
        this.ry = this.stored_ry;
        this.vx = this.stored_vx;
        this.vy = this.stored_vy;

        for (let j = 0; j < stepIndex; j++) {
            this.rx += this.k_rx[j] * beta[stepIndex - 1][j];
            this.ry += this.k_ry[j] * beta[stepIndex - 1][j];
            this.vx += this.k_vx[j] * beta[stepIndex - 1][j];
            this.vy += this.k_vy[j] * beta[stepIndex - 1][j];
        }
    }

    /**
     * @param {number} stepIndex
     * @param {number} dt
     */
    storeDerivativeForStep(stepIndex, dt) {
        this.k_rx[stepIndex] = this.vx * dt;
        this.k_ry[stepIndex] = this.vy * dt;

        this.k_vx[stepIndex] = this.fx * dt / m;
        this.k_vy[stepIndex] = this.fy * dt / m;
    }

    /**
     * @returns {number}
     */
    integrationErrorSquared() {
        let e_rx = 0.0;
        let e_ry = 0.0;
        let e_vx = 0.0;
        let e_vy = 0.0;
        for (let step = 0; step < 5; step++) {
            e_rx += this.k_rx[step] * beta_error[step];
            e_ry += this.k_ry[step] * beta_error[step];
            e_vx += this.k_vx[step] * beta_error[step];
            e_vy += this.k_vy[step] * beta_error[step];
        }
        return sqr(e_rx) + sqr(e_ry) + sqr(e_vx) + sqr(e_vy) ;
    }

    /**
     * @returns {number} Kinetic energy
     */
    realMove() {
        for (let step = 0; step < 5; step++) {
            this.stored_rx += this.k_rx[step] * beta_last[step];
            this.stored_ry += this.k_ry[step] * beta_last[step];

            this.stored_vx += this.k_vx[step] * beta_last[step];
            this.stored_vy += this.k_vy[step] * beta_last[step];
        }

        return sqr(this.stored_vx) + sqr(this.stored_vy);
    }

    /**
     * @returns {Line[]}
     */
    get lines() {
        return this._lines;
    }

    /**
     * @param {Line} line
     */
    addLine(line) {
        this._lines.push(line);
    }

    /**
     * @returns {Polygon[]}
     */
    get polygons() {
        return this._polygons;
    }

    /**
     * @param {Polygon} polygon
     */
    addPolygon(polygon) {
        this._polygons.push(polygon);

        return this;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {null|Polygon}
     */
    getPolygonContaining(x, y) {
        for (let i = this._polygons.length; i--;) {
            const polygon = this._polygons[i];
            if (polygon.contains(x, y)) {
                return polygon;
            }
        }

        return null;
    }

    /**
     * @param {Polygon} polygon
     */
    removePolygon(polygon) {
        this._polygons = this._polygons.filter(pl => pl !== polygon);
    }

    /**
     * @param {number} k_spring
     * @param {number} k_friction
     * @returns {number} Potential energy
     */
    setGlobalForces(k_spring, k_friction) {
        this.nearest = infinity;

        this.fx = k_spring * this.rx - k_friction * this.vx;
        this.fy = k_spring * this.ry - k_friction * this.vy;

        return 0.5 * k_spring * (sqr(this.rx) + sqr(this.ry));
    }

    /**
     * @param {number} fx
     * @param {number} fy
     */
    addForce(fx, fy) {
        this.fx += fx;
        this.fy += fy;
    }

    /**
     * @param {number} r
     */
    sawNearestPointAt(r) {
        if (this.nearest > r) {
            this.nearest = r;
        }
    }
}
