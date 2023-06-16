"use strict";

/**
 * c3cube_solve.js, n-cube solve method implementation
 *   v0.0, developed by devseed
 */

import { C3Cube } from "./c3cube_core.js";

var math_dummy;
if (typeof process !== 'undefined') { // node
    math_dummy = await import("mathjs");
}
var math = math_dummy ? math_dummy: window.math;

const C3CubeSolve = function () {

}

export {C3CubeSolve}