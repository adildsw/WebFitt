class Task {
    constructor(A, W) {
        this.A = A;
        this.W = W;
    }
}

var a_list = [100, 200];
var w_list = [40, 80];
var n = 7;
var tasks = [];
var taskIdx = 0;

var clickNumber = 0;

var isMute = false;
var isTrailing = false;
var isTaskRunning = false;
var isTaskFinished = false;
var beginFlag = false;

var clickData = [];
var aggregateResults = [];
var servdown = false;

$(document).ready(function() {
    if ($("#server-download").data()["servdown"] == "True") {
        servdown = true;
    }

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
        if (isTaskRunning) {
            onCanvasClick();
        }
    });

    // Write jquery function to check keypress
    $(document).keypress(function(e) {
        if (e.which == 32) {
            beginApp([100], [50, 90]);
        }
    });

    // Register mouse click on UI elements
    $(document).on("click", ".ui_item", function() {
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

/*
 * Starts the WebFitt Application.
 *
 * Parameters
 * a_list: (Integer[]) List of amplitude values
 * w_list: (Integer[]) List of width values
 * 
 */
function beginApp(a_list, w_list) {
    taskIdx = 0;
    clickNumber = 0;
    tasks = generateTaskSequence(a_list, w_list);
    if (tasks.length == 0) {
        alert("ERROR: No task to run.");
    }
    else {
        isTaskRunning = true;
    }
}

function preload() {
    robotoLightFont = loadFont("web/assets/roboto-light.ttf");
    robotoRegularFont = loadFont("web/assets/roboto-regular.ttf");
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
    background(255);
}
  
function draw() {
    if (isTaskRunning) {
        renderTrail();
        runPipeline();
        renderInfoText();
    }
    else if (isTaskFinished) {
        renderTaskCompleteMessage();
    }
    else {
        background(255);
    }
}

function runPipeline() {
    var A = tasks[taskIdx].A;
    var W = tasks[taskIdx].W;
    var mainTarget = getTargetIdxFromClickNumber(clickNumber, n);
    renderTargets(A, W, n, mainTarget);

    if (clickNumber == n + 1) {
        if (taskIdx < tasks.length - 1) {
            taskIdx++;
        }
        else {
            isTaskRunning = false;
            isTaskFinished = true;
        }
        clickNumber = 0;
        beginFlag = false;
    }
}

function onCanvasClick() {
    var A = tasks[taskIdx].A;
    var W = tasks[taskIdx].W;
    var mainTarget = getTargetIdxFromClickNumber(clickNumber, n);

    var correct = isClickCorrect(A, W, n, mainTarget);
    if (correct && !beginFlag) {
        beginFlag = true;
    }
    if (beginFlag) {
        clickNumber++;
    }
}

/*
 * Generates a randomized sequence of tasks.
 *
 * Parameters
 * a_list: (Integer[]) List of amplitude values
 * w_list: (Integer[]) List of width values
 * 
 * Returns
 * (Task[]) Randomized sequence of tasks
 * 
 */
function generateTaskSequence(a_list, w_list) {
    // Creating an array with a cross product of a_list and w_list
    var taskSequence = [];
    for (var i = 0; i < a_list.length; i++) {
        for (var j = 0; j < w_list.length; j++) {
            taskSequence.push(new Task(a_list[i], w_list[j]));
        }
    }

    // Shuffling the array
    for (var i = taskSequence.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = taskSequence[i];
        taskSequence[i] = taskSequence[j];
        taskSequence[j] = temp;
    }

    return taskSequence;
}

/*
 * Checks if the correct target is clicked.
 * 
 * Parameters
 * A: (Integer) Amplitude, defined as the distance between the centers of the screen and each target
 * W: (Integer) Width (radius) of the targets
 * n: (Integer) Number of targets
 * mainTarget: (Integer) Index of the main target
 * 
 * Returns
 * (Boolean) True if the correct target is clicked, false otherwise
 */
function isClickCorrect(A, W, n, mainTarget) {
    let thetaX = 360 / n;
    var x = (width / 2) + cos(radians(mainTarget * thetaX)) * A;
    var y = (height / 2) + sin(radians(mainTarget * thetaX)) * A;

    var dist = sqrt(pow(mouseX - x, 2) + pow(mouseY - y, 2));
    if (dist < W / 2) {
        return true;
    }
    else {
        return false;;
    }
}

// Maps key pres to UI controls
function keyPressed() {
    if (key === 't') {
        isTrailing = !isTrailing;
        renderTrailImage(false);
    }
    else if (key == 's') {
        isMute = !isMute;
        renderVolumeImage(false);
    }
}

// Renders trail on mouse cursor
function renderTrail() {
    if (!isTrailing || !beginFlag) {
        background(255);
    }
    if (isTrailing && beginFlag) {
        noStroke();
        fill("#AAAAAA");
        circle(mouseX, mouseY, 2);
        stroke("#AAAAAA");
        strokeWeight(2);
        line(mouseX, mouseY, pmouseX, pmouseY);
    }
}

// Renders task information text
function renderInfoText() {
    noStroke();
    textSize(28);
    fill(0);
    textFont(robotoRegularFont);
    textAlign(LEFT);
    text("Task " + (taskIdx + 1) + " of " + tasks.length, width - 350, 50);
    textFont(robotoLightFont);
    text("Amplitude " + tasks[taskIdx].A + " | Width " + tasks[taskIdx].W, width - 350, 85);
}

// Renders a message when the task(s) are complete
function renderTaskCompleteMessage() {
    background(255);
    noStroke();
    textSize(64);
    fill(0);
    textFont(robotoLightFont);
    textAlign(CENTER, CENTER);
    if (tasks.length == 1) {
        text("Task Complete!", width / 2, height / 2);
    }
    else {
        text("Tasks Complete!", width / 2, height / 2);
    }

    if (servdown) {
        textSize(16);
        text("A copy of your result is uploaded to the server.", width / 2, (height / 2) + 60);
    }
}

function storeClickData() {
    var data = [];
}

function computeAggregateResults() {
    if (clickData.length != tasks.length * n) {
        alert("ERROR: Data is corrupt.");
        return;
    }

    for (var i = 0; i < tasks.length; i++) {
        var aggRes = [];
        aggRes.push(participantCode);
        aggRes.push(sessionCode);
        aggRes.push(conditionCode);
        aggRes.push(handDominance);
        aggRes.push(pointingDevice);
        aggRes.push(deviceExperience);
        aggRes.push(tasks[i].A);
        aggRes.push(tasks[i].W);
        aggRes.push(n);
        aggRes.push(i);

    }
}

function generateResults() {
    // Result Types: Individual Clicks/Task, Aggregate Results
    
    // Individual Clicks/Task Headers
    // ---------------------------
    // Participant Code, Session Code, Condition Code, Hand Dominance, Pointing Device, Device Experience, A, W, n, Task Number, Click Number, Click Time, SourceX, SourceY, TargetX, TargetY, ClickX, ClickY, Source-Target Distance, dx, isCorrect

    // Aggregate Results Headers
    // ---------------------------
    // Participant Code, Session Code, Condition Code, Hand Dominance, Pointing Device, Device Experience, A, W, n, Task Number, Mean Time, Error %, SDx, Average Source-Target Distance, Throughput

    aggregateResults = [];
    for
}

/*
 * Renders the targets for the Fitt's Law experiment.
 *
 * Parameters
 * A: (Integer) Amplitude, defined as the distance between the centers of the screen and each target
 * W: (Integer) Width (radius) of the targets
 * n: (Integer) Number of targets
 * mainTarget: (Integer) Index of the main target
 * 
 */
function renderTargets(A, W, n, mainTarget) {
    let thetaX = 360 / n;
    
    // Clearing circle inner area
    for (var i = 0; i < n; i++) {
        var x = (width / 2) + cos(radians(i * thetaX)) * A;
        var y = (height / 2) + sin(radians(i * thetaX)) * A;
        noStroke();
        fill("#FFFFFF");
        circle(x, y, W);
    }

    // Creating circles with transparent inner areas
    for (var i = 0; i < n; i++) {
        var x = (width / 2) + cos(radians(i * thetaX)) * A;
        var y = (height / 2) + sin(radians(i * thetaX)) * A;
        stroke("#181818");
        strokeWeight(3);
        noFill();
        if (i == mainTarget) {
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