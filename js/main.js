/**
 * Created with Visual Studio 2015 Community.
 * User: VictorE
 * Date: 9/2/13
 * Time: 6:12 PM
 * To change this template use File | Settings | File Templates.
 */

// for webgl context
var canvas;
var gl;

// for shaders
var shaderProgram;
var vertexPositionAttribute;
var scaleUniformLocation;
var textureCoordAttribute;

// VBO for vertices sent to the gpu
var vertexBufferObj;

// for dynamic texture coordinates
var texture;
var texLoc;
var img;
var texCoordBufferObj;

// for texture atlas properties
var atlasSrc = 'textures/air_hockey_atlas.png';
var atlasWidth = 2;  // how many sprites wide
var atlasHeight = 2; // how many sprites high

// game object
var gameobj;

// mouse events
var mouseEventStack = [];
var isMouseDown = false;


function main(){

    canvas = document.getElementById("glcanvas");

    initWebGL(); //initialize GL context

    if (gl) {

        // Set clear color to black, fully opaque
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        // Enable depth testing
        gl.enable(gl.DEPTH_TEST);
        // Near things obscure far things, default gl,lequal , gl.notequal gets rid of border
        gl.depthFunc(gl.LEQUAL);
        // Clear the color as well as the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // Initialize the shaders; this is where all the lighting for the
        // vertices and so forth is established.

        initShaders();

        // Here's where we call the routine that builds all the objects
        // we'll be drawing.

        initBuffers();

        // added for textures
        initTextures();

    }


    // create key and mouse event bindings
    canvas.onmousedown = mouseDown;
    canvas.onmouseup = mouseUp;
    window.onmouseup = mouseUp;
    canvas.onmousemove = mouseMove;

    // create touch event bindings
    canvas.addEventListener("touchstart",touchDown, false);
    canvas.addEventListener("touchend",mouseUp, false);
    window.addEventListener("touchend",mouseUp, false);
    canvas.addEventListener("touchmove",touchMove, false);
}

function initWebGL() {

    //init global variable gl to null

    gl = null;

    try {

        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    } catch (e) {

    }

    // If we don't have a GL context, give up now
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");

    }
}


function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    // Create the shader program

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }

    gl.useProgram(shaderProgram);

    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    scaleUniformLocation = gl.getUniformLocation(shaderProgram, "uScale");

    textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTexCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);

}

function getShader(gl, id) {
    var shaderScript, theSource, currentChild, shader;

    shaderScript = document.getElementById(id);

    if (!shaderScript) {
        return null;
    }

    theSource = "";
    currentChild = shaderScript.firstChild;

    while (currentChild) {
        if (currentChild.nodeType == currentChild.TEXT_NODE) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }

    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        // Unknown shader type
        return null;
    }

    gl.shaderSource(shader, theSource);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function testCode() {
    var newMat = mat4.create();
    var newVec = vec3.create();


    console.log(gl.drawingBufferWidth);
    console.log(gl.drawingBufferHeight);
}

function initBuffers() {
    vertexBufferObj = gl.createBuffer();


    // provide texture coordinates for the quad.
    texCoordBufferObj = gl.createBuffer();

    // For placing Texture upright map coordinates as shown below:

    // .---->
    // |   /|
    // |  / |
    // | /  |
    // >----$

    // Where start = . and end = $

}

function initTextures() {

    // 1. Create the texture
    texture = gl.createTexture();

    img = new Image();

    img.onload = function() {

        // 2. Set the active texture (For a different texture add new index)
        gl.activeTexture(gl.TEXTURE0);
        // 3. Bind the created texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // 4. Get a reference to the sampler in the fragment shader program
        texLoc = gl.getUniformLocation(shaderProgram, "uSampler");
        gl.uniform1i(texLoc, 0 ); // the index passed is the active texture

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // corrects t-axis inversion


        // 5. Load the image into the active texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE, img);
        // 6. Set some parameters for the active texture
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

        // used to render alpha channel
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferObj);
        gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        // game assets are ready
        ready();
    };

    img.src = atlasSrc;
}

function ready(){

    gameobj = new Game();

    gameobj.updateScene();

    gameobj.drawScene();
}

function restart(){

    gameobj.init();
    var player1score = document.getElementById("scorep1");
    var player2score = document.getElementById("scorep2");

    player1score.innerHTML = "0";
    player2score.innerHTML = "0";

    var gameOverElement = document.getElementById("gameover");
    gameOverElement.style.display = "none";

    gameobj.updateScene();
}


function mouseDown(e){

    var mouseEventX = e.clientX;
    var mouseEventY = canvas.clientHeight - e.clientY; // reverse y coordinates for webgl

    e.preventDefault();

    handleDownEvent(mouseEventX, mouseEventY, e);
}

function mouseUp(){

    gameobj.spriteBatch[3].velocity = [0.0,0.0,0.0];
    gameobj.spriteBatch[3].rotDir = [0.0,0.0,1.0];
    gameobj.spriteBatch[3].controlled = false;

    mouseEventStack.length = 0;
    // stop drag
    isMouseDown = false;

}

function mouseMove(e){

    var mouseEventX = e.clientX;
    var mouseEventY = canvas.clientHeight - e.clientY;

    e.preventDefault();

    handleMoveEvent(e, mouseEventX, mouseEventY);
}


function touchDown(e){

    var mouseEventX = parseInt(e.changedTouches[0].clientX);
    var mouseEventY = canvas.clientHeight - parseInt(e.changedTouches[0].clientY); // reverse y coordinates for webgl

    e.preventDefault();

    handleDownEvent(mouseEventX, mouseEventY, e);
}


function touchMove(e){


    var mouseEventX = parseInt(e.changedTouches[0].clientX);
    var mouseEventY = canvas.clientHeight - parseInt(e.changedTouches[0].clientY);

    e.preventDefault();

    handleMoveEvent(e, mouseEventX, mouseEventY);
}

function handleDownEvent(mouseEventX, mouseEventY, e) {
    var mouseEventXYZ = [mouseEventX, mouseEventY, 0.0];

    var mouseEventDistance = vec3.distance(gameobj.spriteBatch[3].pos, mouseEventXYZ);

    if (mouseEventDistance < gameobj.spriteBatch[3].radius) {
        isMouseDown = true;
        gameobj.spriteBatch[3].rotDir = [0.0,0.0,0.0];
        gameobj.spriteBatch[3].controlled = true;
    } else {
        isMouseDown = false;
    }
}

function handleMoveEvent(e, mouseEventX, mouseEventY) {
    if (isMouseDown == true) {

        gameobj.spriteBatch[3].rotation = 0.0; // TODO: Should do state change

        var mouseEventXYZ = [mouseEventX, mouseEventY, 0.0];

        mouseEventStack.push(mouseEventXYZ);

        if (mouseEventStack.length >= 3) {

            var currentPosX = gameobj.spriteBatch[3].pos[0];
            var currentPosY = gameobj.spriteBatch[3].pos[1];

            var mouseEventPos1 = mouseEventStack.pop();
            var mouseEventPos2 = mouseEventStack.pop();
            var mouseEventPos3 = mouseEventStack.pop();

            var directionX = mouseEventPos1[0] - mouseEventPos3[0];
            var directionY = mouseEventPos1[1] - mouseEventPos3[1];

            if (directionX < 0) {

                directionX = -1;

            } else if (directionX > 0) {

                directionX = 1;
            }

            if (directionY < 0) {

                directionY = -1;

            } else if (directionY > 0) {

                directionY = 1;
            }


            var distance32 = vec3.distance(mouseEventPos3, mouseEventPos2);
            var distance21 = vec3.distance(mouseEventPos2, mouseEventPos1);

            var avgDistance = (distance32 + distance21) / 2;
            var avgVelocity = avgDistance / 45; // target frame step 15 ms x 3 mouse positions

            // approximating difference from last mouse position and current position of the object by some scalar
            gameobj.spriteBatch[3].velocity[0] = Math.abs(mouseEventPos1[0] - currentPosX) * avgVelocity * directionX * 60;
            gameobj.spriteBatch[3].velocity[1] = Math.abs(mouseEventPos1[1] - currentPosY) * avgVelocity * directionY * 60;

        }


    }
}
