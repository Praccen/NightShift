// This file is evaluated in Game/ObjectPlacer, see the context there code/src/Game/ObjectPlacer.ts

this.placements.set(
	"House",
	new Placement(
		"Assets/objs/house.obj",
		"Assets/textures/houseTex_bright.png",
		"Assets/textures/houseTex_bright.png"
	)
);

this.placements.set(
	"Delivery zone",
	new Placement(
		"Assets/objs/DeliveryZone.obj",
		"Assets/textures/DZ.png",
		"Assets/textures/DZ.png",
		false
	)
);

this.placements.set(
	"Police car",
	new Placement(
		"Assets/objs/police_car.obj",
		"Assets/objs/police_car.mtl",
		"Assets/objs/police_car_spec.mtl",
	)
)

this.placements.set(
	"Diamond",
	new Placement(
		"Assets/objs/Diamond.obj",
		"Assets/objs/Diamond.mtl",
		"Assets/objs/Diamond.mtl",
		null
	)
)

this.placements.set(
	"Sphere",
	new Placement(
		"Assets/objs/sphere.obj",
		"Assets/objs/sphere.mtl",
		"Assets/objs/sphere.mtl",
		null
	)
)

this.placements.set(
	"Box",
	new Placement(
		"Assets/objs/cube.obj",
		"CSS:rgb(255,255,255)",
		"CSS:rgb(100,100,100)",
	    null //"Assets/textures/white.png",
	)
)

this.placements.set(
	"Box Gray",
	new Placement(
		"Assets/objs/cube.obj",
		"CSS:rgb(50,50,50)",
		"CSS:rgb(0,0,0)",
		null //"CSS:rgb(25,25,25)",
	)
)

this.placements.set(
	"Box Pink",
	new Placement(
		"Assets/objs/cube.obj",
		"CSS:rgb(221, 137, 164)",
		"CSS:rgb(0,0,0)",
		null //"CSS:rgb(221, 137, 164)",
	)
)

this.placements.set(
	"Box Green",
	new Placement(
		"Assets/objs/cube.obj",
		"CSS:rgb(0, 255, 70)",
		"CSS:rgb(0,0,0)",
		null //"CSS:rgb(0, 255, 70)",
	)
)
