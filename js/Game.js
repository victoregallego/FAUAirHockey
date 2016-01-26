/**
 * Created with Visual Studio 2015 Community.
 * User: VictorE
 * Date: 9/2/13
 * Time: 9:37 PM
 * To change this template use File | Settings | File Templates.
 */

    // constructor function
function Game() {
    var privateVar = 0; // private member only available within the constructor fn

    this.lastUpdateTime = 0;

    this.newVerts = [];
    this.newTexCoords = [];

    perspectiveMatrix = mat4.create();

    this.init();

    // declare and initialize public members

    this.privilegedMethod = function () { // it can access private members
        //..
    };
}

// A 'static method', it's just like a normal function 
// it has no relation with any 'Game' object instance
Game.staticMethod = function () {
};

// public methods
Game.prototype.init = function () {

    this.spriteBatch = [
        // initPos, scaleXYZ, rotationDir, texRow, texCol
        new Sprite([canvas.clientWidth/2,canvas.clientHeight/2-50.0, 0.0],[25.0,25.0,0.0],[0.0,0.0,-1.0],1,1),
        new Sprite([canvas.clientWidth/2,canvas.clientHeight/2+50.0, 0.0],[25.0,25.0,0.0],[0.0,0.0,-1.0],0,1),
        new Sprite([canvas.clientWidth - 40.0,canvas.clientHeight/2, 0.0],[40.0,40.0,0.0],[0.0,0.0,-1.0],1,0),
        new Sprite([40.0,canvas.clientHeight/2,-0.0],[40.0,40.0,0.0],[0.0,0.0,1.0],0,0)

    ];

    this.spriteBatch[2].type = "player-object";
    this.spriteBatch[3].type = "player-object";

    this.state = "playing";

};


Game.prototype.drawScene = function () {
    // the 'this' keyword refers to the object instance
    // you can access only 'privileged' and 'public' members

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // apparently clientWidth/Height is preferred

        mat4.ortho(perspectiveMatrix, canvas.clientLeft, canvas.clientWidth ,canvas.clientTop,canvas.clientHeight,-1,1);

        // draw sprites, sets the modelview
        for (var i = 0; i < this.spriteBatch.length; i++) {
            this.spriteBatch[i].draw();
        }

        // updates the vbo with transformed vertex data
        this.generateVertexBufferData();

        // generate texture coordinate data
        this.generateTextureCoordData();

        // set the shared perspective matrix
        setMatrixUniforms();

        // do the actual draw to the canvas object
        gl.drawArrays(gl.TRIANGLES, 0, 6*this.spriteBatch.length );


        // request the next frame from the browser
        requestAnimationFrame(this.drawScene.bind(this));
};


Game.prototype.updateScene = function () {

    var currentTime = Date.now(); //optimized version, no object creation

    if (this.lastUpdateTime) {

        var delta = currentTime - this.lastUpdateTime;

        for (var i = 0; i < this.spriteBatch.length; i++) {
            this.spriteBatch[i].update(delta);
        }

        this.checkCircleToCircleCollision2(delta);

        this.checkScore();


    }

    this.lastUpdateTime = currentTime;
    //Fixes bug where circles exceed bounds, but return to play field
    // setTimeout(this.updateScene.bind(this), 15);
    if (this.state == "playing") {
        requestAnimationFrame(this.updateScene.bind(this));
    }

};
Game.prototype.checkScore = function (){

    var scorep1 = parseInt(document.getElementById("scorep1").textContent);
    var scorep2 = parseInt(document.getElementById("scorep2").textContent);

    if(scorep1 > 6){

        // end the game, p1 wins
        this.showGameOver("Player 1", "darkblue");

    }else if(scorep2 > 6){

        // end the game, p2 wins
        this.showGameOver("Player 2", "darkred");
    }
};

Game.prototype.showGameOver = function (player,fontcolor){
    this.state = "done";
    var gameOverElement  = document.getElementById("gameover");
    gameOverElement.style.display = "block";
    var playerNameElement = document.getElementById("playername");
    playerNameElement.innerHTML = player + " Wins";
    playerNameElement.style.color = fontcolor;
    console.log(" Game Over called, "+player+" wins.");
};

Game.prototype.checkCircleToCircleCollision1 = function(){

    // look for collisions
    for (var i = 0; i < this.spriteBatch.length; i++) {

        for (var j = 0; j < this.spriteBatch.length; j++) {

            if (this.spriteBatch[i] != this.spriteBatch[j]) {

                var distance = vec3.distance(this.spriteBatch[i].pos, this.spriteBatch[j].pos);
                var combinedRadii = this.spriteBatch[i].radius + this.spriteBatch[j].radius;

                if (distance < combinedRadii) {

                    var dxdy = vec3.create();

                    vec3.subtract(dxdy, this.spriteBatch[i].pos, this.spriteBatch[j].pos);

                    if (Math.abs(dxdy[0]) > Math.abs(dxdy[1])) {
                        if (this.spriteBatch[i].collisionX == false) {
                            this.spriteBatch[i].collisionX = true;
                        }
                        if (this.spriteBatch[j].collisionX == false) {
                            this.spriteBatch[j].collisionX = true;
                        }

                    } else {
                        if (this.spriteBatch[i].collisionY == false) {
                            this.spriteBatch[i].collisionY = true;
                        }
                        if (this.spriteBatch[j].collisionY == false) {
                            this.spriteBatch[j].collisionY = true;
                        }
                    }

                }
            }

        }

    }
};

Game.prototype.checkCircleToCircleCollision2 = function(delta){

    // look for collisions
    for (var i = 0; i < this.spriteBatch.length; i++) {

        for (var j = 0; j < this.spriteBatch.length; j++) {

            if (this.spriteBatch[i] != this.spriteBatch[j]) {

                var distance = vec3.distance(this.spriteBatch[i].pos, this.spriteBatch[j].pos);
                var combinedRadii = this.spriteBatch[i].radius + this.spriteBatch[j].radius;

                if (distance < combinedRadii) {

                    var mass1= this.spriteBatch[i].mass;
                    var mass2= this.spriteBatch[j].mass;
                    var massSum = mass1 + mass2;
                    var velX1 = this.spriteBatch[i].velocity[0];
                    var velX2 = this.spriteBatch[j].velocity[0];
                    var velY1 = this.spriteBatch[i].velocity[1];
                    var velY2 = this.spriteBatch[j].velocity[1];

                    var newVelX1 = (velX1 * (mass1 - mass2) + (2 * mass2 * velX2)) / massSum;
                    var newVelX2 = (velX2 * (mass2 - mass1) + (2 * mass1 * velX1)) / massSum;
                    var newVelY1 = (velY1 * (mass1 - mass2) + (2 * mass2 * velY2)) / massSum;
                    var newVelY2 = (velY2 * (mass2 - mass1) + (2 * mass1 * velY1)) / massSum;

                    this.spriteBatch[i].velocity[0] = newVelX1;
                    this.spriteBatch[j].velocity[0] = newVelX2;
                    this.spriteBatch[i].velocity[1] = newVelY1;
                    this.spriteBatch[j].velocity[1] = newVelY2;

                    this.spriteBatch[i].capMaxVelocity();
                    this.spriteBatch[j].capMaxVelocity();

                    this.spriteBatch[i].pos[0] += this.spriteBatch[i].velocity[0] * (delta/1000.0);
                    this.spriteBatch[j].pos[0] += this.spriteBatch[j].velocity[0] * (delta/1000.0);
                    this.spriteBatch[i].pos[1] += this.spriteBatch[i].velocity[1] * (delta/1000.0);
                    this.spriteBatch[j].pos[1] += this.spriteBatch[j].velocity[1] * (delta/1000.0);

                }
            }

        }

    }
};

Game.prototype.generateVertexBufferData = function(){

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObj);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // build the transformed vertex array

    this.newVerts.length = 0;

    // applies the model view scale and transformation
    for (var i = 0; i < this.spriteBatch.length; i++) {
        this.newVerts.push.apply(this.newVerts,this.spriteBatch[i].applyTransformation(
            this.spriteBatch[i].applyScale()
        ));
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.newVerts), gl.DYNAMIC_DRAW);
};

Game.prototype.generateTextureCoordData = function(){


    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferObj);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // build the texture coordinate array
    this.newTexCoords.length = 0;


    // applies uv mappings for each vertex in each sprite
    for (var i = 0; i < this.spriteBatch.length; i++) {
        this.newTexCoords.push.apply(this.newTexCoords,this.spriteBatch[i].applyUVMapping());
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.newTexCoords), gl.DYNAMIC_DRAW);
};

/** Example Usage **
 var myObj = new Game(); // new object instance

 myObj.publicMethod();
 Game.staticMethod();

 reference:
 https://developers.google.com/speed/articles/optimizing-javascript?hl=es&csw=1
 **/

//
// Matrix utility variables
//

var perspectiveMatrix;

//
// Matrix utility functions
//

function setMatrixUniforms() {

    // perspective matrix is shared by all sprites
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false,perspectiveMatrix);
}



function toRadians(angle){
    return angle * Math.PI / 180.0;
}

