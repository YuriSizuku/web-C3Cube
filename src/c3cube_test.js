"use strict";

import * as math from 'mathjs';
import * as assert from 'assert';
import {C3Cube, C3CubeUtil} from './c3cube_core.js';

const C3CubeTest = function(n) {
    this.c0 = new C3Cube(n);
    this.util = new C3CubeUtil();
}

C3CubeTest.prototype.validate_encode = function() {

}

C3CubeTest.prototype.validate_enum = function() {
    var c1 = new C3Cube(c0.order);
    var a = c0.imin;
    var b = c0.imax;
    for(let axis=0;axis<3;axis++) {

    }
}

C3CubeTest.prototype.validate_operate = function() {
    var c1 = new C3Cube(c0.order);
    var a = c0.imin;
    var b = c0.imax;
    for(let axis=0;axis<3;axis++) {

    }
}

export {C3CubeTest}

function debug_c3() {
    var c3 = new C3Cube(3);
    c3.print_status();
    var util = new C3CubeUtil();

    // debug encode
    var c3_d3 = util.encode_pos(3, [1, 1, 1]);
    assert.equal(c3_d3, 26);
    var c3_p3 = util.decode_pos(3, c3_d3);
    assert.ok(math.deepEqual(c3_p3, [1, 1, 1]))

    // debug enum
    var c3_coords = util.enum_all(3);
    var c3_coords_corner = util.enum_corner(3);
    var c3_coords_edge = util.enum_edge(3);
    var c3_coords_inner = util.enum_inner(3);
    var c3_F = util.enum_axis(3, 0, 1);
    var c3_x0 = util.enum_axis(3, 0, 0);

    // debug dist
    var diff1 = util.diff_cube(c3, c3)
    console.log(c3)
}

function debug_c4(){
    var c4 = new C3Cube(4);
    var util = new C3CubeUtil();
    
    // debug encode
    var c4_d4 = util.encode_pos(4, [2, 2, 2]);
    assert.equal(c4_d4, 63);
    var c4_p4 = util.decode_pos(4, c4_d4);
    assert.ok(math.deepEqual(c4_p4, [2, 2, 2]))

    // debug enum
    var c4_coords = util.enum_all(4);
    var c4_coords_corner = util.enum_corner(4);
    var c4_coords_edge = util.enum_edge(4);
    var c4_coords_inner = util.enum_inner(4);
    var c4_F = util.enum_axis(4, 0, 2);
    var c4_x1 = util.enum_axis(4, 0, 1);

    // debug dist
    var diff1 = util.diff_cube(c4, c4);
    console.log(c4);
}

debug_c3();
debug_c4();
