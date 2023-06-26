"use strict";

/**
 * c3cube_graphic.js, cube render implementation
 *   v0.2.4, developed by devseed
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
 * @param {C3Cube} c3cube
 * @param {HTMLCanvasElement} canvas 
 */
const C3CubeGraphic = function(c3cube, canvas) {
    // init render
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
    this.camera =  new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000 );
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.up.set(0, 0, 1); // z axis up
    this.params_operate = { 
        interval: 300, clock: null, steps: 0, 
        targets: [], operate: [],
        flag_update: true
    };

    // init cube model
    this.c3core = c3cube;
    this.c3obj = null;
    this.apply_c3cube(this.c3core);

    // init control
    this.contorl_orbits = new OrbitControls(this.camera, canvas);
    this.control_c3piece = {
        intersect: null, arrow_normal: null, arrow_operate: null
    }
    this._init_events();
}

C3CubeGraphic.prototype.dispose = function() {
    if(this.c3obj) {
        this.c3obj.removeFromParent();
        for(let idx in this.c3obj.children) {
            const obj = this.c3obj.children[idx];
            for(let idx2 in obj.material) obj.material[idx2].dispose();
            obj.geometry.dispose();
        }
    }
    if(this.params_operate) {
        if(this.params_operate.arrow_normal) {
            this.params_operate.arrow_normal.dispose();
            this.params_operate.arrow_normal.removeFromParent();
        }
        if(this.params_operate.arrow_operate) {
            this.params_operate.arrow_operate.dispose();
            this.params_operate.arrow_operate.removeFromParent();
        }
    }
}

/**
 * make c3cube rendering project according to the c3cube status
 * @param {C3Cube} c3cube 
 * @returns {THREE.Group}
 */
C3CubeGraphic.prototype.create_c3obj = function(c3cube){
    const c3obj = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cmap = this.colormap;
    const cmapr = c3cube.colormapr;
    const size_gap = c3cube.order <10 ? 0.024: 0.04 

    for(let idx in c3cube.pieces) {
        const piece = c3cube.pieces[idx];
        if(!piece) continue;
        const p = piece.p, o = piece.o, c = piece.c;
        const materials = []; // front->R, back->O,  right->Y, left->W, up->B, down->G
        const colors = [];
        if(o[0]>0) colors[0] = cmap[cmapr[c[0]]];
        else colors[1] = cmap[cmapr[c[0]]];
        if(o[1]>0) colors[2] = cmap[cmapr[c[1]]];
        else colors[3] = cmap[cmapr[c[1]]];
        if(o[2]>0) colors[4] = cmap[cmapr[c[2]]];
        else colors[5] =cmap[cmapr[c[2]]];
        for(let i=0;i<6;i++) {
            if(!colors[i]) colors[i] = cmap[0];
            materials[i] = this.create_c3face_material(new THREE.Color(colors[i]), size_gap);
        }

        const mesh = new THREE.Mesh(geometry, materials);
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
C3CubeGraphic.prototype.create_c3face_material = function(color_face, 
        size_gap=0.04, color_gap=new THREE.Color("#E1E1E1")) {
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
                }
                float rx1 = smoothstep(size_gap - th, size_gap, vuv.x);
                float rx2 = 1.f - smoothstep(1.f - size_gap, 1.f - size_gap + th, vuv.x);
                float ry1 = smoothstep(size_gap - th, size_gap, vuv.y);
                float ry2 = 1.f - smoothstep(1.f - size_gap, 1.f - size_gap + th, vuv.y);
                r = 1.f - clamp((1.f-rx1) + (1.f-rx2) + (1.f-ry1) + (1.f-ry2), 0.f, 1.f);
                gl_FragColor = vec4(mix(color_gap, color_face, r), 1.0);
            }
        `
    });
    return material;
}

/**
 * apply the c3cube status on the scene
 * @param {C3Cube} c3cube 
 */
C3CubeGraphic.prototype.apply_c3cube = function(c3cube) {
    // remove c3obj first
    this.dispose();

     // create c3 rendering object
    this.c3core = c3cube;
    this.c3obj = this.create_c3obj(c3cube);
    this.scene = new THREE.Scene();
    this.scene.add(this.c3obj);
    this.params_operate.flag_update = true;
    this.params_operate.steps = c3cube.operate_stack.length;
    
    // adjust length
    const n = this.c3core.order;
    const b = this.c3core.imax;
    const d = n<=5 ? 3*b: 2*b; 
    this.camera.position.set(d, d, d);
    this.axeshelper = new THREE.AxesHelper(10*b);
    this.axeshelper.setColors(this.colormap[2], this.colormap[4], this.colormap[6]);
    this.scene.add(this.axeshelper);
}

/**
 * flatten a cube to a canva
 * @param {C3Cube} c3cube
 * @returns {HTMLCanvasElement}
 */
C3CubeGraphic.prototype.flatten_c3cube = function(options) {
    var w = 800, h = 600;
    var side_len = 0;
    const color_bk = "#9BFFFC"
    const color_side = this.colormap[0];
    const line_ratio = 0.1;
    const c3cube = this.c3core;
    const n = c3cube.order;
    const b = c3cube.imax;
    var x, y, dx, dy;
    
    if(!options) options = {};
    if(options.side_len) side_len = options.side_len;
    if(side_len==0) side_len = h/(3*n);
    else {w = side_len*4*n; h = side_len*3*n;}
    const img_canvas = options.img_canvas ? options.img_canvas : document.createElement("canvas");
    img_canvas.width = w; img_canvas.height = h;
    var ctx = img_canvas.getContext('2d');
    ctx.strokeStyle = color_side;
    ctx.lineWidth = line_ratio * side_len;
    ctx.fillStyle = color_bk;
    ctx.fillRect(0, 0, w, h);

    for(let idx in c3cube.pieces) {
        const piece = c3cube.pieces[idx];
        if(!piece) continue;
        
        // draw back
        if(piece.p[0]==-b) {
            x = side_len*(3*n + (n-1)/2); y = h/2 - side_len/2;
            const c = this.colormap[c3cube.colormapr[piece.c[0]]];
            const p = this.coord_c3graphic(piece.p);
            dx = p.y*side_len; dy = p.z*side_len
            ctx.fillStyle = c;
            ctx.strokeRect(x + dx, y - dy, side_len, side_len);
            ctx.fillRect(x + dx, y - dy, side_len, side_len);
        }

        // draw front
        if(piece.p[0]==b) {
            x = side_len*(1*n + (n-1)/2); y = h/2 - side_len/2;
            const c = this.colormap[c3cube.colormapr[piece.c[0]]];
            const p = this.coord_c3graphic(piece.p);
            dx = p.y*side_len; dy = p.z*side_len
            ctx.fillStyle = c;
            ctx.strokeRect(x + dx, y - dy, side_len, side_len);
            ctx.fillRect(x + dx, y - dy, side_len, side_len);
        }

        // draw left
        if(piece.p[1]==-b) {
            x = side_len*(0*n + (n-1)/2); y = h/2 - side_len/2;
            const c = this.colormap[c3cube.colormapr[piece.c[1]]];
            const p = this.coord_c3graphic(piece.p);
            dx = p.x*side_len; dy = p.z*side_len
            ctx.fillStyle = c;
            ctx.strokeRect(x + dx, y - dy, side_len, side_len);
            ctx.fillRect(x + dx, y - dy, side_len, side_len);
        }

        // draw right 
        if(piece.p[1]==b) {
            x = side_len*(2*n + (n-1)/2); y = h/2 - side_len/2;
            const c = this.colormap[c3cube.colormapr[piece.c[1]]];
            const p = this.coord_c3graphic(piece.p);
            dx = p.x*side_len; dy = p.z*side_len
            ctx.fillStyle = c;
            ctx.strokeRect(x + dx, y - dy, side_len, side_len);
            ctx.fillRect(x + dx, y - dy, side_len, side_len);
        }

        // draw down 
        if(piece.p[2]==-b) {
            x = side_len*(1*n + (n-1)/2); y = h - side_len*(n+1)/2;
            const c = this.colormap[c3cube.colormapr[piece.c[2]]];
            const p = this.coord_c3graphic(piece.p);
            dx = p.y*side_len; dy = p.x*side_len
            ctx.fillStyle = c;
            ctx.strokeRect(x + dx, y - dy, side_len, side_len);
            ctx.fillRect(x + dx, y - dy, side_len, side_len);
        }

        // draw up 
        if(piece.p[2]==b) {
            x = side_len*(1*n + (n-1)/2); y = side_len*(n-1)/2; 
            const c = this.colormap[c3cube.colormapr[piece.c[2]]];
            const p = this.coord_c3graphic(piece.p);
            dx = p.y*side_len; dy = p.x*side_len
            ctx.fillStyle = c;
            ctx.strokeRect(x + dx, y - dy, side_len, side_len);
            ctx.fillRect(x + dx, y - dy, side_len, side_len);
        }
    }
    
    return img_canvas; 
}

C3CubeGraphic.prototype.push_operate = function(axis, l, times=1) {
    if(this.operate(axis, l, times, {update_c3core: false})) {
        this.c3core.push_operate(axis, l, times);
        this.params_operate.steps = this.c3core.operate_stack.length;
        return true;
    }
    return false;
}

C3CubeGraphic.prototype.pop_operate = function() {
    const operate_stack = this.c3core.operate_stack;
    const last = operate_stack.length - 1;
    if(last<0) return false;
    
    const last_operate = operate_stack[last]
    var times = last_operate[2] % 4;
    if(times<0) times+=4;
    times = 4 - times;
    if(this.operate(last_operate[0], last_operate[1], 
            times==3?-1:times, {update_c3core: false})) {
        this.c3core.pop_operate();
        this.params_operate.steps = this.c3core.operate_stack.length;
    }
    return false;
}

C3CubeGraphic.prototype.seek_operate = function(idx, origin="SEEK_SET") {
    var next = 0;
    const cur = this.params_operate.steps;
    const size = this.c3core.operate_stack.length;
    if(origin=="SEEK_END") next = size + idx;
    else if (origin=="SEEK_SET") next = idx;
    else if (origin=="SEEK_CUR") next = cur + idx;
    else throw new Error(`invalid origin type ${origin}`);
    if(next < 0) return {next: next, operate: null, error: "no previous operate to seek!"};
    if(next>size) return {next: next, operate: null, error: "no next operate to seek!"};
    if(cur<=next){
        for(let i=cur; i<next; i++) {
            let operate = this.c3core.operate_stack[i];
            let times = operate[2];
            this.operate(operate[0], operate[1], times, 
                {update_c3core: true, no_animate:true});
        }
    }
    else {
        for(let i=cur-1; i>=next; i--) {
            let operate = this.c3core.operate_stack[i];
            let times = operate[2] % 4;
            if(times<0) times+=4;
            this.operate(operate[0], operate[1], 4 - times, 
                {update_c3core: true, no_animate:true});
        }
    }
    // console.log(`(${origin}, ${idx}), cur=${cur}, next=${next}, size=${size}`);
    this.params_operate.steps = next;
    return {next: next, operate: this.c3core.operate_stack[next]};
}


/**
 * operate on cube
 * @param {int} axis 
 * @param {int} l 
 * @param {int} times
 * @param {Object} options , update_c3core, synchronize c3cube core status
 * @returns 
 */
C3CubeGraphic.prototype.operate = function(axis, l, times=1, 
        options={update_c3core:true, no_animate:false}) {
    const params = this.params_operate;
    if(params.clock) {
        console.log("can't operate while last operate animate not finished!");
        return false;
    }
    if(params.steps != this.c3core.operate_stack.length && !options.no_animate) {
        alert("can not operate on cube while in previous steps");
        return false;
    }

    params.targets = [];
    params.operate = [axis, l, times];
    this.c3obj.traverse((obj)=>{
        if(obj.name!=this.NAME_C3PIECE) return;
        const p = this.coord_c3core(obj.position)
        if(!math.equal(parseInt(p[axis]), l)) return;
        if(options.no_animate) {
            var M = new THREE.Matrix4();
            const theta = math.pi/2 * times;
            if(axis==0) M.makeRotationX(theta);
            if(axis==1) M.makeRotationY(theta);
            if(axis==2) M.makeRotationZ(theta);
            obj.applyMatrix4(M);
            params.flag_update = true;
        }
        else {
            params.targets.push({mesh:obj, p: obj.position.clone(), q:obj.quaternion.clone()});
        }
    });

    if(!options.no_animate) params.clock = new THREE.Clock();

    if(options.update_c3core) {
        this.c3core.operate(axis, l, times);
        params.steps = this.c3core.operate_stack.length;
    }

    return true;
}

C3CubeGraphic.prototype.request_frame = function() {
    if(this.params_operate.clock) {
        this._animate_operate();
    }
    else {
        this.contorl_orbits.update();
    }
    this.renderer.render(this.scene, this.camera);
}

C3CubeGraphic.prototype.c3piece_mousedown = function(intersect) {
    this.control_c3piece.intersect =null;
    if(this.params_operate.clock) return;
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
    if(this.params_operate.clock) return;
    const intersect_pre = this.control_c3piece.intersect;
    if(!intersect_pre) return;
    this.contorl_orbits.enabled = false;
    if(!intersect) return;
    
    const n = this.c3core.order;
    const obj1 = intersect_pre.object;
    const obj2 = intersect.object;
    var vec = obj2.position.clone().sub(obj1.position);
    var arrow_operate = this.control_c3piece.arrow_operate;
    var arrow_normal = this.control_c3piece.arrow_normal;
    if(arrow_operate) {
        arrow_operate.removeFromParent();
        arrow_operate.dispose();
    }
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
    if(arrow_normal) {
        arrow_normal.dispose();
        arrow_normal.removeFromParent();
    }
    if(arrow_operate) {
        arrow_operate.dispose();
        arrow_operate.removeFromParent();
    }
    
    if(this.params_operate.clock) return;
    const intersect_pre = this.control_c3piece.intersect;
    if(!intersect_pre) return;
    if(!intersect) return;

    var axis = -1, times = 1;
    const obj1 = intersect_pre.object;
    const obj2 = intersect.object;
    var normal = face_normal(intersect_pre);
    var vec = obj2.position.clone().sub(obj1.position);
    var normal2 = normal.clone().cross(vec).normalize();
    
    var normal2_max = 0.01;
    const normal2_arr = [normal2.x, normal2.y, normal2.z]
    for(let i=0; i < normal2_arr.length; i++) {
        let cur = math.abs(normal2_arr[i]);
        if(cur > normal2_max) {
            normal2_max = cur; 
            axis = i;
        }
    }
    if(axis >= 0) {
        if(normal2_arr[axis] < 0) times=-1;
        var p1 = this.coord_c3core(obj1.position);
        // console.log(axis, p1, "normal", normal, "vec", vec, "normal2", normal2);
        this.push_operate(axis, parseInt(math.round(p1[axis])), times);
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
    const r = [a==0 ? 0: -0.5*math.sign(p[0]), 
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
    const r = [a==0 ? 0: -0.5*math.sign(p.x), 
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
    const params = this.params_operate;
    const axis = params.operate[0];
    const times = params.operate[2];
    const interval = params.clock.getElapsedTime ()*1000;
    var theta = math.pi/2 * times;
    if(interval >= params.interval) {
        params.clock = null;
        params.flag_update = true;
    }
    else theta *= interval/params.interval;
    
    var M = new THREE.Matrix4();
    if(axis==0) M.makeRotationX(theta);
    if(axis==1) M.makeRotationY(theta);
    if(axis==2) M.makeRotationZ(theta);
    for(let idx in params.targets) { 
        // reset position for decrese accumulated error
        const target = params.targets[idx];
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
 *   v0.2.3, fix memory link of three by dispose
 *   v0.2.4, add flatten_c3cube function, move to steps
 */