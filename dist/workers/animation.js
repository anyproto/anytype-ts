import * as THREE from './lib/three.module.js';

let scene = null;
let camera = null;
let ctx = null;
let mesh = null;
let handlers = {};
let state = {};

addEventListener('message', ({ data }) => { 
	if (handlers[data.id]) {
		handlers[data.id](data); 
	};
});

handlers.init = function (param) {
	const { canvas, width, height, density } = param;

	ctx = new THREE.WebGLRenderer({ canvas, antialias: true });
	ctx.setPixelRatio(density);

	camera = new THREE.PerspectiveCamera(100, width / height, 0.1, 100);
	camera.position.set(0, 0, 10);

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x060606);

	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh(geometry, material);
	mesh.geometry.center();

	scene.add(mesh);

	ctx.setAnimationLoop(animation);
};

handlers.resize = function (param) {
	state.width = param.width / param.density;
	state.height = param.height / param.density;
};

function animation (time) {
	mesh.rotation.x = time / 2000;
	mesh.rotation.y = time / 1000;

	if (resizeRendererToDisplaySize()) {
		camera.aspect = state.width / state.height;
		camera.updateProjectionMatrix();
	};

	ctx.render(scene, camera);
};

function resizeRendererToDisplaySize () {
	const canvas = ctx.domElement;
	const width = state.width;
	const height = state.height;
	const needResize = canvas.width !== width || canvas.height !== height;

	if (needResize) {
		ctx.setSize(width, height, false);
	};

	return needResize;
};