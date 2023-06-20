"use strict";

/**
 * c3cube_graphic.js, cube render implementation
 *   v0.2.1, developed by devseed
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { C3Cube } from "./c3cube_core.js";

/**
 * transfor the coordinate of screen to opengl coordinate -1 ~ 1
 * @param {HTMLCanvasElement} canvas 
 * @param {int} x 
 * @param {int} y 
 * @returns {THREE.Vector2}
 */
function glcoord(canvas, x, y) {
    var w = parseInt(canvas.style.width.replace("px", ""));
    var h = parseInt(canvas.style.height.replace("px", ""));
    var rect = canvas.getBoundingClientRect();
    x -= rect.left;
    y -= rect.top; // open gl is left-hand coordinate
    return new THREE.Vector2(2*x/w - 1, -2*y/h + 1);
}

/**
 * calculate the normal of interact in world coordinate 
 * @param {THREE.Object3D} interact
 * @returns {THREE.Vector3} 
 */
function face_normal(interact) {
    return interact.normal.clone().transformDirection(interact.object.matrixWorld);
}

/**
 * calculate the normal of interact in world coordinate 
 * @param {THREE.Onject3D} interact
 * @returns {THREE.Material} 
 */
function face_material(interact) {
    const material_idx = interact.face.materialIndex;
    return interact.object.material[material_idx];
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
    this.contorl_orbits = new OrbitControls(this.camera, canvas);
    this.control_c3piece = {
        intersect: null, arrow_normal: null, arrow_operate: null
    }
    this._init_events();
}

/**
 * make c3cube rendering project according to the c3cube status
 * @param {C3Cube} c3core 
 * @returns {THREE.Group}
 */
C3CubeGraphic.prototype.create_c3obj = function(c3core){
    const c3obj = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cmap = this.colormap;
    const cmapr = c3core.colormapr;

    for(let idx in c3core.pieces) {
        var piece = c3core.pieces[idx];
        if(!piece) continue;
        var p = piece.p, o = piece.o, c = piece.c;
        var materials = []; // front->R, back->O,  right->Y, left->W, up->B, down->G
        var colors = [];
        if(o[0]>0) colors[0] = cmap[cmapr[c[0]]];
        else colors[1] = cmap[cmapr[c[0]]];
        if(o[1]>0) colors[2] = cmap[cmapr[c[1]]];
        else colors[3] = cmap[cmapr[c[1]]];
        if(o[2]>0) colors[4] = cmap[cmapr[c[2]]];
        else colors[5] =cmap[cmapr[c[2]]];
        for(let i=0;i<6;i++) {
            if(!colors[i]) colors[i] = cmap[0];
            materials[i] = this.create_c3face_material(new THREE.Color(colors[i]));
        }

        var mesh = new THREE.Mesh(geometry, materials);
        mesh.position.copy(this.coord_c3graphic(p));
        mesh.name = this.NAME_C3PIECE;
        c3obj.add(mesh);
    }
    return c3obj;
}

/** 
 * @param {THREE.Color} color_face
 * @returns {THREE.Material}
 */
C3CubeGraphic.prototype.create_c3face_material = function(color_face, size_gap=0.04, color_gap=new THREE.Color("#000000")) {
    const material = new THREE.ShaderMaterial( {
        uniforms: {
            color_face: {value: color_face}, 
            color_gap: {value: color_gap},
            size_gap: {value: size_gap}
        }, 
        vertexShader: `
            varying vec2 vuv;
            void main() {
                vuv = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0 );
            }`,
        fragmentShader: `
            uniform vec3 color_face;
            uniform vec3 color_gap;
            uniform float size_gap;
            varying vec2 vuv;
            void main() {
                float r = 1.f;
                float th = size_gap/2.f;
                if (vuv.x<size_gap || vuv.x>1.f-size_gap || vuv.y<size_gap || vuv.y>1.f-size_gap) {
                    float rx1 = smoothstep(size_gap - th, size_gap, vuv.x);
                    float rx2 = 1.f - smoothstep(1.f - size_gap, 1.f - size_gap + th, vuv.x);
                    float ry1 = smoothstep(size_gap - th, size_gap, vuv.y);
                    float ry2 = 1.f - smoothstep(1.f - size_gap, 1.f - size_gap + th, vuv.y);
                    r = (rx1 + rx2 + ry1 + ry2)/4.f;
                }
                gl_FragColor = vec4(mix(color_gap, color_face, r), 1.0);
            }
        `
    });
    return material;
}

/**
 * apply the c3cube status on the scene
 * @param {C3Cube} c3core 
 */
C3CubeGraphic.prototype.apply_c3cube = function(c3core) {
    // create c3 rendering object
    this.c3core = c3core;
    this.c3obj = this.create_c3obj(c3core);
    this.scene = new THREE.Scene();
    this.scene.add(this.c3obj);
    
    // adjust length
    const n = this.c3core.order;
    const b = this.c3core.imax;
    var d = n<=5 ? 3*b: 2*b; 
    this.camera.position.set(d, d, d);
    this.axeshelper = new THREE.AxesHelper(10*b);
    this.axeshelper.setColors(this.colormap[2], this.colormap[4], this.colormap[6]);
    this.scene.add(this.axeshelper);
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

    params.targets = [];
    params.axis = axis;
    params.l = l;
    params.reverse = reverse;
    this.c3obj.traverse((obj)=>{
        if(obj.name!=this.NAME_C3PIECE) return;
        var p = this.coord_c3core(obj.position)
        if(math.equal(parseInt(p[axis]), l)) {
            params.targets.push({mesh:obj, p: obj.position.clone(), q:obj.quaternion.clone()});
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

C3CubeGraphic.prototype.c3piece_mousedown = function(intersect) {
    this.control_c3piece.intersect =null;
    if(this.params_animate_operate.clock) return;
    if(!intersect) return;

    var arrow_normal = this.control_c3piece.arrow_normal;
    if(arrow_normal) arrow_normal.removeFromParent();
    const n = this.c3core.order;
    var color = face_material(intersect).uniforms.color_face.value.clone();
    arrow_normal = new THREE.ArrowHelper(face_normal(intersect), intersect.point);
    color.setRGB(1-color.r, 1-color.g, 1-color.b);
    arrow_normal.setColor(color);
    arrow_normal.setLength(n/10);

    this.contorl_orbits.enabled = false;
    this.control_c3piece.intersect = intersect;
    this.control_c3piece.arrow_normal = arrow_normal;
    this.scene.add(arrow_normal);
}

C3CubeGraphic.prototype.c3piece_mousemove = function(intersect) {
    if(this.params_animate_operate.clock) return;
    const intersect_pre = this.control_c3piece.intersect;
    if(!intersect_pre) return;
    if(!intersect) return;
    
    const n = this.c3core.order;
    var obj1 = intersect_pre.object;
    var obj2 = intersect.object;
    var vec = obj2.position.clone().sub(obj1.position);
    var arrow_operate = this.control_c3piece.arrow_operate;
    var arrow_normal = this.control_c3piece.arrow_normal;
    if(arrow_operate) arrow_operate.removeFromParent();
    if(vec.length() >= 1) {
        arrow_operate = new THREE.ArrowHelper(vec.normalize(), intersect_pre.point);
        arrow_operate.setColor(arrow_normal.line.material.color);
        arrow_operate.setLength(n/10);
        this.control_c3piece.arrow_operate = arrow_operate;
        this.scene.add(arrow_operate);
    }
}

C3CubeGraphic.prototype.c3piece_mouseup = function(intersect) {
    this.contorl_orbits.enabled = true;
    const arrow_normal = this.control_c3piece.arrow_normal;
    const arrow_operate = this.control_c3piece.arrow_operate;
    if(arrow_normal) arrow_normal.removeFromParent();
    if(arrow_operate) arrow_operate.removeFromParent();
    
    if(this.params_animate_operate.clock) return;
    const intersect_pre = this.control_c3piece.intersect;
    if(!intersect_pre) return;
    if(!intersect) return;

    var axis = -1, reverse = false;
    var obj1 = intersect_pre.object;
    var obj2 = intersect.object;
    var normal = face_normal(intersect_pre);
    var vec = obj2.position.clone().sub(obj1.position);
    var normal2 = normal.clone().cross(vec).normalize();
    var normal2_arr = [normal2.x, normal2.y, normal2.z]
    var normal2_max = 0.01;
    axis = -1;
    for(let i=0; i < normal2_arr.length; i++) {
        let cur = math.abs(normal2_arr[i]);
        if(cur > normal2_max) {
            normal2_max = cur; 
            axis = i;
        }
    }
    if(axis >= 0) {
        reverse = (normal2_arr[axis] < 0);
        var p1 = this.coord_c3core(obj1.position);
        // console.log(axis, p1, "normal", normal, "vec", vec, "normal2", normal2);
        this.push_operate(axis, parseInt(math.round(p1[axis])), reverse);
    }

    this.control_c3piece.intersect = null;
}

/**
 * convert the c3cure_core coordinate to c3cube_graphic
 * @param {int[3]} p 
 * @returns {THREE.Vector3}
 */
C3CubeGraphic.prototype.coord_c3graphic = function(p) {
    const a = this.c3core.imin;
    var r = [a==0 ? 0: -0.5*math.sign(p[0]), 
        a==0 ? 0: -0.5*math.sign(p[1]), 
        a==0 ? 0: -0.5*math.sign(p[2])];
    return new THREE.Vector3(p[0]+r[0], p[1]+r[1], p[2]+r[2]);
}

/**
 * convert the c3cube_graphic coordinate to c3cure_core
 * @param {THREE.Vector3} p 
 * @returns {int[3]}
 */
C3CubeGraphic.prototype.coord_c3core = function (p) {
    const a = this.c3core.imin;
    var r = [a==0 ? 0: -0.5*math.sign(p.x), 
        a==0 ? 0: -0.5*math.sign(p.y), 
        a==0 ? 0: -0.5*math.sign(p.z)];
    return math.round([p.x-r[0], p.y-r[1], p.z-r[2]]);
}

C3CubeGraphic.prototype.raycaster_c3obj = function(origin, direction=null) {
    const raycaster = new THREE.Raycaster();
    if(direction) raycaster.set(origin, direction);
    else {
        var coord = glcoord(this.canvas, origin.x, origin.y); 
        raycaster.setFromCamera(coord, this.camera);
    }    
    return raycaster.intersectObjects(this.c3obj.children);
} 

C3CubeGraphic.prototype._init_events = function() {
    // mouse event
    this.canvas.onmousedown = (e)=> {
        var intersects = this.raycaster_c3obj(new THREE.Vector2(e.clientX, e.clientY));
        this.c3piece_mousedown(intersects[0]);
    };

    this.canvas.onmousemove = (e) => {
        var intersects = this.raycaster_c3obj(new THREE.Vector2(e.clientX, e.clientY));
        this.c3piece_mousemove(intersects[0]);
    };

    this.canvas.onmouseup = (e) => {
        var intersects = this.raycaster_c3obj(new THREE.Vector2(e.clientX, e.clientY));
        this.c3piece_mouseup(intersects[0]);
    };

    // touch event
    var last_touch_coords;
    this.canvas.ontouchstart = (e) => {
        if(e.touches.length > 1) return;
        var intersects = this.raycaster_c3obj(new THREE.Vector2(e.touches[0].clientX, e.touches[0].clientY));
        this.c3piece_mousedown(intersects[0]);
    }

    this.canvas.ontouchmove = (e) => {
        if(e.touches.length > 1) return;
        last_touch_coords = new THREE.Vector2(e.touches[0].clientX, e.touches[0].clientY);
        var intersects = this.raycaster_c3obj(last_touch_coords);
        this.c3piece_mousemove(intersects[0]);
    }

    this.canvas.ontouchend = (e) => {
        var intersects = this.raycaster_c3obj(last_touch_coords);
        this.c3piece_mouseup(intersects[0]);
    }
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
 *   v0.2.1, optimize the user interface
 *   v0.2.2, add shader for c3piece, touch support
 */