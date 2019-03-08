/**
 * Scene object
 * @param {string} model path to 3D model
 * @param {string} element id of element target
 */
var Scene = function(model, element) {

	/**
	 * Init scene & parameters
	 */
	var scope = this;
	
	this.scene = new THREE.Scene();

	this.width = window.innerWidth;
    this.height = window.innerHeight;
		
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	this.camera.position.set(0.20, 1.5, 6);
	
	this.quaternion = new THREE.Quaternion();

	this.renderer = new THREE.WebGLRenderer();
	
	this.model = model;
	
	this.element = element;
	
	this.movementSpeed = 1.0;
	
	this.rollSpeed = 0.005;

	this.init = function() {

		this.loadScene();

		this.addCameraControls();
		
		this.animate();
		
		this.render();

	};

	  this.loadScene = function() {

			this.loader = new THREE.GLTFLoader();

			// add model in scene
			this.loader.load(scope.model, function (gltf) {

				scope.scene.add(gltf.scene);
				scope.scene.add(scope.camera);
				scope.renderer.setSize(scope.width, scope.height);
				document.getElementById(scope.element).appendChild(scope.renderer.domElement);

			}, undefined, function (error) {

				console.error(error);

			});

	};
	this.render = function () {

		this.controls.update();

		this.renderer.render(scope.scene, scope.camera);

		requestAnimationFrame(this.render.bind(this));

	};
	this.addCameraControls = function() {
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
	
		this.controls.enabled = false;
	};
	this.animate = function() {
		var scope = this;
		this.mouseX = 0.20;
		this.lastMouseX = 0.20;
		this.lastMouseY = 1.5;
		this.lastScale = 6;
		this.isok = false;
		this.tiltFx = {
		  body: document.body,
		  docEl: document.documentElement,
		  getMousePos: (e,docScrolls) => {
			let posx = 0;
			let posy = 0;
			if (!e) e = window.event;
			if (e.pageX || e.pageY) {
			  posx = e.pageX;
			  posy = e.pageY;
			}
			else if (e.clientX || e.clientY) 	{
			  posx = e.clientX + docScrolls.left;
			  posy = e.clientY + docScrolls.top;
			}
			return { x : posx, y : posy }
		  },
		  lerp: (a, b, n) => (1 - n) * a + n * b,
		  lineEq: (y2, y1, x2, x1, currentVal) => {
			let m = (y2 - y1) / (x2 - x1); 
			let b = y1 - m * x1;
			return m * currentVal + b;
		  }
		};
		this.docheight = Math.max( this.tiltFx.body.scrollHeight, this.tiltFx.body.offsetHeight, this.tiltFx.docEl.clientHeight, this.tiltFx.docEl.scrollHeight, this.tiltFx.docEl.offsetHeight);
		
		this.requestId = requestAnimationFrame(function() { scope.tilt() });
		window.addEventListener('mousemove', function(ev) {
		  var docScrolls = {left : scope.tiltFx.body.scrollLeft + scope.tiltFx.docEl.scrollLeft, top : scope.tiltFx.body.scrollTop + scope.tiltFx.docEl.scrollTop};
		  var mp = scope.tiltFx.getMousePos(ev, docScrolls);
		  scope.mouseX = mp.x-docScrolls.left;
		});
		this.animateCam = function(change, currentTime, duration) {
			var increment = 20;
			currentTime += increment;
			var val = {
				z: scope.easeInOutQuad(currentTime, scope.lastScale, change.z, duration),
				x: scope.easeInOutQuad(currentTime, scope.lastMouseX, change.x, duration),
				y: scope.easeInOutQuad(currentTime, scope.lastMouseY, change.y, duration)
			};
			scope.moveTo(val.x, val.y, val.z);
			scope.lastScale = val.z;
			scope.lastMouseX = val.x;
			scope.lastMouseY = val.y;
			if(currentTime < duration) {
				setTimeout(function(){
					scope.animateCam(change, currentTime, duration);
				}, increment);
			}
		};
		window.addEventListener('scroll', function() {
			var firstOffset = document.getElementById('div1').offsetTop + document.getElementById('div1').offsetHeight;
			if(window.scrollY > firstOffset && !scope.isok) {
				var change = {
					z: 5.8 - scope.lastScale,
					x: scope.lastMouseX - scope.lastMouseX,
					y: scope.lastMouseY - scope.lastMouseY
				};
				scope.animateCam(change, 0, 700);
				scope.isok = true;
			} else if(window.scrollY < firstOffset && scope.isok) {
				var change = {
					z: 2.6 - scope.lastScale,
					x: scope.lastMouseX - scope.lastMouseX,
					y: scope.lastMouseY - scope.lastMouseY
				};
				scope.animateCam(change, 0, 700);
				scope.isok = false;
			}
		});
		window.addEventListener('resize', function() { scope.docheight = Math.max( scope.tiltFx.body.scrollHeight, scope.tiltFx.body.offsetHeight, scope.tiltFx.docEl.clientHeight, scope.tiltFx.docEl.scrollHeight, scope.tiltFx.docEl.offsetHeight ) });
		window.onbeforeunload = function() {
		  window.cancelAnimationFrame(scope.requestId);
		  window.scrollTo(0, 0);
		};
		};

	  this.moveTo = function(x, y, z) {
		var scope = this;
		this.lastMouseX = this.tiltFx.lerp(this.lastMouseX, this.tiltFx.lineEq(x,0,this.width,0,this.mouseX), 0.05);
		var newScrollingPos = window.pageYOffset;
		this.lastMouseY = this.tiltFx.lerp(this.lastMouseY, this.tiltFx.lineEq(0,y,this.docheight,0,newScrollingPos), 0.05);
		this.lastScale = z;
		this.camera.position.set(this.lastMouseX, this.lastMouseY, this.lastScale);
		};
		
		this.easeInOutQuad = function(t, b, c, d) {
			t = t / (d / 2);
			if (t < 1) {
				return c / 2 * t * t + b;
			} else {
				t--;
				return -c / 2 * (t * (t - 2) - 1) + b;
			}
		};
	
	  this.tilt = function() {
		var scope = this;
		this.lastMouseX = this.tiltFx.lerp(this.lastMouseX, this.tiltFx.lineEq(0.50,0,this.width,0,this.mouseX), 0.05);
		var newScrollingPos = window.pageYOffset;
		// this.lastMouseY = this.tiltFx.lerp(this.lastMouseY, this.tiltFx.lineEq(0,2,this.docheight,0,newScrollingPos), 0.05);
		// this.lastScale = this.tiltFx.lerp(this.lastScale, this.tiltFx.lineEq(0,8,this.docheight,0,newScrollingPos), 0.05);
		this.camera.position.set(this.lastMouseX, this.lastMouseY, this.lastScale);
		this.requestId = requestAnimationFrame(function() { scope.tilt() });
	  };
};

var scene = new Scene('model/scene.gltf', 'frame');
scene.init();