var clickNumber = 0;
var isMute = false;
var isTrailing = false;

var beginFlag = false;

$(document).ready(function() {
    // Change GitHub logo on hover
    $("#github_logo").hover(function() {
        $("#github_logo").attr("src", "web/assets/github_hover.png");
    }, function() {
        $("#github_logo").attr("src", "web/assets/github_default.png");
    });

    // Change header logo on hover
    $("#header_logo").hover(function() {
        $("#header_logo").attr("src", "web/assets/header_logo_hover.png");
    }, function() {
        $("#header_logo").attr("src", "web/assets/header_logo.png");
    });

    // Change volume icon on hover
    $("#volume_icon").hover(function() {
        renderVolumeImage(true);
    }, function() {
        renderVolumeImage(false);
    });

    // Change trail icon on hover
    $("#trail_icon").hover(function() {
        renderTrailImage(true);
    }, function() {
        renderTrailImage(false);
    });

    // Register mouse click on canvas
    $(document).on("click", "canvas", function() {
        onCanvasClick();
    });

    // Register mouse click on UI elements
    $(document).on("click", ".ui_item", function() {
        console.log("Clicked");
        //clickNumber++;
        // print id of element
        console.log($(this).attr("id"));

        var id = $(this).attr("id");
        if (id == "volume_icon") {
            isMute = !isMute;
            renderVolumeImage(true);
            
        }
        else if (id == "trail_icon") {
            isTrailing = !isTrailing;
            renderTrailImage(true);
        }
    });
});

class TargetPos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

var flag = true;

let canvasWidth = document.documentElement.clientWidth;
let canvasHeight = document.documentElement.clientHeight;

var target = 0;
var n = 7;
var A = 500;
var W = 100;

function setup() {
    createCanvas(canvasWidth, canvasHeight);
    frameRate(60);
    background(255);
}
  
function draw() {
    renderTrail();
    runPipeline();
    renderTargets(A, W, n);
}

function runPipeline() {
    target = getTargetIdxFromClickNumber(clickNumber, n);
    if (clickNumber == n + 1) {
        console.log("Done");
        clickNumber = 0;
        beginFlag = false;
    }
}

function onCanvasClick() {
    var correct = isClickCorrect();
    print(correct);
    if (correct && !beginFlag) {
        beginFlag = true;
    }
    if (beginFlag) {
        clickNumber++;
    }
}

function isClickCorrect() {
    let thetaX = 360 / n;
    var x = (width / 2) + cos(radians(target * thetaX)) * A;
    var y = (height / 2) + sin(radians(target * thetaX)) * A;

    var dist = sqrt(pow(mouseX - x, 2) + pow(mouseY - y, 2));
    console.log(dist);
    if (dist < W / 2) {
        return true;
    }
    else {
        return false;;
    }
}

// Check if space is pressed
function keyPressed() {
    if (keyCode === 32) {
        isTrailing = !isTrailing;
        renderTrailImage(false);
    }
}

function renderTrail() {
    if (!isTrailing || !beginFlag) {
        background(255);
    }
    noStroke();
    fill("#AAAAAA");
    circle(mouseX, mouseY, 5);
}

/*
 * Renders the targets for the Fitt's Law experiment.
 *
 * Parameters
 * A: (Integer) Amplitude, defined as the distance between the centers of the screen and each target
 * W: (Integer) Width (radius) of the targets
 * n: (Integer) Number of targets
 * 
 */
function renderTargets(A, W, n) {
    let thetaX = 360 / n;
    for (var i = 0; i < n; i++) {
        var x = (width / 2) + cos(radians(i * thetaX)) * A;
        var y = (height / 2) + sin(radians(i * thetaX)) * A;

        stroke("#181818");
        strokeWeight(3);
        fill("#DDDDDD");
        if (i == target) {
            fill("#3D9970");
        }
        circle(x, y, W);
    }
}

/*
 * Calculates the index of the next target.
 *
 * Parameters
 * c: (Integer) Click number
 * n: (Integer) Number of targets
 * 
 * Returns
 * (Integer) Index of the next target
 * 
 */
function getTargetIdxFromClickNumber(c, n) {
    var marker1 = -1;
    var marker2 = n / 2;
    if (n % 2 == 1) {
        marker2 = (n - 1) / 2;
    }
    var targetIdx = -1;

    for (var i = 0; i <= c; i++) {
        if (i % 2 == 0) {
            marker1++;
            marker1 = marker1 % n;
            targetIdx = marker1;
        }
        else {
            marker2++;
            marker2 = marker2 % n;
            targetIdx = marker2;
        }
    }

    return targetIdx;
}

// Resizes the canvas to fit the window on resize
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Render volume image based on hover state and click
function renderVolumeImage(isHovering) {
    if (isHovering) {
        if (isMute) {
            $("#volume_icon").attr("src", "web/assets/volume_mute_hover.png");
        }
        else {
            $("#volume_icon").attr("src", "web/assets/volume_on_hover.png");
        }
    } 
    else {
        if (isMute) {
            $("#volume_icon").attr("src", "web/assets/volume_mute_default.png");
        }
        else {
            $("#volume_icon").attr("src", "web/assets/volume_on_default.png");
        }
    }
}

// Render trailing image based on hover state and click
function renderTrailImage(isHovering) {
    if (isHovering) {
        if (isTrailing) {
            $("#trail_icon").attr("src", "web/assets/trail_on_hover.png");
        }
        else {
            $("#trail_icon").attr("src", "web/assets/trail_off_hover.png");
        }
    } 
    else {
        if (isTrailing) {
            $("#trail_icon").attr("src", "web/assets/trail_on_default.png");
        }
        else {
            $("#trail_icon").attr("src", "web/assets/trail_off_default.png");
        }
    }
}

/*
 |----------------------------------------------------
 | HELPER FUNCTIONS
 |----------------------------------------------------
 */

// Generates a random number between min and max (inclusive)
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Performs a get request to the given url and calls the callback function upon success
function getRequest(url, callback)
{
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() { 
        if (request.readyState == 4 && request.status == 200)
            callback(request.responseText);
    }
    request.open("GET", url, true);
    request.send(null);
}

// Performs a post request to the given url and calls the callback function upon success
function postRequest(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() { 
        if (request.readyState == 4 && request.status == 200)
            callback(request.responseText);
    }
    request.open("POST", url, true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send(data);
}