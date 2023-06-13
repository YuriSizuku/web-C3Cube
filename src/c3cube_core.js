"use strict";
const C3Cube = function(n) {
    if(n<3) throw new Error("cube order must bigger than 3");
    
    // init parameters
    this.order = n;
    this.imin = (n+1)%2;
    this.imax = math.floor(n/2);
    this.nstatus = n*n*n - (n-2)*(n-2)*(n-2);
    this.ncorner = 8;
    this.nedge = 4*n*(n-2);
    this.ncenter = 2*n*(n-2);
    
    // init statues
    this.status = Array(this.nstatus);
    this.status_map;
    this.status_rmap;
}

C3Cube.prototype.init = function() {
    this.status = [];
    for(let i=0; i<this.n;i++) {

    }
} 

C3Cube.prototype.operate = function(axis, i, c=1) {

} 

/**
 * @param {Array} p, position vector (1, 1, 1)
 * @param {Array} o, oritation vector, like (1, 1, 1) * (i, j, k)
 * @param {Array} c, color vector, like ('R', 'Y', 'B')
 * */
const C3CubeUnit = function(p, o, c) {
    this.p = math.transpose(p);
    this.o = math.transpose([this.ijk[0]*o[0], this.ijk[1]*o[1], this.ijk[2]*c[2]]);
    this.c = c;
}

C3CubeUnit.prortotype.T = [math.matrix([
    [1, 0, 0],
    [0, 0, 1],
    [0,-1, 0]
]), math.matrix([
    [0, 0,-1], 
    [0, 1, 0],
    [1, 0, 0]
]), math.matrix([
    [ 0, 1, 0]
    [-1, 0, 0]
    [ 0, 0, 1]
])]

C3CubeUnit.prortotype.T3 = [
    math.inv(this.T[0]), 
    math.inv(this.T[1]),
    math.inv(this.T[2])
]

// encode i, j, k to 2, 3, 5
C3CubeUnit.prortotype.ijk = [2, 3, 5]


C3CubeUnit.operate = function(axis) {
    // position transter
    this.p = math.multiply(T3[axis], this.p);
    
    // before orientation transfer
    var M = math.identity([3, 3]) * math.sign(this.o);
    this.o = math.multiply(M, this.o);
    this.o = math.multiply(T[axis], this.o);
    this.o = math.multiply(M, this.o);

    // after orientation transfer, permute i, j, k
} 

export {C3Cube, C3CubeUnit}