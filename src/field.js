const k_spring = 0.0;
const q2 = 0.1;
const k_elastic = 10.0;
const k_friction = 2.8;

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
    _hasWon = false;

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
    get darkPolygonNumLimit() {
        const n = this.lineNum;
        const k = n * (n - 1) / 2 - this.generatorNum;

        return Math.floor((n * n + n - 2 * k) / 3);
    }

    /**
     * @returns {number}
     */
    darkPolygonNum() {
        return this._polygons.filter(polygon => polygon.parity).length;
    }

    shouldCongratulate() {
        if (this._hasWon) {
            return false;
        }

        if (this.darkPolygonNum() === this.darkPolygonNumLimit) {
            this._hasWon = true;
            return true;
        }

        return false;
    }

    /**
     * @param {number[]} generators
     */
    parseGenerators(generators) {
        this._hasWon = false;
        this._cachedPointCloseToCursor = null;
        this._cachedPolygonAtCursor = null;

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
        this._polygons = [];
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

    getState() {
        return {
            points: this.getPointsState()
        }
    }

    getPointsState() {
        const rearrangement = [];
        const pointIndexOfLine = [];
        for (let i = this.lineNum; i--;) {
            rearrangement[i] = i;

            // 1 because of skipping external points
            pointIndexOfLine[i] = 1;
        }

        const pointData = [];
        while (pointData.length < this.generatorNum) {
            for (let i = 0; i < this.lineNum - 1; i++) {
                const thisLineIndex = rearrangement[i];
                const thisLine = this._lines[thisLineIndex];
                const thisPoint = thisLine.getInternalPoint(pointIndexOfLine[thisLineIndex]);
                if (thisPoint === null) {
                    continue;
                }

                const nextLineIndex = rearrangement[i + 1];
                const nextLine = this._lines[nextLineIndex];
                const nextPoint = nextLine.getInternalPoint(pointIndexOfLine[nextLineIndex]);
                if (nextPoint === null) {
                    continue;
                }

                if (thisPoint === nextPoint) {
                    rearrangement[i] = nextLineIndex;
                    rearrangement[i+1] = thisLineIndex;

                    pointData.push({g: i, x: thisPoint.rx, y: thisPoint.ry});
                    pointIndexOfLine[thisLineIndex]++;
                    pointIndexOfLine[nextLineIndex]++;
                    i++;
                }
            }
        }

        return pointData;
    }

    setState(state) {
        this.parseGenerators(state.points.map(item => item.g));
        state.points.forEach((pt, i) => {
            this._points[i].setState(pt.x, pt.y);
        });
    }

    getGeneratorParity(i) {
        return (i % 2 === 0) /*=== (this.s <= 0)*/;
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
     * @type {null|Point}
     * @private
     */
    _cachedPointCloseToCursor = null;

    /**
     * @type {null|Polygon}
     * @private
     */
    _cachedPolygonAtCursor = null;

    /**
     * @param {number} x
     * @param {number} y
     * @returns {null|Polygon}
     */
    findTriangleToFlip(x, y) {
        if (this._cachedPolygonAtCursor && this._cachedPolygonAtCursor.contains(x, y)) {
            return this._cachedPolygonAtCursor.isClickable() ? this._cachedPolygonAtCursor : null;
        }

        if (this._cachedPointCloseToCursor) {
            const possibleNearestPoint = this.getPossibleNearestPoint(this._cachedPointCloseToCursor, x, y);

            const polygon = possibleNearestPoint.getPolygonContaining(x, y);
            if (polygon !== null) {
                this._cachedPolygonAtCursor = polygon;

                return (polygon.isClickable()) ? polygon : null;
            }
        }

        let nearestDistance2 = sqr(infinity);
        /** @type {Point} */
        let nearestPoint;
        for (let i = this._points.length; i--;) {
            const pt = this._points[i];
            const distance2 = pt.squaredDistanceFrom(x, y);
            if (distance2 < nearestDistance2) {
                nearestDistance2 = distance2;
                nearestPoint = pt;
            }
        }

        this._cachedPointCloseToCursor = nearestPoint;

        if (!nearestPoint) {
            return null;
        }

        const polygon = nearestPoint.getPolygonContaining(x, y);
        this._cachedPolygonAtCursor = polygon;

        return (polygon !== null && polygon.isClickable()) ? polygon : null;
    }

    /**
     * @param {Point} point
     * @param {number} x
     * @param {number} y
     * @returns {Point}
     */
    getPossibleNearestPoint(point, x, y) {
        let currentLine = point.lines[0];
        let currentPt = currentLine.getClosestInnerPoint(x, y);

        while (true) {
            let newLine = (currentLine === currentPt.lines[0]) ? currentPt.lines[1] : currentPt.lines[0];
            let newPt = newLine.getClosestInnerPoint(x, y);
            if (newPt === currentPt) {
                break;
            }
            currentLine = newLine;
            currentPt = newPt;
        }

        return currentPt;
    }
}
