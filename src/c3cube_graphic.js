"use strict";

/**
 * c3cube_graphic.js, cube render implementation
 *   v0.2, developed by devseed
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { C3Cube, C3CubeUtil } from "./c3cube_core.js";

function glcoord(canvas, x, y) {
    var w = parseInt(canvas.style.width.replace("px", ""));
    var h = parseInt(canvas.style.height.replace("px", ""));
    var rect = canvas.getBoundingClientRect();
    x -= rect.left;
    y -= rect.top; // open gl is left-hand coordinate
    return new THREE.Vector2(2*x/w - 1, -2*y/h + 1);
}

/**
 * @param {C3Cube} c3core
 * @param {HTMLCanvasElement} canvas 
 */
const C3CubeGraphic = function(c3core, canvas) {
    // init render
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
    this.camera =  new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000 );
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.up.set(0, 0, 1); // z axis up
    this.params_animate_operate = {interval: 300, 
        clock: null, targets: [], reverse: false, axis: 0, l: 0};

    // init cube model
    this.c3core = c3core;
    this.c3obj = null;
    this.apply_c3cube(this.c3core);

    // init control
    this.intersect_c3piece = null;
    this.raycaster = new THREE.Raycaster();
    this.contorl_orbits = new OrbitControls(this.camera, canvas);
    this._init_events();
}

/**
 * make c3cube rendering project according to the c3cube status
 * @param {C3Cube} c3core 
 * @returns {THREE.Group}
 */
C3CubeGraphic.prototype.create_c3obj = function(c3core){
    const a = c3core.imin;
    const n = c3core.order;
    const d = n <= 6 ? 0.94 : 0.9;
    const c3obj = new THREE.Group();
    const geometry = new THREE.BoxGeometry(d, d, d);
    const cmap = this.colormap
    const cmapr = c3core.colormapr;

    for(let idx in c3core.pieces) {
        var piece = c3core.pieces[idx];
        var p = piece.p, o = piece.o, c = piece.c;
        var materials = []; // front->R, back->O,  right->Y, left->W, up->B, down->G
        if(o[0]>0) materials[0] = new THREE.MeshBasicMaterial({color: cmap[cmapr[c[0]]]});
        else materials[1] = new THREE.MeshBasicMaterial({color: cmap[cmapr[c[0]]]});
        if(o[1]>0) materials[2] = new THREE.MeshBasicMaterial({color: cmap[cmapr[c[1]]]});
        else materials[3] = new THREE.MeshBasicMaterial({color: cmap[cmapr[c[1]]]});
        if(o[2]>0) materials[4] = new THREE.MeshBasicMaterial({color: cmap[cmapr[c[2]]]});
        else materials[5] = new THREE.MeshBasicMaterial({color: cmap[cmapr[c[2]]]});
        for(let i=0;i<6;i++) {
            if(!materials[i]) materials[i] = new THREE.MeshBasicMaterial({color: cmap[0]});
        }

        var mesh = new THREE.Mesh(geometry, materials);
        var r = [a==0 ? 0: -0.5*math.sign(p[0]), 
            a==0 ? 0: -0.5*math.sign(p[1]), 
            a==0 ? 0: -0.5*math.sign(p[2])];
        mesh.position.set(p[0]+r[0], p[1]+r[1], p[2]+r[2]);
        mesh.name = this.NAME_C3PIECE;
        c3obj.add(mesh);
    }
    return c3obj;
}

/**
 * apply the c3cube status on the scene
 * @param {C3Cube} c3core 
 */

C3CubeGraphic.prototype.apply_c3cube = function(c3core) {
    // create c3 rendering object
    this.c3obj = this.create_c3obj(c3core);
    this.scene = new THREE.Scene();
    this.scene.add(this.c3obj);
    
    // adjust length
    const n = this.c3core.order;
    const b = this.c3core.imax;
    var d = n<=5 ? 3*b: 2*b; 
    this.camera.position.set(d, d, d);
    const axeshelper = new THREE.AxesHelper(10*b);
    axeshelper.setColors(this.colormap[2], this.colormap[4], this.colormap[6]);
    this.scene.add(axeshelper);
}

C3CubeGraphic.prototype.push_operate = function(axis, l, reverse=false) {
    if(this.operate(axis, l, reverse, false)) {
        this.c3core.push_operate(axis, l);
        if(reverse) {
            this.c3core.push_operate(axis, l);
            this.c3core.push_operate(axis, l);
        }
        return true;
    }
    return false;
}

C3CubeGraphic.prototype.pop_operate = function() {
    var F = this.c3core.pop_operate(true);
    if(F==null) return false;
    if(this.operate(F[0], F[1], true, false)) {
        this.c3core.pop_operate();
    }
    return false;
}

C3CubeGraphic.prototype.operate = function(axis, l, reverse=false, update_c3core=true) {
    var params = this.params_animate_operate;
    if(params.clock) {
        console.log("can't operate while last operate animate not finished!");
        return false;
    }

    var a = this.c3core.imin;
    params.targets = [];
    params.axis = axis;
    params.l = l;
    params.reverse = reverse;
    this.c3obj.traverse((obj)=>{
        if(obj.name!=this.NAME_C3PIECE) return;
        var p = [obj.position.x, obj.position.y, obj.position.z];
        var r = [a==0 ? 0: -0.5*math.sign(p[0]), 
            a==0 ? 0: -0.5*math.sign(p[1]), 
            a==0 ? 0: -0.5*math.sign(p[2])];
        if(math.equal(parseInt(math.round(p[axis] - r[axis])), l)) {
            params.targets.push({mesh:obj, 
                p: obj.position.clone(), q:obj.quaternion.clone()});
        }
    });
    params.clock = new THREE.Clock();
    if(update_c3core) {
        this.c3core.operate(axis, l);
        if(reverse) {
            this.c3core.operate(axis, l);
            this.c3core.operate(axis, l);
        }
    }
    return true;
}

C3CubeGraphic.prototype.request_frame = function() {
    if(this.params_animate_operate.clock) {
        this._animate_operate();
    }
    else {
        this.contorl_orbits.update();
    }
    this.renderer.render(this.scene, this.camera);
}

C3CubeGraphic.prototype._init_events = function() {
    const _on_mousedown = (e)=> {
        if(this.params_animate_operate.clock) return;
        var coord = glcoord(this.canvas, e.clientX, e.clientY); 
        this.raycaster.setFromCamera(coord, this.camera);
        var intersects = this.raycaster.intersectObjects(this.c3obj.children);
        if(intersects[0]) {
            this.contorl_orbits.enabled = false;
            this.intersect_c3piece = intersects[0];
        }
        else {
            this.intersect_c3piece = null;
        }
    }
    const  _on_mouseup = (e) => {
        this.contorl_orbits.enabled = true;
        if(this.params_animate_operate.clock) return;
        if(this.intersect_c3piece) {
            // use raycaster to find interact meshes
            var coord = glcoord(this.canvas, e.clientX, e.clientY); 
            this.raycaster.setFromCamera(coord, this.camera);
            var intersects = this.raycaster.intersectObjects(this.c3obj.children);
            if(intersects[0]) {
                // calculate the axis according to face normal and vector between start and end
                var axis = -1, reverse = false;
                var obj1 = this.intersect_c3piece.object;
                var obj2 = intersects[0].object;
                var normal = this.intersect_c3piece.normal.clone().transformDirection(obj1.matrixWorld).normalize();
                var vec = obj2.position.clone().sub(obj1.position);
                var normal2 = normal.clone().cross(vec).normalize();
                if(math.abs(normal2.x) > 0.01) {axis = 0; reverse=(normal2.x < 0)}
                else if(math.abs(normal2.y) > 0.01) {axis = 1; reverse=(normal2.y < 0)}
                else if(math.abs(normal2.z) > 0.01) {axis = 2; reverse=(normal2.z < 0)}
                else axis = -1;

                // calculate the position to operate
                var a = this.c3core.imin;
                if(axis >= 0) {
                    var p1 = [obj1.position.x,  obj1.position.y, obj1.position.z];
                    var r1 = [a==0 ? 0: -0.5*math.sign(p1[0]), 
                    a==0 ? 0: -0.5*math.sign(p1[1]), 
                    a==0 ? 0: -0.5*math.sign(p1[2])];
                    p1 = math.subtract(p1, r1);
                    // console.log("normal:", normal, "vec:", vec, "normal2:", normal2, "p1:", p1, "axis:", axis);
                    this.push_operate(axis, parseInt(math.round(p1[axis])), reverse);
                }
            }
        }
        this.intersect_c3piece = null;
    }
    this.canvas.onmousedown = _on_mousedown;
    this.canvas.onmouseup = _on_mouseup;
} 

C3CubeGraphic.prototype._animate_operate = function() {
    var params = this.params_animate_operate;
    var interval = params.clock.getElapsedTime ()*1000;
    var theta = math.pi/2 * (params.reverse ? -1: 1);
    if(interval >= params.interval) params.clock = null;
    else theta *= interval/params.interval;
    
    var M = new THREE.Matrix4();
    if(params.axis==0) M.makeRotationX(theta);
    if(params.axis==1) M.makeRotationY(theta);
    if(params.axis==2) M.makeRotationZ(theta);
    for(let idx in params.targets) { 
        // reset position for decrese accumulated error
        var target = params.targets[idx];
        target.mesh.position.copy(target.p);
        target.mesh.quaternion.copy(target.q);
        target.mesh.applyMatrix4(M);
    }
}

/**
 * colormap, as {coloridx(x, y, z): c}, 
 * b|(-1,0,0)|1->O, f|(1,0,0)|2->R, l|(0,-1,0)|3->W, 
 * r(0,1,0)|4->Y, d|(0,0,-1)|5->G, u|(0,0,1)|6->B
*/
C3CubeGraphic.prototype.colormap = 
    {0:"#CDC9C9", 1:"#FFA500", 2:'#FF3030', 3:'#FFFFFF', 
    4:'#FFFF00', 5: '#ADFF2F', 6:'#00BFFF'}

C3CubeGraphic.prototype.NAME_C3PIECE = "c3piece";

export {C3CubeGraphic}

/**
 * history: 
 *   v0.1, initial version with cube rendering
 *   v0.2, add controls by mouse to operate on cube
 */