"use strict";

/**
 * c3cube_test.js, to test the functions for c3cube
 *   v0.1.1, developed by devseed
 */

import * as math from 'mathjs';
import * as assert from 'assert';
import {C3Cube, C3CubeUtil} from './c3cube_core.js';

const C3CubeCoreTest = function(n, showlog=true) {
    this.c0 = new C3Cube(n);
    this.showlog = showlog;
    this.util = new C3CubeUtil();
}

C3CubeCoreTest.prototype.validate_pos = function() {
    var n = this.c0.order;
    var coords = this.util.enum_all(n);
    var coords_set = new Set();
    for(let idx in coords) {
        var p0 = coords[idx];
        var d = this.util.encode_pos(n, p0);
        var p1 = this.util.decode_pos(n, d);
        assert.deepEqual(p0, p1);
        assert.ok(!coords_set.has(d));
        coords_set.add(d);
    }
    this.logi("validate_pos", "coordinate encoding passed");
}

C3CubeCoreTest.prototype.validate_operatestr = function(operates_str, operates_gt) {
    var operates = this.util.load_operates(operates_str);
    assert.equal(operates_gt.length, operates.length);
    for(let idx in operates) {
        assert.deepEqual(operates[idx], operates_gt[idx]);
    }
   
    var operates2_str = this.util.dump_operates(operates_gt);
    var operates2 = this.util.load_operates(operates2_str);
    assert.equal(operates_gt.length, operates2.length);
    for(let idx in operates) {
        assert.deepEqual(operates2[idx], operates_gt[idx]);
    }
    
    this.logi("validate_operatestr", `"${operates_str}" passed`);
}

C3CubeCoreTest.prototype.validate_enum = function() {
    // validate by type
    const n = this.c0.order;
    const a = this.c0.imin;
    const b = this.c0.imax;
    const coords_corner = this.util.enum_corner(n);
    const coords_edge = this.util.enum_edge(n);
    const coords_inner = this.util.enum_inner(n);
    const coords_set = new Set();
    var coords = [];
    assert.equal(coords_corner.length, this.c0.ncorner);
    assert.equal(coords_edge.length, this.c0.nedge);
    assert.equal(coords_inner.length, this.c0.ninner);
    coords = coords.concat(coords_corner, coords_edge, coords_inner);
    for (let idx in coords) {
        coords_set.add(this.util.encode_pos(n, coords[idx]));       
    }
    assert.equal(coords_set.size, this.c0.npiece);
    this.logi("validate_enum", "corner, edge, inner passed");

    // validate by axis
    var coords_tmp = [];
    var coords_axis = [[], [], []];
    for(let axis=0; axis<3;axis++) {
        for(let i=-b;i<0;i++) {
            coords_tmp =  this.util.enum_axis(n, axis, i);
            for (let idx in coords_tmp) {
                assert.ok(coords_set.has(this.util.encode_pos(n, coords_tmp[idx])));
            }
            coords_axis[axis] = coords_axis[axis].concat(coords_tmp);
        }
        if(a==0) {
            coords_tmp = this.util.enum_axis(n, axis, 0)
            for (let idx in coords_tmp) {
                assert.ok(coords_set.has(this.util.encode_pos(n, coords_tmp[idx])));
            }
            coords_axis[axis] = coords_axis[axis].concat(coords_tmp);
        }
        for(let i=1;i<=b;i++) {
            coords_tmp = this.util.enum_axis(n, axis, i);
            for (let idx in coords_tmp) {
                assert.ok(coords_set.has(this.util.encode_pos(n, coords_tmp[idx])));
            }
            coords_axis[axis] = coords_axis[axis].concat(coords_tmp);
        }
        assert.equal(coords_axis[axis].length, this.c0.npiece);
        this.logi("validate_enum", `axis[${axis}] passed`);
    }
}

C3CubeCoreTest.prototype.validate_initstatus = function() {
    var n = this.c0.order;
    var a = this.c0.imin;
    var b = this.c0.imax;
    var coords_corner = this.util.enum_corner(n);
    var coords_edge = this.util.enum_edge(n);
    var coords_inner = this.util.enum_inner(n);
    var color_count = [], color_rmap = {};
    for(let idx in this.c0.colormap) {
        color_rmap[this.c0.colormap[idx]] = idx;
    }
    
    // validate corner status
    color_count = [0, 0, 0, 0, 0, 0, 0];
    for(let idx in coords_corner) {
        var p = coords_corner[idx];
        var u = this.c0.pieces[this.c0.encode_pos(p)];
        assert.deepEqual(math.sign(u.p), math.sign(u.o));
        assert.deepEqual(math.abs(u.o), [u.ijkbase[0], u.ijkbase[1], u.ijkbase[2]]);
        color_count[color_rmap[u.c[0]]] ++;
        color_count[color_rmap[u.c[1]]] ++;
        color_count[color_rmap[u.c[2]]] ++;
    }
    assert.equal(color_count[0], 0);
    for(let i=2; i<color_count.length;i++) {
        assert.equal(color_count[1], color_count[2]);
    }
    this.logi("validate_initstatus", "corner status passed");

    // validate edge status
    color_count = [0, 0, 0, 0, 0, 0, 0];
    for(let idx in coords_edge) {
        var p = coords_edge[idx];
        var u = this.c0.pieces[this.c0.encode_pos(p)];
        assert.deepEqual(math.abs(u.o), [u.ijkbase[0], u.ijkbase[1], u.ijkbase[2]]);
        color_count[color_rmap[u.c[0]]] ++;
        color_count[color_rmap[u.c[1]]] ++;
        color_count[color_rmap[u.c[2]]] ++;
    }
    assert.equal(color_count[0], coords_edge.length);
    for(let i=2; i<color_count.length;i++) {
        assert.equal(color_count[1], color_count[2]);
    }
    this.logi("validate_initstatus", "edge status passed");

    // validate inner status
    color_count = [0, 0, 0, 0, 0, 0, 0];
    for(let idx in coords_inner) {
        var p = coords_inner[idx];
        var u = this.c0.pieces[this.c0.encode_pos(p)];
        assert.deepEqual(math.abs(u.o), [u.ijkbase[0], u.ijkbase[1], u.ijkbase[2]]);
        color_count[color_rmap[u.c[1]]] ++;
    }
    for(let i=2; i<color_count.length;i++) {
        assert.equal(color_count[1], color_count[2]);
    }
    this.logi("validate_initstatus", "inner status passed");
} 

C3CubeCoreTest.prototype.validate_operate = function() {
    const n = this.c0.order;
    const a = this.c0.imin;
    const b = this.c0.imax;
    var c0=this.c0, c1;
    for(let axis=0;axis<3;axis++) {
        for(let l=-b; l<0; l++) {
            c1 = new C3Cube(n);
            c1.operate(axis, l);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, l);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, l);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, l);
            assert.equal(this.util.dist_cube(c0, c1), 0);
        }
        if(a==0) {
            c1 = new C3Cube(n);
            c1.operate(axis, 0);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, 0);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, 0);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, 0);
            assert.equal(this.util.dist_cube(c0, c1), 0);
        }
        for(let l=1; l<=b; l++) {
            c1 = new C3Cube(n);
            c1.operate(axis, l);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, l);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, l);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            assert.ok(this.util.dist_cube(c0, c1) > 0);
            c1.operate(axis, l);
            assert.equal(this.util.dist_cube(c0, c1), 0);
            assert.equal(this.util.dist_cube(c0, c1), 0);
        }
        this.logi("validate_operate", `axis ${axis} passed`);
    }
}

C3CubeCoreTest.prototype.logi = function(funcname, msg) {
    if(this.showlog) console.log(`cube${this.c0.order}.${funcname}: ${msg}`);
}

const C3CubeSolveTest = function() {

}

export {C3CubeCoreTest, C3CubeSolveTest}

function debug_c3() {
    var c3 = new C3Cube(3);
    var util = new C3CubeUtil();
    console.log(c3);

    // debug dist
    var c3z1 = new C3Cube(3);
    c3z1.operate(2, 1);
    var c3_dist_z1 = util.dist_cube(c3, c3z1);
    console.log(c3_dist_z1);
}

function debug_c4(){
    var c4 = new C3Cube(4);
    var util = new C3CubeUtil();
    console.log(c4);

    // debug dist
    var c4z2 = new C3Cube(4);
    c4z2.operate(2, 2);
    var c4_dist_z2 = util.diff_cube(c4, (new C3Cube(4)).operate(2, 2));
    console.log(c4_dist_z2);
}

function operate_encode_test() {
    var operate_test = new C3CubeCoreTest(3);
    var operate_str = "X(1)Y(-1), Z(11) X(0, -1), X(1, 2), Y(-2,2)";
    var operates = [[0, 1, 1], [1, -1, 1], [2, 11, 1], [0, 0, 3], [0, 1, 2], [1, -2, 2]];
    operate_test.validate_operatestr(operate_str, operates);
}

function core_test(n) {
    var coretest = new C3CubeCoreTest(n);
    coretest.validate_pos();
    coretest.validate_enum();
    coretest.validate_initstatus();
    coretest.validate_operate();
}

// debug_c3();
// debug_c4();
operate_encode_test();
core_test(3);
core_test(4);
core_test(5);
core_test(6);
core_test(7);

/**
 * history:
 *   v0.1, add pos, enum, initstatus, operate test
 *   v0.1.1, add operate encode test
 */