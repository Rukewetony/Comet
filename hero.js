var Hero = function( state, x, y, name){
	Kiwi.Group.call( this, state);
	this.x = x; 
	this.y = y;
	
	this.comet = new Kiwi.GameObjects.Sprite( state, state.textures['hero_spritesheet'], 0, 0, false);
	this.comet.animation.add('blue', [0], 0.1);
	this.comet.animation.add('bluedeath', [0,1,2,3,4,5,6,7], 0.05);
	
	this.comet.animation.add('fire', [8], 0.1);
	this.comet.animation.add('firedeath', [8,9,10,11,12,13,14,15], 0.05);
	this.comet.animation.add('apple', [16], 0.1);
	this.comet.animation.add('appledeath', [16,17,18,19,20,21,22,23], 0.05)
	this.comet.name = name;
	this.comet.animation.play(this.comet.name);
	this.comet.objType = function(){
		return 'Comet';
	}
	this.comet.parent = this;
	this.comet.components.add(new CircleColliderComponent({owner: this.comet, diameter: 50, isComet: true}));
	this.hitCircle = this.comet.components.getComponent('CircleCollider').circle;
		
	this.tailGroup = new Kiwi.Group(state);

	this.shadowScales = [0, 1];
	this.shadowAlphas = [0, 1];
	this.shadowOffsets = [0, 300];
	this.numberOfShadows = 60;
	for (var i = 0; i < this.numberOfShadows; i++){
		var cometShadow = new CometShadow( state, this, i);
		cometShadow.scale = (1 - i/this.numberOfShadows);
		cometShadow.alpha = (1 - i/this.numberOfShadows); 
		cometShadow.x = (0 - (6*i));
		this.tailGroup.addChild(cometShadow);
	}
	
	this.sparkGroup = new Kiwi.Group(state);
	
	this.numberOfSparks = 10;
	for (var i = 0; i < this.numberOfSparks; i++){
		var spark = new Spark(state, this, i);
		this.sparkGroup.addChild(spark);
	}
	
	this.addChild(this.tailGroup);	
	this.addChild(this.sparkGroup);
	this.addChild(this.comet);	
	
	this.vx = 0;
	this.vy = 0;
	this.state = state;
	

	this.isAlive = true;
	console.log(this.hitCircle);
}
Kiwi.extend( Hero, Kiwi.Group );

var CometShadow = function( state , hero, index ){
	Kiwi.GameObjects.Sprite.call(this, state, state.textures['hero_spritesheet'], 0, 3, false);	
	
	this.hero = hero; 
	this.index = index;
	
	this.animation.add('bluetail', [7], 0.1, false);
	this.animation.add('firetail', [15], 0.1, false);
	this.animation.add('appletail', [23], 0.1, false);
	this.animation.play(this.hero.comet.name + 'tail');
}
Kiwi.extend( CometShadow, Kiwi.GameObjects.Sprite);

CometShadow.prototype.update = function(){
	Kiwi.GameObjects.Sprite.prototype.update.call(this);
	
	this.index = this.index + 1; 
	if(this.index >= this.hero.numberOfShadows -1){
		this.index = 0;
	}
		
	this.y = this.hero.vy * this.index * 0.04;
	this.y -= this.hero.vy * Math.pow(this.index * 0.08, 2);

	this.alpha = 1 - this.index/this.hero.numberOfShadows;
	this.scaleX = 1 - this.index/this.hero.numberOfShadows;
	this.scaleY = 1 - this.index/this.hero.numberOfShadows;

	this.x = 0 - (6*this.index);
	this.x -= this.hero.vx * Math.pow(this.index * 0.08, 2);
	
}

var Spark = function(state, hero, index){
	Kiwi.GameObjects.StaticImage.call(this, state, 'redSpark');
	this.state = state;
	this.hero = hero;
	this.index = index;
	this.startingX = this.hero.comet.width/2 - 20;
	this.startingY = this.hero.comet.height/2 - 4; 
	this.angle = Math.PI;
}
Kiwi.extend(Spark, Kiwi.GameObjects.StaticImage);

Spark.prototype.update = function(){
	Kiwi.GameObjects.StaticImage.prototype.update.call(this);
	
	this.index = this.index + 0.1; 
	if(this.index >= this.hero.numberOfSparks -1){
		this.index = 0;
		this.x = this.startingX;
		this.y = this.startingY;
		this.setRandomAngle();
	}
	
	this.x = this.index * 10 * Math.cos(this.angle) + this.startingX;
	this.y = this.index * 10 * Math.sin(this.angle) + this.startingY;
	this.x -= this.hero.vx * Math.pow(this.index * 0.12, 2);
	this.y -= this.hero.vy * Math.pow(this.index * 0.12, 2);	

	this.scaleX = 1 - this.index/this.hero.numberOfSparks;
	this.scaleY = 1 - this.index/this.hero.numberOfSparks;
		
}

Spark.prototype.setRandomAngle = function(){
	var randomFrac = this.state.random.frac() / 3;
	this.angle = (5 * Math.PI)/6 + (randomFrac * Math.PI);
};


Hero.prototype.die = function(){
	this.comet.animation.play(this.comet.name + 'death');
	this.isAlive = false;
	//do something with his tail.
	this.tailGroup.visible = false;
}

Hero.prototype.checkCollisions = function(){
	var nebulasMatter = [];
	for(var i = 0; i < this.state.solarSystems.length; i++){
		if(this.state.solarSystems[i].moving || this.state.solarSystems[i].movingOffscreen){
			nebulasMatter = nebulasMatter.concat(this.state.solarSystems[i].members);
		}
	}
	
	console.log(nebulasMatter);
	
	var shouldDie = false;
	for(var i = 0; i < nebulasMatter.length; i++){
		if(this.hitCircle.distanceTo(nebulasMatter[i].hitCircle) < (nebulasMatter[i].hitCircle.radius + this.hitCircle.radius)){
			shouldDie = true;
			break;
		}	
	}
	
	if(this.isAlive && shouldDie){
		this.die();
	}
	
	if(!this.isAlive && !shouldDie){
		this.comet.animation.play('fire');	

		this.isAlive = true;
		this.tailGroup.visible = true;	

	}
}

Hero.prototype.update = function(){
	Kiwi.Group.prototype.update.call(this);
	
	
	if(this.state.upKey.isDown){
		if(this.vy > -50){
			this.vy -= 1;
		}
	}
	if(this.state.downKey.isDown){
		if(this.vy < 50){
			this.vy += 1;
		}
	}
	if(this.state.rightKey.isDown){
		if(this.vx < 50){
			this.vx += 1;
		}
	}
	if(this.state.leftKey.isDown){
		if(this.vx > -50){
			this.vx -= 1;
		}
	}

	if(Math.abs(this.vy) > 0.0001){
		this.vy = this.vy * 0.9
	}else{
		this.vy = 0;
	}

	if(Math.abs(this.vx) > 0.0001){
		this.vx = this.vx * 0.9;
	}else{
		this.vx = 0;
	}
	
	
	this.y += this.vy; 
	if(this.y < -100){
		this.y = this.state.game.stage.height - this.height;
	}else if(this.y > this.state.game.stage.height){
		this.y = -100;
	}
	
	if(this.x + this.vx > 0 && this.x + this.vx < this.state.game.stage.width){
		this.x += this.vx;
	}
	
	this.checkCollisions();
}

Hero.prototype.objType = function(){
	return 'Hero'
}