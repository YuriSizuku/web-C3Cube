"use strict";

/**
 * c3cube_graphic.js, cube render implementation
 *   v0.1, developed by devseed
 */

import * as THREE from 'three'
import { C3Cube, C3CubeUtil } from "./c3cube_core.js";

/**
 * 
 * @param {int} n 
 * @param {HTMLCanvasElement} canvas 
 */
const C3CubeGraphic = function(n, canvas) {
    // init cube model
    const c3cube = new C3Cube(n);
    const a = c3cube.imin;
    const b = c3cube.imax;

    // init scene
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha:true});
    const camera =  new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000 );
    camera.up.set(0, 0, 1); // z axis up
    camera.position.set(2*b, 2*b, 2*b);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // init cube graphic
    this.c3cube = c3cube;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.meshes = this.init_meshes();
    for(let idx in this.meshes) {
        scene.add(this.meshes[idx]);
    }
    scene.add(new THREE.AxesHelper(10*b));
}

C3CubeGraphic.prototype.init_meshes = function(){
    var n = this.c3cube.order;
    var a = this.c3cube.imin;
    var coords = (new C3CubeUtil()).enum_all(n);
    var meshes = [];
    var geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    var materials = [
        new THREE.MeshBasicMaterial({color: this.colormap[2]}), // front, red 
        new THREE.MeshBasicMaterial({color: this.colormap[1]}), // back, orange
        new THREE.MeshBasicMaterial({color: this.colormap[4]}), // right, yellow
        new THREE.MeshBasicMaterial({color: this.colormap[3]}), // left, white
        new THREE.MeshBasicMaterial({color: this.colormap[6]}), // up, blue
        new THREE.MeshBasicMaterial({color: this.colormap[5]}), // down, green
    ];

    for(let idx in coords) {
        var p = coords[idx];
        var d = (new C3CubeUtil()).encode_pos(n, p);
        var mesh = new THREE.Mesh(geometry, materials);
        var r = [a==0 ? 0: -0.5*math.sign(p[0]), 
            a==0 ? 0: -0.5*math.sign(p[1]), 
            a==0 ? 0: -0.5*math.sign(p[2])];
        mesh.position.set(p[0]+r[0], p[1]+r[1], p[2]+r[2]);
        meshes[d] = mesh;
    }
    return meshes;
}

C3CubeGraphic.prototype.operate = function(axis, l) {

}

C3CubeGraphic.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
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