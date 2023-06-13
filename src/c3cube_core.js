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
    var a = this.imin;
    var b = this.imax;
    this.status = [];
    for(let i=this.imax;i<=this.imax;i++) {
        this.status[i] = [];
        for(let j=-this.imax;j<=this.imax;j++){
            this.status[i][j] = []
            for(let k=-this.imax;k<=this.imax;k++){
                this.status[i][j][k] = null;
            }
        }
    }

    // corner unit
    for(let rx=-1;rx<=1;rx+=2){
        for(let ry=-1;ry<=1;ry+=2) {
            for(let rz=-1;rz<=1;rz+=2) {
                this.status[b*rx][b*ry][b*rz];
            }
        }
    }
    this.status[b][b][b];
    this.status[-b][b][b];
    this.status[-b][-b][b];
    this.status[b][-b][b];
    this.status[b][b][-b];
    this.status[-b][b][-b];
    this.status[-b][-b][-b];
    this.status[b][-b][-b];

    // edge unit
    for(let i=a;i<b;i++) {
        for(let rx=-1;rx<=1;rx+=2){
            for(let ry=-1;ry<=1;ry+=2) {
                for(let rz=-1;rz<=1;rz+=2) {
                    this.status[i*rx][b*ry][b*rz];
                    this.status[b*rx][i*xy][b*rz];
                    this.status[b*rx][b*ry][i*rz];
                }
            }
        }
    }

    // inner unit
    for(let i=a;i<b;i++) {
        for(let j=a;j<b;j++){
            for(let rx=-1;rx<=1;rx+=2){
                for(let ry=-1;ry<=1;ry+=2) {
                    for(let rz=-1;rz<=1;rz+=2) {
                        this.status[b*rx][i*ry][j*rz];
                        this.status[i*rx][b*xy][j*rz];
                        this.status[i*rx][j*ry][b*rz];
                    }
                }
            }
        }
    }
}

C3Cube.prototype.operate = function(axis, i, c=1) {

} 

C3Cube.prototype.colormap = 1;

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

// transfor matrix
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
])]
C3CubeUnit.prototype.T = _T;
C3CubeUnit.prototype.T3 = [
    math.inv(_T[0]), 
    math.inv(_T[1]),
    math.inv(_T[2])
]
// encode i, j, k to 2, 3, 5
C3CubeUnit.prototype.ijk = [2, 3, 5]

C3CubeUnit.operate = function(axis) {
    // position transter
    this.p = math.multiply(T3[axis], this.p);
    
    // before orientation transfer
    var M = math.identity([3, 3]) * math.sign(this.o);
    this.o = math.multiply(M, this.o);
    this.o = math.multiply(T[axis], this.o);
    this.o = math.multiply(M, this.o);

    // after orientation transfer, permute i, j, k
    for(let i=0;i<3;i++){
        for(let j=i;j<3;j++){
            if(this.o._data[i] > this.o._data[j]) {
                let tmp = this.o._data[i];
                this.o._data[i] = this.o._data[j];
                this.o._data[j] = tmp;

                tmp = this.c[i];
                this.c[i] = this.c[j]
                this.c[j] = tmp;
            }
        }
    }
} 

export {C3Cube, C3CubeUnit}