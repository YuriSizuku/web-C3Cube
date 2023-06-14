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
    var cmap = this.colormap;
    var p, o, c;
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

    for(let rx=-1;rx<=1;rx+=2){
        for(let ry=-1;ry<=1;ry+=2) {
            for(let rz=-1;rz<=1;rz+=2) {
                this.status[b*rx][b*ry][b*rz];
            }
        }
    }

    // corner unit
    this.status[b][b][b] = new C3CubeUnit((b,b,b), (1,1,1), (cmap[1],cmap[3],cmap[5]));
    this.status[-b][b][b] = new C3CubeUnit((-b,b,b), (-1,1,1), (cmap[0],cmap[3],cmap[5]));
    this.status[-b][-b][b] = new C3CubeUnit((-b,-b,b), (-1,-1,1), (cmap[0],cmap[2],cmap[5]));
    this.status[b][-b][b] = new C3CubeUnit((b,-b,b), (1,1,1), (cmap[1], cmap[3], cmap[5]));
    this.status[b][b][-b] = new C3CubeUnit((b,b,-b), (1,1,1), (cmap[1], cmap[3], cmap[5]));
    this.status[-b][b][-b] = new C3CubeUnit((-b,b,-b), (1,1,1), (cmap[1], cmap[3], cmap[5]));
    this.status[-b][-b][-b]= new C3CubeUnit((-b,-b,-b), (1,1,1), (cmap[1], cmap[3], cmap[5]));
    this.status[b][-b][-b] = new C3CubeUnit((b,-b,-b), (1,1,1), (cmap[1], cmap[3], cmap[5]));

    // edge unit
    for(let i=a;i<b;i++) {
        for(let rx=-1;rx<=1;rx+=2){
            for(let ry=-1;ry<=1;ry+=2) {
                for(let rz=-1;rz<=1;rz+=2) {
                    let p = [i*rx]
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

/**
 * colormap, as {f(x, y, z): c}, 
 * [(3, 5, 9) + (x, y, z)]*|(x, y, z)^T| /2
 * b|(-1,0,0)|0->O, f|(1,0,0)|1->R, l|(0,-1,0)|2->W, 
 * r(0,1,0)|3->Y, d|(0,0,-1)|4->G, u|(0,0,1)|5->B, 
 */
C3Cube.prototype.colormap = {
    0:'O', 1:'R', 2:'w', 3:'Y', 4: 'G', 5:'B'
};

/**
 * @param {Array} p, position vector (1, 1, 1)
 * @param {Array} o, oritation vector, like (1, 1, 1) * (i, j, k)
 * @param {Array} c, color vector, like ('R', 'Y', 'B')
 */
const C3CubeUnit = function(p, o, c) {
    this.p = math.transpose(p);
    this.o = math.transpose([this.ijk[0]*o[0], this.ijk[1]*o[1], this.ijk[2]*c[2]]);
    this.c = c;
}

/**  
 * transfor matrix
 */
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
/** 
 * ijk base encoding, i<j<k
 */ 
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
            if(math.abs(this.o._data[i]) > math.abs(this.o._data[j])) {
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