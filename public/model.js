const beta = [
    [1 / 3, 0, 0, 0, 0],
    [1 / 6, 1 / 6, 0, 0, 0],
    [1 / 8, 0, 3 / 8, 0, 0],
    [1 / 2, 0, -3 / 2, 2, 0]
];
const beta_last = [1 / 6, 0, 0, 2 / 3, 1 / 6];

const EPS_GLOBAL_ELASTIC = 5.0e-4;
const log_step = 0.02;
const m = 1;
const k_spring = 0.0;
const q2 = 0.1;
const k_elastic = 10.0;
const k_friction = 2.8;
const infinity = 1000;

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
    k_rx = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    k_ry = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    k_vx = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    k_vy = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

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

    constructor(x, y) {
        this.rx = x;
        this.ry = y;
        this.stored_rx = x;
        this.stored_ry = y;
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

class Field {
    lineNum = 0;
    generatorNum = 0;
    s = 0;

    /**
     * @type {Line[]}
     */
    _lines = [];

    /**
     * @type {Point[]}
     * @private
     */
    _points = [];

    /**
     * Step or upper limit to floating step.
     * @type {number}
     */
    dt = 0.1;

    time_step = 1.0;
    new_time_step = 1.0;
    float_time = true;
    _iterations = 0;

    /**
     * @type {Polygon[]}
     * @private
     */
    _polygons = [];

    get points() {
        return this._points;
    }

    get lines() {
        return this._lines;
    }

    get polygons() {
        return this._polygons;
    }

    get iterations() {
        const iterations = this._iterations;
        this._iterations = 0;

        return iterations;
    }

    /**
     * Upper estimate for the black regions
     * @returns {number}
     */
    darkPolygonNumLimit() {
        const n = this.lineNum;
        const k = n*(n-1) / 2 - this.generatorNum;

        return Math.floor((n*n + n - 2*k)/3);
    }

    /**
     * @returns {number}
     */
    darkPolygonNum() {
        return this._polygons.filter(polygon => polygon.parity).length;
    }

    parseGenerators(generators) {
        let i;
        this.generatorNum = generators.length;

        // Может генераторы идут не с нуля? Ща исправим
        const minGenerator = Math.min(...generators);
        const maxGenerator = Math.max(...generators);

        // Считаем разность
        this.s = 0;
        for (i = 0; i < this.generatorNum; i++) {
            generators[i] -= minGenerator;
            this.s += 2 * (generators[i] % 2) - 1;
        }

        this.lineNum = maxGenerator - minGenerator + 2;

        // готовим матрицу прямых
        this._lines = [];
        for (i = 0; i < this.lineNum; i++) {
            this._lines[i] = new Line(getRandomColor());
        }

        // Готовим перестановку
        let rearrangement = [], inverseRearrangement = [];
        for (i = 0; i < this.lineNum; i++) {
            rearrangement[i] = i;
        }

        /** @type {Polygon[]} */
        let polygons = [];
        /** @type {Polygon[]} */
        let topPolygons = [];
        for (i = -1; i < this.lineNum; i++) {
            topPolygons[i] = polygons[i] = (new Polygon(this.getGeneratorParity(i))).markAsExternal();
        }

        // Парсим генераторы
        this._points = [];
        for (i = 0; i < this.generatorNum; i++) {
            const generator = generators[i];

            // Меняем местами соседние элементы в перестановке
            let a_i = rearrangement[generator];
            rearrangement[generator] = rearrangement[generator + 1];
            rearrangement[generator + 1] = a_i;

            let point = new Point(((i - this.generatorNum / 2) / this.lineNum * 2), (generator - this.lineNum / 2));

            this._lines[rearrangement[generator]].addPoint(point);
            this._lines[rearrangement[generator + 1]].addPoint(point);

            this._points.push(point);

            const polygon = polygons[generator];
            polygon.addLeftPoint(point);
            if (polygon !== topPolygons[generator]) {
                // Top polygons will be added later
                polygon.addTopPointsAndClose();
                this._polygons.push(polygon);
            }

            polygons[generator] = new Polygon(this.getGeneratorParity(generator));
            polygons[generator].addLeftPoint(point);

            polygons[generator - 1].addRightPoint(point);
            polygons[generator + 1].addLeftPoint(point);
        }

        // Смотрим, как расположены точки внизу карты метро, нужно для правильной
        // расстановки фиктивных точек.
        let str = '';
        for (i = 0; i < this.lineNum; i++) {
            str += ' ' + rearrangement[i];
            inverseRearrangement[rearrangement[i]] = i;
        }

        // Добавляем фиктивные точки
        for (i = this.lineNum; i--;) {
            // It's important to count i down since it's hard to make top polygons oriented.

            let pointTop;
            let pointBottom;

            if (i === rearrangement[this.lineNum - 1 - i]) {
                // This line is not parallel to any other line
                const angle1 = Math.PI * (1.5 - (0.5 + i) / this.lineNum);
                pointTop = new Point(infinity * Math.cos(angle1), infinity * Math.sin(angle1));

                const angle2 = Math.PI * (-0.5 + (0.5 + inverseRearrangement[i]) / this.lineNum);
                pointBottom = new Point(infinity * Math.cos(angle2), infinity * Math.sin(angle2));
            } else {
                // This is a parallel line
                const angle1 = Math.PI * (1.5 - (0.5 + i + 0.5 + rearrangement[this.lineNum - i - 1]) / this.lineNum / 2);
                pointTop = new Point(infinity * Math.cos(angle1), infinity * Math.sin(angle1));

                const angle2 = Math.PI * (-0.5 + (0.5 + inverseRearrangement[i] + 0.5 + inverseRearrangement[rearrangement[this.lineNum - i - 1]]) / this.lineNum / 2);
                pointBottom = new Point(infinity * Math.cos(angle2), infinity * Math.sin(angle2));
            }

            this._lines[i].prependPoint(pointTop);

            if (i === this.lineNum - 1) {
                topPolygons[i].addRightPoint(pointTop);
            } else {
                topPolygons[i].addTopPointsAndClose(pointTop);
                this._polygons.push(topPolygons[i]);
            }
            topPolygons[i - 1].prependRightPoint(pointTop);

            this._lines[i].addPoint(pointBottom);

            polygons[inverseRearrangement[i]].addLeftPoint(pointBottom);
            polygons[inverseRearrangement[i] - 1].addRightPoint(pointBottom);
        }

        for (i = -1; i < this.lineNum; i++) {
            this._polygons.push(polygons[i]
                .addTopPointsAndClose()
                .markAsExternal()
            );
        }
    }

    getGeneratorParity(i) {
        return (i % 2 === 0) === (this.s < 0);
    }

    calculateStep() {
        let dt1;
        // if (this.float_time) {
        //     this.time_step = Math.min(1.001*this.time_step, this.dt);
        //     dt1 = Math.min(this.dt, this.time_step);
        // }
        // else {
        dt1 = this.dt;
        // }

        // this.calcForces();

        for (let step = 0; step < 5; step++) {
            for (let i = this.generatorNum; i--;) {
                this._points[i].makeStep(step);
            }
            this.calcForces();
            for (let i = this.generatorNum; i--;) {
                this._points[i].storeDerivativeForStep(step, dt1);
            }
        }

        // Max value
        this.new_time_step = this.dt;

        this.w_kin = 0;
        for (let i = this.generatorNum; i--;) {
            this.w_kin += this._points[i].realMove();
        }

        // TODO float step!!!

        this._iterations++;
    }

    calcForces() {
        this.w_pot = 0;

        // Oscillator potential and liquid friction
        for (let i = 0; i < this.generatorNum; i++) {
            this.w_pot += this._points[i].setGlobalForces(k_spring, k_friction);
        }

        for (let i = 0; i < this.lineNum; i++) {
            this.w_pot += this._lines[i].addElasticForce(k_elastic);
            this.w_pot += this._lines[i].addElectricForce(q2);
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {null|Polygon}
     */
    findTriangleToFlip(x, y) {
        let nearestDistance2 = sqr(infinity);
        /** @type {Point} */
        let nearestPoint;
        for (let i = this._points.length; i--;) {
            const pt = this._points[i];
            const distance2 = sqr(x - pt.rx) + sqr(y - pt.ry);
            if (distance2 < nearestDistance2) {
                nearestDistance2 = distance2;
                nearestPoint = pt;
            }
        }

        if (!nearestPoint) {
            return null;
        }
        const polygons = nearestPoint.polygons;

        for (let i = polygons.length; i--; ) {
            const polygon = polygons[i];
            if (polygon.getCount() === 3 && polygon.contains(x, y) && !polygon.external) {
                return polygon;
            }
        }

        return null;
    }
}
