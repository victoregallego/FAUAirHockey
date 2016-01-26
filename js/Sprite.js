/**
 * Created with Visual Studio 2015 Community.
 * User: VictorE
 * Date: 9/3/13
 * Time: 12:33 AM
 * To change this template use File | Settings | File Templates.
 */

    // constructor function
function Sprite(initPos, scaleXYZ, rotDir,tRow, tCol) {

    // declare and initialize public members

    this.mvMatrix = mat4.create();

    // for draw
    this.initPos = new Float32Array(initPos);
    this.pos = initPos;
    this.scaleXYZ = scaleXYZ;

    // for update
    this.rotation = 0.0;    //rotation
    this.rotDir = rotDir;

    // for physics calculations
    this.velocity = [0.0,0.0,0.0];
    this.maxVelocity = 800;
    this.radius = scaleXYZ[0];
    this.mass = scaleXYZ[0];

    // for game logic
    this.type = "non-player-object";
    this.controlled = false;

    // for texture
    this.row = tRow;
    this.col = tCol;
}

// A 'static method', it's just like a normal function 
// it has no relation with any 'Sprite' object instance
Sprite.staticMethod = function () {
};

Sprite.prototype.draw = function () {
    // the 'this' keyword refers to the object instance
    // you can access only 'privileged' and 'public' members

    // set mv identity
    mat4.identity(this.mvMatrix);

    // translate to initial position of mv
    mat4.translate(this.mvMatrix, this.mvMatrix, this.pos);

    // set mv rotation
    mat4.rotate(this.mvMatrix,this.mvMatrix,toRadians(this.rotation),this.rotDir);

};

Sprite.prototype.update = function (delta) {
    // the 'this' keyword refers to the object instance
    // you can access only 'privileged' and 'public' members
    // Enter game logic here

    if(delta>1000.0){

        delta = 0; // fixes out of bounds error when debugger is paused
    }


    // updates position using velocity vector

    this.capMaxVelocity();

    vec3.scaleAndAdd(this.pos,this.pos,this.velocity,0.55*(delta)/1000.0);

    this.rotation += (30 * delta) / 1000.0;
    if(this.rotation > 360.0){ // prevents rotation from going out of range
       this.rotation = 0.0;
    }

    this.checkWallCollision();



};

Sprite.prototype.checkWallCollision = function(){
    if (this.controlled == false) { //checking left
        if ((this.pos[0] - this.radius) < 0) {
            this.velocity[0] = -this.velocity[0];
            this.pos[0] = this.radius;

            // check for a goal from p2
            if(this.type == "non-player-object" &&
                this.pos[1] > canvas.clientHeight/2.0 -(this.radius*2)
                && this.pos[1] < canvas.clientHeight/2.0 +(this.radius*2)){
                var player2score = document.getElementById("scorep2");
                var currentp2score = parseInt(player2score.textContent);
                player2score.innerHTML ="" +(currentp2score+1);

                this.velocity = [0,0,0];  //TODO: remove duplicate code, and apply state changes
                this.pos = new Float32Array(this.initPos);

            }

        } else
        // checking right
        if ((this.pos[0] + this.radius) > canvas.clientWidth) {
            this.velocity[0] = -this.velocity[0];
            this.pos[0] = canvas.clientWidth - this.radius;

            // check for a goal from p1
            if(this.type == "non-player-object" &&
                this.pos[1] > canvas.clientHeight/2.0 -(this.radius*2)
                && this.pos[1] < canvas.clientHeight/2.0 +(this.radius*2)){
                var player1score = document.getElementById("scorep1");
                var currentp1score = parseInt(player1score.textContent);
                player1score.innerHTML ="" +(currentp1score+1);

                this.velocity = [0,0,0];
                this.pos = new Float32Array(this.initPos);

            }
        }
        // checking bottom
        if ((this.pos[1] - this.radius) < 0) {
            this.velocity[1] = -this.velocity[1];
            this.pos[1] = this.radius;

        } else
        // checking top
        if ((this.pos[1] + this.radius) > canvas.clientHeight) {
            this.velocity[1] = -this.velocity[1];
            this.pos[1] = canvas.clientHeight - this.radius;
        }
    } else if(this.controlled == true){  // no bouncing

        if ((this.pos[0] - this.radius) < 0) {
            //this.velocity[0] = -this.velocity[0];
            this.pos[0] = this.radius;

        } else
        // checking right
        if ((this.pos[0] + this.radius) > canvas.clientWidth) {
            //this.velocity[0] = -this.velocity[0];
            this.pos[0] = canvas.clientWidth - this.radius;

        }
        // checking bottom
        if ((this.pos[1] - this.radius) < 0) {
            //this.velocity[1] = -this.velocity[1];
            this.pos[1] = this.radius;

        } else
        // checking top
        if ((this.pos[1] + this.radius) > canvas.clientHeight) {
            //this.velocity[1] = -this.velocity[1];
            this.pos[1] = canvas.clientHeight - this.radius;
        }

    }
};
Sprite.prototype.capMaxVelocity = function(){ //TODO: maybe switch to vector math

    if (this.controlled == false) {
        if (Math.abs(this.velocity[0]) > this.maxVelocity) {  // cap to max velocity
            if (this.velocity[0] < 0) {

                this.velocity[0] = -this.maxVelocity;

            } else if (this.velocity[0] > 0) {

                this.velocity[0] = this.maxVelocity;
            }
        }

        if (Math.abs(this.velocity[1]) > this.maxVelocity) {
            if (this.velocity[1] < 0) {

                this.velocity[1] = -this.maxVelocity;

            } else if (this.velocity[1] > 0) {

                this.velocity[1] = this.maxVelocity;
            }
        }
    }

};
Sprite.prototype.applyTransformation = function(vertices){

   return vec3.forEach(vertices,0,0,0,
        function(out, v3, arg){
            vec3.transformMat4(out,v3,arg);
        },this.mvMatrix);
};

Sprite.prototype.applyScale = function(){
    var vertices =
        [ -1.0, 1.0, 0.0, //tleft
            1.0, 1.0, 0.0,    //tright
            -1.0, -1.0, 0.0,  //bleft

            1.0, -1.0, 0.0,    //bright
            -1.0, -1.0, 0.0,  //bleft
            1.0, 1.0, 0.0    //tright
        ];

    return vec3.forEach(vertices,0,0,0,
        function(out, v3, arg){
            vec3.multiply(out,v3,arg);
        },this.scaleXYZ);
};

Sprite.prototype.applyUVMapping = function(){

    var row, col;
    row = this.row;
    col = (atlasHeight - 1)- this.col; // invert the y direction
    // row and col are zero indexed


    var texWide = 1.0 / atlasWidth ;
    var texHigh = 1.0 / atlasHeight ;
    var startX = row * texWide;
    var startY = col * texHigh;
    var endX = startX + texWide;
    var endY = startY + texHigh;

    var UVList = [
        startX,endY, // 0,1  tleft
        endX,endY, // 1,1    tright
        startX,startY, // 0,0 bleft

        endX,startY, // 1,0    bright
        startX,startY, // 0,0 bleft
        endX,endY // 1,1    tright
    ];

    return UVList;
};

/**Example Usage
 var myObj = new Sprite(); // new object instance

 myObj.publicMethod();
 Sprite.staticMethod();

 reference:
 https://developers.google.com/speed/articles/optimizing-javascript?hl=es&csw=1
 */