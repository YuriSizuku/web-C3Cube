"use strict";

/**
 * c3cube_core.js, n-cube status and operation implementation
 *   v0.1, developed by devseed
 */

var math_dummy;
if (typeof process !== 'undefined') { // node
    math_dummy = await import("mathjs");
}
var math = math_dummy ? math_dummy: window.math;

const C3Cube = function(n) {
    if(n<3) throw new Error("cube order must bigger than 3");
    this.order = n;
    this.imin = (n+1)%2;
    this.imax = math.floor(n/2);
    this.npiece = n*n*n - (n-2)*(n-2)*(n-2);
    this.ncorner = 8;
    this.nedge = 12*(n-2);
    this.ninner = 6*(n-2)*(n-2);
    this.operates = []
    this.pieces = this.init_pieces();
}

C3Cube.prototype.init_pieces = function() {
    var a = this.imin;
    var b = this.imax;
    var cmap = this.colormap;
    var coords_corner = (new C3CubeUtil).enum_corner(this.order);
    var coords_edge = (new C3CubeUtil).enum_edge(this.order);
    var coords_inner = (new C3CubeUtil).enum_inner(this.order);
    var pieces = [];
    var p = [], o = [], c = [];
    
    // create piece array 
    for(let i=-b;i<=b;i++) {
        pieces[i] = [];
        for(let j=-b;j<=b;j++) {
            pieces[i][j] = []
            for(let k=-b;k<=b;k++) {
                pieces[i][j][k] = null;
            }
        }
    }

    // corner piece, 8
    for(let idx in coords_corner) {
        p = coords_corner[idx];
        o = math.sign(p);
        c = [cmap[this.color_idx([o[0], 0, 0])], 
            cmap[this.color_idx([0, o[1], 0])],
            cmap[this.color_idx([0, 0, o[2]])]];
        pieces[p[0]][p[1]][p[2]] = new C3CubePiece(p, o, c);
    }

    // edge piece, 12(n-2)
    for(let idx in coords_edge) {
        p = coords_edge[idx];
        o = math.add(math.sign(p), math.subtract([1, 1, 1],  math.abs(math.sign(p))));
        c = ['N', 'N', 'N'];
        if(math.abs(p[0])<b) c = [cmap[0], 
            cmap[this.color_idx([0, o[1], 0])], cmap[this.color_idx([0, 0, o[2]])]];
        if(math.abs(p[1])<b) c = [cmap[this.color_idx([o[0], 0, 0])], 
            cmap[0], cmap[this.color_idx([0, 0, o[2]])]];
        if(math.abs(p[2])<b) c = [cmap[this.color_idx([o[0], 0, 0])], 
            cmap[this.color_idx([0, o[1], 0])], cmap[0]];
        pieces[p[0]][p[1]][p[2]] = new C3CubePiece(p, o, c);
    }

    // inner piece, 6(n-2)^2
    for(let idx in coords_inner) {
        p = coords_inner[idx];
        o = math.add(math.sign(p), math.subtract([1, 1, 1],  math.abs(math.sign(p))));
        c = ['N', 'N', 'N'];
        if(math.equal(math.abs(p[0]), b)) c = [cmap[0], cmap[this.color_idx([o[0], 0, 0])], cmap[0]];
        if(math.equal(math.abs(p[1]), b)) c = [cmap[0], cmap[this.color_idx([0, o[1], 0])], cmap[0]];
        if(math.equal(math.abs(p[2]), b)) c = [cmap[0], cmap[this.color_idx([0, 0, o[2]])], cmap[0]];
        pieces[p[0]][p[1]][p[2]] = new C3CubePiece(p, o, c);
    }

    return pieces
}

C3Cube.prototype.print_status = function() {
    var b = this.imax;
    var pieces = this.pieces;
    var coords = (new C3CubeUtil).enum_all(this.order);

    console.log(`C3Cube order=${this.order}, corner=${this.ncorner}, edge=${this.nedge}, inner=${this.ninner}`);

    for(let idx in coords) {
        var p = coords[idx];
        pieces[p[0]][p[1]][p[2]].print_status();
    }
}

C3Cube.prototype.print_operates = function(type) {

}

C3Cube.prototype.push_operate = function(F) {
    this.operates.push(F);
    this.operate.apply(F);
}

C3Cube.prototype.pop_operate = function() {
    var F = this.operates.pop();
    this.operate.apply(F);
    this.operate.apply(F);
    this.operate.apply(F);
    return F;
}

C3Cube.prototype.operate = function(axis, l) {
    var a = this.imin;
    var b = this.imax;
    var pieces = this.pieces;
    var coords = (new C3CubeUtil()).enum_axis(this.order, axis, l);
    for(let idx in coords) {
        pieces[coords[idx][0]][coords[idx][1]][coords[idx][2]].operate(axis, l);
    }
} 

/**
 * colormap, as {coloridx(x, y, z): c}, 
 * b|(-1,0,0)|1->O, f|(1,0,0)|2->R, l|(0,-1,0)|3->W, 
 * r(0,1,0)|4->Y, d|(0,0,-1)|5->G, u|(0,0,1)|6->B
*/
C3Cube.prototype.colormap = {
    0:'N', 1:'O', 2:'R', 3:'W', 4:'Y', 5: 'G', 6:'B', 
};

/** 
* coloridx x(x, y, z) = 
* [(3, 7, 11) + (x, y, z)]*|(x, y, z)^T| /2
* @param {Array} o, axis orientation, like (0, 0, 1)
*/
C3Cube.prototype.color_idx = function(o) {
    var ta = math.add([3, 7, 11], o);
    var tb = math.abs(o);
    return math.dot(ta, tb)/2;
}

/** the piece on the surface of cube
 * @param {Array} p, position vector (1, 1, 1)
 * @param {Array} o, oritation vector, like (1, 1, 1) * (i, j, k)
 * @param {Array} c, color vector, like ('R', 'Y', 'B')
 * @param {Array} p0, the origin coordinate
 */
const C3CubePiece = function(p, o, c, p0=null) {
    var ijkbase = this.ijkbase;
    this.p = math.transpose(math.matrix([p]));
    this.o = math.transpose(math.matrix([[ijkbase[0]*o[0], ijkbase[1]*o[1], ijkbase[2]*o[2]]]));
    this.c = c;
    this.p0 = p0;
    if(p0==null) {
        this.p0 = math.transpose(math.matrix([p]));
    }
}

const _T = [math.matrix([
    [1, 0, 0],
    [0, 0, 1],
    [0,-1, 0]
]), math.matrix([
    [0, 0,-1], 
    [0, 1, 0],
    [1, 0, 0]
]), math.matrix([
    [ 0, 1, 0],
    [-1, 0, 0],
    [ 0, 0, 1]
])];
C3CubePiece.prototype.T = _T;
C3CubePiece.prototype.T3 = [math.inv(_T[0]), math.inv(_T[1]), math.inv(_T[2])];
C3CubePiece.prototype.ijkbase = [1, 2, 3];

C3CubePiece.prototype.print_status = function() {
    var p0 = math.transpose(this.p0)._data[0];
    var p = math.transpose(this.p)._data[0];
    var o = math.sign(math.transpose(this.o))._data[0];
    var c = this.c;
    // console.log(p0, p, o, c);
    console.log(`(${p0[0]}, ${p0[1]}, ${p0[2]}): (${p[0]}, ${p[1]}, ${p[2]}), (${o[0]}, ${o[1]}, ${o[2]}), (${c[0]}, ${c[1]}, ${c[2]}))`);
}

C3CubePiece.prototype.operate = function(axis) {
    // position transter
    this.p = math.multiply(this.T3[axis], this.p);
    
    // before orientation transfer
    var M = [this.o._data[0][0], this.o._data[1][0], this.o._data[2][0]];
    M = math.diag(math.sign(M));
    this.o = math.multiply(M, this.o);
    this.o = math.multiply(this.T[axis], this.o);
    this.o = math.multiply(M, this.o);

    // after orientation transfer, permute to i, j, k
    var o = this.o._data;
    var c = this.c;
    for(let i=0;i<3;i++){
        for(let j=i;j<3;j++){
            if(math.abs(o[i]) > math.abs(o[j])) {
                let tmp = o[i]; o[i] = o[j]; o[j] = tmp;
                tmp = c[i]; c[i] = this.c[j]; c[j] = tmp;
            }
        }
    }
}

const C3CubeUtil = function() {}

/**
 * load the encodes operate str
 * @param {String} operate_str 
 * @returns {Array} operates
 */
C3CubeUtil.prototype.load_operates = function(operate_str)  {
    var operates = [];
    return operates;
}

/**
 * dump the operate sequence to str
 * @param {*} operates 
 * @returns {string} operate_str
 */
C3CubeUtil.prototype.dump_operates = function(operates) {
    var operate_str = "";
    return operate_str;
}

/**
 * check if p is the valid pos
 * @param {int} n 
 * @param {Array} p 
 * @returns {boolean}
 */
C3CubeUtil.prototype.valid_pos = function(n, p) {
    var a = (n+1)%2;
    var b = math.floor(n/2);
    var flag = false;
    for(let i=0;i<3;i++) {
        if(math.abs(p[i]) < a || math.abs(p[i])>b) return false;
        if(math.equal(math.abs(p[i]), b)) flag=true;
    }
    return flag;
}

/**
 * encode the cube position to a number
 * @param {int} n 
 * @param {Array} p 
 * @return {int} 
 */
C3CubeUtil.prototype.encode_pos = function(n, p) {
    var a = (n+1)%2;
    var b = math.floor(n/2);
    var t1 = p[0] + b - a*(p[0]>0);
    var t2 = p[1] + b - a*(p[1]>0);
    var t3 = p[2] + b - a*(p[2]>0);
    return t1 + n*t2 + n*n*t3;
}

/**
 * decode the number to cube position
 * @param {int} n 
 * @param {int} d 
 * @return {Array} 
 */
C3CubeUtil.prototype.decode_pos = function(n, d) {
    var a = (n+1)%2;
    var b = math.floor(n/2);
    var t1 = d % n;
    var t2 = parseInt((d - t1)/n) % n;
    var t3 = parseInt((d - t1 - t2*n)/n/n);
    return [t1 - b + a*(t1>=b), 
            t2 - b + a*(t2>=b), 
            t3 - b + a*(t3>=b)];
}

/**
 * enumerate the coordinates of n-cube
 * @param {int} n 
 */
C3CubeUtil.prototype.enum_all = function(n) {
    var coords = [];
    coords = coords.concat(this.enum_corner(n), this.enum_edge(n), this.enum_inner(n));
    return coords;
}

/**
 * enumerate the coordinates of n-cube corner pieces
 * @param {int} n 
 * @returns {Array}
 */
C3CubeUtil.prototype.enum_corner = function(n) {
    var a = (n+1)%2;
    var b = math.floor(n/2);
    var coords = [[-b, -b, -b], [b, -b, -b], [-b, b, -b], [-b, -b, b], 
        [-b, b, b], [b, -b,  b], [b, b, -b], [b, b, b]];
    return coords;
}

/**
 * enumerate the coordinates of n-cube edge pieces
 * @param {int} n 
 * @returns {Array}
 */
C3CubeUtil.prototype.enum_edge = function(n) {
    var a = (n+1)%2;
    var b = math.floor(n/2);
    var a1 = a;
    var coords = [];
    
    if(a==0) {
        a1 = a+1;
        for(let r1=-1;r1<=1;r1+=2) { // 1 zero
            for(let r2=-1;r2<=1;r2+=2) {
                coords.push([0, b*r1, b*r2]);
                coords.push([b*r1, 0, b*r2]);
                coords.push([b*r1, b*r2, 0]);
            }
        }
    }
    for(let i=a1;i<b;i++) {
        for(let r1=-1;r1<=1;r1+=2) {
            for(let r2=-1;r2<=1;r2+=2) {
                for(let r3=-1;r3<=1;r3+=2) {
                    coords.push([i*r1, b*r2, b*r3]);
                    coords.push([b*r1, i*r2, b*r3]);
                    coords.push([b*r1, b*r2, i*r3]);
                }
            }
        }
    }
    return coords;
}

/**
 * enumerate the coordinates of n-cube inner pieces
 * @param {int} n 
 * @returns {Array}
 */
C3CubeUtil.prototype.enum_inner = function(n) {
    var a = (n+1)%2;
    var b = math.floor(n/2);
    var a1 = a;
    var coords = [];

    if(a==0) {
        a1 = a+1;
        for(let r1=-1;r1<=1;r1+=2) { // 2 zero
            coords.push([b*r1, 0, 0]);
            coords.push([0, b*r1, 0]);
            coords.push([0, 0, b*r1]);
        }
        for(let i=a1;i<b;i++){ // 1 zero
            for(let r1=-1;r1<=1;r1+=2) {
                for(let r2=-1;r2<=1;r2+=2) {
                    coords.push([0, b*r1, i*r2]);
                    coords.push([0, i*r2, b*r1]);
                    coords.push([b*r1, 0, i*r2]);
                    coords.push([i*r2, 0, b*r1]);
                    coords.push([b*r1, i*r2, 0]);
                    coords.push([i*r2, b*r1, 0]);
                }
            }
        }
    }

    for(let i=a1;i<b;i++) {
        for(let j=a1;j<b;j++) {
            for(let r1=-1;r1<=1;r1+=2) {
                for(let r2=-1;r2<=1;r2+=2) {
                    for(let r3=-1;r3<=1;r3+=2) {
                        coords.push([b*r1, i*r2, j*r3]);
                        coords.push([i*r1, b*r2, j*r3]);
                        coords.push([i*r1, j*r2, b*r3]);
                    }
                }
            }
        }
    }
    return coords;
}

/**
 * enumerate the coordinates of n-cube axies pieces
 * @param {int} n
 * @param {int} axis
 * @param {int} l
 * @returns {Array}
 */
C3CubeUtil.prototype.enum_axis = function(n, axis, l) {
    var a = (n+1)%2;
    var b = math.floor(n/2);
    var a1 = a;
    var coords = [];
    var p = [0, 0, 0];

    if(a==0) {
        a1 = a+1;
        if(axis==0) p=[l, 0, 0]; // 2 zero
        else if(axis==1) p=[0, l, 0];
        else if(axis==2) p=[0, 0, l];
        if(this.valid_pos(n, p)) coords.push(p);

        for(let i=a1;i<=b;i++) { // 1 zero
            for(let r1=-1;r1<=1;r1+=2) {
                if(axis==0) {
                    p = [l, 0, i*r1];
                    if(this.valid_pos(n, p)) coords.push(p);
                    p = [l, i*r1, 0];
                    if(this.valid_pos(n, p)) coords.push(p);
                }
                else if(axis==1) {
                    p = [i*r1, l, 0];
                    if(this.valid_pos(n, p)) coords.push(p);
                    p = [0, l, i*r1];
                    if(this.valid_pos(n, p)) coords.push(p);
                }
                else if(axis==2) {
                    p = [i*r1, 0, l];
                    if(this.valid_pos(n, p)) coords.push(p);
                    p = [0, i*r1, l];
                    if(this.valid_pos(n, p)) coords.push(p);
                }
            }
        }
    }

    for(let i=a1;i<=b;i++) {
        for(let j=a1;j<=b;j++) {
            for(let r1=-1;r1<=1;r1+=2) {
                for(let r2=-1;r2<=1;r2+=2) {
                    p = [0, 0, 0];
                    if(axis==0) p = [l, i*r1, j*r2];
                    else if(axis==1) p = [i*r1, l, j*r2];
                    else if(axis==2) p = [i*r1, j*r2, l];
                    if(this.valid_pos(n, p)) coords.push(p);
                }
            }
        }
    }

    return coords;
}

/**
 * calculate the distance between two cubes 
 * according to the position and orientation 
 * @param {C3Cube} c1 
 * @param {C3Cube} c2 
 */
C3CubeUtil.prototype.dist_cube = function(c1, c2) {
    var coors = this.diff_cube(c1, c2);
    var x, y, z;
    var u1, u2;
    var d = 0;
    for(let i in coors) {
        x = coors[i][0]; y = coors[i][1]; z = coors[i][2]
        u1 = c1.pieces[x][y][z]; u2 = c2.pieces[x][y][z];
        d += this.dist_pieces(u1, u2);
    }
    return d;
}

/**
 * calculate the distance between two cubes 
 * according to the coorespond position color
 * @param {C3Cube} c1 
 * @param {C3Cube} c2 
 * @returns 
 */
C3CubeUtil.prototype.dist_cube2 = function(c1, c2) {
    if(c1.order!=c2.order) throw new Error("cube order must be the same order");
    var n = c1.order;
    var coords = this.enum_all(n);
    var pieces1 = [], pieces2 = [];
    for (let idx in coords) {
        var p = coords[idx];
        var u1 = c1.pieces[p[0]][p[1]][p[2]];
        var u2 = c2.pieces[p[0]][p[1]][p[2]];
        var p1 = [u1.p.get([0, 0]), u1.p.get([1, 0]),  u1.p.get([2, 0])];
        var p2 = [u2.p.get([0, 0]), u2.p.get([1, 0]),  u2.p.get([2, 0])];
        pieces1[this.encode_pos(n, p1)] = u1;
        pieces2[this.encode_pos(n, p2)] = u2;
    }

    var d = 0;
    for (let idx in coords) {
        var p = coords[idx];
        var u1 = pieces1[this.encode_pos(n, p)];
        var u2 = pieces2[this.encode_pos(n, p)];
        d += this.dist_pieces2(u1, u2);
    }
    return d;
}

/**
 *  calculate the different status piece between two cubes
 * @param {C3Cube} c1 
 * @param {C3Cube} c2 
 * @return {Array{C3CubePiece}} 
 */
C3CubeUtil.prototype.diff_cube = function(c1, c2) {
    if(c1.order!=c2.order) throw new Error("cube order must be the same order");

    var coords = this.enum_all(c1.order);
    var diffs = [];
    var x, y, z;
    var u1, u2;
    for(let idx in coords) {
        x = coords[idx][0]; y = coords[idx][1]; z = coords[idx][2];
        u1 = c1.pieces[x][y][z]; u2 = c2.pieces[x][y][z];
        if(!math.deepEqual(u1.p, u2.p) || !math.deepEqual(u1.o, u2.o)) {
            diffs.push([x, y, z]);
        }
    }
    return diffs;
}

/**
 *  calculate the distance between two cube piece
 * @param {C3CubePiece} u1 
 * @param {C3CubePiece} u2 
 */
C3CubeUtil.prototype.dist_pieces = function(u1, u2) {
   var t1 = math.subtract(math.sign(u2.p), math.sign(u1.p));
   var t2 = math.subtract(math.sign(u2.o), math.sign(u1.o));
   var d1 = math.sqrt(math.multiply(math.transpose(t1), t1).get([0,0]));
   var d2 = math.sqrt(math.multiply(math.transpose(t2), t2).get([0,0]));
   return d1 + d2;
}

/**
 *  calculate the distance between two piece in same position
 * @param {C3CubePiece} u1 
 * @param {C3CubePiece} u2 
 */
C3CubeUtil.prototype.dist_pieces2 = function(u1, u2) {
    if(!math.deepEqual(u1.p, u2.p)) throw new Error("piece must be in same position");
    return (u1.c[0]!=u2.c[0]) + (u1.c[1]!=u2.c[1]) + (u1.c[2]!=u2.c[2]);
 }

export {C3Cube, C3CubePiece, C3CubeUtil}