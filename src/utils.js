const infinity = 1000;

/**
 * @returns {string}
 */
function getRandomColor() {
    const letters = '0123456789ABC34567';
    // const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * @param {number} number
 * @returns {number}
 */
function sqr(number) {
    return number * number;
}

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @returns {number}
 */
function signVectorProd(x1, y1, x2, y2, x3, y3)
{
    return ((x2 - x1)*(y3 - y2) - (y2 - y1)*(x3 - x2)) > 0 ? 1 : -1;
}

/**
 * Obtained by differentiating a model energy
 *
 * @param {Point} p1
 * @param {Point} p2
 * @param {Point} p3
 * @param {number} k_elastic
 * @returns {number}
 */
function add_elastic_force(p1, p2, p3, k_elastic) {

    // tau_1 = (r_1 - R) / |r_1 - R|
    let tau_1x = p1.rx - p2.rx;
    let tau_1y = p1.ry - p2.ry;

    const tau_1_len = Math.sqrt(sqr(tau_1x) + sqr(tau_1y));

    tau_1x = tau_1x / tau_1_len;
    tau_1y = tau_1y / tau_1_len;

    // tau_2 = (r_2 - R) / |r_2 - R|
    let tau_2x = p3.rx - p2.rx;
    let tau_2y = p3.ry - p2.ry;

    const tau_2_len = Math.sqrt(sqr(tau_2x) + sqr(tau_2y));

    tau_2x = tau_2x / tau_2_len;
    tau_2y = tau_2y / tau_2_len;

    // scalar product
    const c = tau_1x * tau_2x + tau_1y * tau_2y;

    // F_2 = (- tau_1 + tau_2 (tau_1, tau_2)) / |r_2 - R|
    const f2x = k_elastic * (-tau_1x + tau_2x * c) / tau_2_len;
    const f2y = k_elastic * (-tau_1y + tau_2y * c) / tau_2_len;

    // F_1 = (- tau_2 + tau_1 (tau_1, tau_2)) / |r_1 - R|
    const f1x = k_elastic * (-tau_2x + tau_1x * c) / tau_1_len;
    const f1y = k_elastic * (-tau_2y + tau_1y * c) / tau_1_len;

    p1.addForce(f1x, f1y);
    p2.addForce(-f1x - f2x, -f1y - f2y);
    p3.addForce(f2x, f2y);

    return k_elastic * (1 + c);
}

/**
 * @param {Point} a
 * @param {Point} b
 * @param {number} q2 square of charge
 * @returns {number}
 */
function add_electric_force(a, b, q2) {
    const rx = b.rx - a.rx;
    const ry = b.ry - a.ry;
    const r2 = sqr(rx) + sqr(ry);
    const r = Math.sqrt(r2);
    const r3 = r2 * r;

    b.addForce(q2 * rx / r3, q2 * ry / r3);
    b.sawNearestPointAt(r);
    a.addForce(-q2 * rx / r3, -q2 * ry / r3);
    a.sawNearestPointAt(r);

    return q2 / r;
}

/**
 * Wraps each digit of numbers to fix non-monospace font.
 * @param {number} n
 * @returns {string}
 */
function wrapNum(n) {
    return String(n).split('').map(digit => '<span class="digit">' + digit + '</span>').join('');
}
