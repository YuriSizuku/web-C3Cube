"use strict";

const C3Cube = function(n) {
    if(n<3) throw new Error("cube order must bigger than 3");
    this.order = n;
    this.imin = (n+1)%2;
    this.imax = math.floor(n/2);
    this.nstatus = n*n*n - (n-2)*(n-2)*(n-2);
    this.ncorner = 8;
    this.nedge = 12*(n-2);
    this.ninner = 6*(n-2)*(n-2);
    this.operates = []
    this.status = this.init_status();
}

C3Cube.prototype.init_status = function() {
    var a = this.imin;
    var b = this.imax;
    var cmap = this.colormap;
    var status = [];
    for(let i=-b;i<=b;i++) {
        status[i] = [];
        for(let j=-b;j<=b;j++) {
            status[i][j] = []
            for(let k=-b;k<=b;k++) {
                status[i][j][k] = null;
            }
        }
    }

    // corner unit, 8
    status[b][b][b] = new C3CubeUnit([b,b,b], [1,1,1], [cmap[2],cmap[4],cmap[6]]);
    status[-b][b][b] = new C3CubeUnit([-b,b,b], [-1,1,1], [cmap[1],cmap[4],cmap[6]]);
    status[-b][-b][b] = new C3CubeUnit([-b,-b,b], [-1,-1,1], [cmap[1],cmap[3],cmap[6]]);
    status[b][-b][b] = new C3CubeUnit([b,-b,b], [1,-1,1], [cmap[2], cmap[3], cmap[6]]);
    status[b][b][-b] = new C3CubeUnit([b,b,-b], [1,1,-1], [cmap[2], cmap[4], cmap[5]]);
    status[-b][b][-b] = new C3CubeUnit([-b,b,-b], [-1,1,-1], [cmap[1], cmap[4], cmap[5]]);
    status[-b][-b][-b]= new C3CubeUnit([-b,-b,-b], [-1,-1,-1], [cmap[1], cmap[3], cmap[5]]);
    status[b][-b][-b] = new C3CubeUnit([b,-b,-b], [1,-1,-1], [cmap[2], cmap[3], cmap[5]]);

    // edge unit, 12(n-2)
    for(let i=a;i<b;i++) {
        for(let rx=-1;rx<=1;rx+=2) {
            for(let ry=-1;ry<=1;ry+=2) {
                for(let rz=-1;rz<=1;rz+=2) {
                    status[i*rx][b*ry][b*rz] = new C3CubeUnit( [i*rx,b*ry,b*rz], [i==0 ? 1:rx,ry,rz], 
                        [cmap[0], cmap[this.color_idx([0, ry, 0])], cmap[this.color_idx([0, 0, rz])]]);
                    status[b*rx][i*ry][b*rz] = new C3CubeUnit( [b*rx,i*ry,b*rz], [rx,i==0 ? 1: ry,rz], 
                        [cmap[this.color_idx([rx, 0, 0])], cmap[0], cmap[this.color_idx([0, 0, rz])]]);
                    status[b*rx][b*ry][i*rz] = new C3CubeUnit( [b*rx,b*ry,i*rz], [rx,ry,i==0 ? 1: rz], 
                        [cmap[this.color_idx([rx, 0, 0])], cmap[this.color_idx([0, ry, 0])], cmap[0]]);
                }
            }
        }
    }

    // inner unit, 6(n-2)(n-2)
    for(let i=a;i<b;i++) {
        for(let j=a;j<b;j++) {
            for(let rx=-1;rx<=1;rx+=2) {
                for(let ry=-1;ry<=1;ry+=2) {
                    for(let rz=-1;rz<=1;rz+=2) {
                        status[b*rx][i*ry][j*rz] = new C3CubeUnit( [b*rx,i*ry,j*rz], 
                            [rx, i==0 ? 1: ry, j==0 ? 1: rz], 
                            [cmap[0], cmap[this.color_idx([rx, 0, 0])], cmap[0]]);
                        status[i*rx][b*ry][j*rz] = new C3CubeUnit( [i*rx,b*ry,j*rz], 
                            [i==0 ? 1: rx, ry, j==0 ? 1: rz], 
                            [cmap[0], cmap[this.color_idx([0, ry, 0])], cmap[0]]);
                        status[i*rx][j*ry][b*rz] = new C3CubeUnit( [i*rx,j*ry,b*rz], 
                            [i==0 ? 1: rx, j==0 ? 1: ry, rz], 
                            [cmap[0], cmap[this.color_idx([0, 0, rz])], cmap[0]]);
                    }
                }
            }
        }
    }
    return status
}

C3Cube.prototype.print_status = function() {
    var b = this.imax;
    var status = this.status;

    console.log(`C3Cube order=${this.order}, corner=${this.ncorner}, edge=${this.nedge}, inner=${this.ninner}`);
    for(let i=-b;i<=b;i++) {
        for(let j=-b;j<=b;j++){
            for(let k=-b;k<=b;k++){
                if(status[i][j][k]==null) continue;
                status[i][j][k].print_status();
            }
        }
    }
}

C3Cube.prototype.print_operates = function() {

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
    var status = this.status;
    var a1 = a;
    if(a==0) a1 = a+1;
    for(let i=a1;i<=b;i++) {
        for(let j=a1;j<=b;j++) {
            for(let r1=-1;r1<=1;r1+=2) {
                for(let r2=-1;r2<=1;r2+=2) {
                    var t = null;
                    if(axis==0) t = status[l][i*r1][j*r2];
                    else if(axis==1) t = status[i*r1][l][j*r2];
                    else if(axis==2) t = status[i*r1][j*r2][l];
                    if(t!=null) {
                        // console.log(t)
                        t.operate(axis)
                    }
                }
            }
        }
    }
    if(a==0) { // with center piece
        if(axis==0) t = status[l][0][0];
        else if(axis==1) t = status[0][l][0];
        else if(axis==2) t = status[0][0][l];
        if(t!=null) {
            // console.log(t);
            t.operate(axis);
        }

        for(let i=a1;i<=b;i++) {
            for(let r1=-1;r1<=1;r1+=2) {
                for(let r2=-1;r2<=1;r2+=2) {
                    var t = null;
                    if(axis==0) t = status[l][i*r1][0];
                    else if(axis==1) t = status[i*r1][l][0];
                    else if(axis==2) t = status[i*r1][0][l];
                    if(t!=null) {
                        // console.log(t)
                        t.operate(axis)
                    }
                }
            }
        }
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

/** coloridx x(x, y, z) = 
* [(3, 7, 11) + (x, y, z)]*|(x, y, z)^T| /2
* @param {Array} o, axis orientation, like (0, 0, 1)
*/
C3Cube.prototype.color_idx = function(o) {
    var ta = math.add([3, 7, 11], o);
    var tb = math.abs(o);
    return math.dot(ta, tb)/2;
}

/**
 * @param {Array} p, position vector (1, 1, 1)
 * @param {Array} o, oritation vector, like (1, 1, 1) * (i, j, k)
 * @param {Array} c, color vector, like ('R', 'Y', 'B')
 * @param {Array} p0, the origin coordinate
 */
const C3CubeUnit = function(p, o, c, p0=null) {
    var ijkbase = this.ijkbase;
    this.p = math.transpose(math.matrix([p]));
    this.o = math.transpose(math.matrix([[ijkbase[0]*o[0], ijkbase[1]*o[1], ijkbase[2]*o[2]]]));
    this.c = c;
    this.p0 = p0;
    if(p0==null) {
        this.p0 = math.transpose(math.matrix([p]));
    }
    // console.log(p, o, c);
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
])]
C3CubeUnit.prototype.T = _T;
C3CubeUnit.prototype.T3 = [
    math.inv(_T[0]), 
    math.inv(_T[1]),
    math.inv(_T[2])
]
C3CubeUnit.prototype.ijkbase = [1, 2, 3]

C3CubeUnit.prototype.print_status = function() {
    var p0 = math.transpose(this.p0)._data[0];
    var p = math.transpose(this.p)._data[0];
    var o = math.sign(math.transpose(this.o))._data[0];
    var c = this.c;
    // console.log(p0, p, o, c);
    console.log(`(${p0[0]}, ${p0[1]}, ${p0[2]}): (${p[0]}, ${p[1]}, ${p[2]}), (${o[0]}, ${o[1]}, ${o[2]}), (${c[0]}, ${c[1]}, ${c[2]}))`);
}

C3CubeUnit.prototype.operate = function(axis) {
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

const C3CubeUtil = function() {

}

/**
 *  load the encodes operate str
 * @param {String} operate_str 
 * @returns {Array} operates
 */
C3CubeUtil.prototype.load_operates = function(operate_str)  {
    var operates = [];
    return operates;
}

/**
 *  dump the operate sequence to str
 * @param {*} operates 
 * @returns {string} operate_str
 */
C3CubeUtil.prototype.dump_operates = function(operates) {
    var operate_str = "";
    return operate_str;
}

/**
 *  calculate the distance between two cubes
 * @param {C3Cube} c1 
 * @param {C3Cube} c2 
 */
C3CubeUtil.prototype.cube_dist = function(c1, c2) {
    if(c1.order!=c2.order) throw new Error("cube order must be the same to compare");
    var a = c1.imin;
    var b = c1.imax;
}


/**
 *  calculate the different status piece between two cubes
 * @param {C3Cube} c1 
 * @param {C3Cube} c2 
 * @return {Array{C3CubeUnit}} 
 */
C3CubeUtil.prototype.cube_diff = function(c1, c2) {

}

/**
 *  calculate the distance between two cube unit
 * @param {C3CubeUnit} u1 
 * @param {C3CubeUnit} u2 
 */
C3CubeUtil.prototype.unit_dist = function(u1, u2) {

}


export {C3Cube, C3CubeUnit, C3CubeUtil}