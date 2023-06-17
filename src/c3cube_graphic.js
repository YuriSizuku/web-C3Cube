"use strict";

/**
 * c3cube_graphic.js, cube render implementation
 *   v0.1, developed by devseed
 */

import * as THREE from 'three'
import { Quaternion, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { C3Cube, C3CubeUtil } from "./c3cube_core.js";

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
    this.contorl_orbits = new OrbitControls(this.camera, canvas);
    this.params_animate_operate = {interval: 500, 
        clock: null, targets: [], axis: 0, l: 0};

    // init cube model
    this.c3core = c3core;
    this.c3obj = null;
    this.apply(this.c3core);

    // init event
    this.canvas.onmousedown = (e)=>{
        // this.contorl_orbits.enabled = false;
    };
    this.canvas.onmouseup = (e)=>{
        // this.contorl_orbits.enabled = true;
    };
}

/**
 * make c3cube rendering project according to the c3cube status
 * @param {C3Cube} c3core 
 * @returns {THREE.Group}
 */
C3CubeGraphic.prototype.create_c3obj = function(c3core){
    const a = c3core.imin;
    const c3obj = new THREE.Group();
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
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
        c3obj.add(mesh);
    }
    return c3obj;
}

/**
 * apply the c3cube status on the scene
 * @param {C3Cube} c3core 
 */

C3CubeGraphic.prototype.apply = function(c3core) {
    // create c3 rendering object
    this.c3obj = this.create_c3obj(c3core);
    this.scene = new THREE.Scene();
    this.scene.add(this.c3obj);
    
    // adjust length
    const b = this.c3core.imax;
    this.camera.position.set(2*b, 2*b, 2*b);
    const axeshelper = new THREE.AxesHelper(10*b);
    axeshelper.setColors(this.colormap[2], this.colormap[4], this.colormap[6]);
    this.scene.add(axeshelper);
}

C3CubeGraphic.prototype.operate = function(axis, l) {
    if(this.params_animate_operate.clock) {
        console.log("can't operate while last operate animate not finished!");
        return;
    }
    var a = this.c3core.imin;
    this.params_animate_operate.targets = [];
    this.params_animate_operate.axis = axis;
    this.params_animate_operate.l = l;
    this.c3obj.traverse((obj)=>{
        var p = [obj.position.x, obj.position.y, obj.position.z];
        var r = [a==0 ? 0: -0.5*math.sign(p[0]), 
            a==0 ? 0: -0.5*math.sign(p[1]), 
            a==0 ? 0: -0.5*math.sign(p[2])];
        if(math.equal(p[axis] - r[axis], l)) {
            var p = new Vector3();
            p.copy(obj.position);
            var q = new Quaternion();
            q.copy(obj.quaternion);
            this.params_animate_operate.targets.push({mesh:obj, p: p, q:q});
        }
    });
    this.params_animate_operate.clock = new THREE.Clock();
    this.c3core.operate(axis, l);
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

C3CubeGraphic.prototype._animate_operate = function() {
    var params = this.params_animate_operate;
    var interval = params.clock.getElapsedTime ()*1000;
    var theta = math.pi/2;
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

export {C3CubeGraphic}