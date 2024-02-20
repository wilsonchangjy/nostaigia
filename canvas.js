// Variables
const imageCanvas = document.querySelector("#image-canvas");
const imageContext = imageCanvas.getContext("2d");
const interactionCanvas = document.querySelector("#interaction-canvas");
const interactionContext = interactionCanvas.getContext("2d");
const previewCanvas = document.createElement("canvas");
const previewContext = previewCanvas.getContext("2d");
const editCanvas = document.createElement("canvas");
const editContext = editCanvas.getContext("2d");
const predictCanvas = document.createElement("canvas");
const predictContext = predictCanvas.getContext("2d");
const instructCanvas = document.createElement("canvas");
const instructContext = instructCanvas.getContext("2d");

var objectArray = [];
var focus = null;
var editing;
var blink;
var originX;
var originY;
var fileName;

var scaledFont;
var scaledLine;

var imageArray = [];
var historyArray = [];
var galleryTimeout;

class YoloObject {
    constructor(xStart, yStart, xEnd, yEnd, label) {
        this.xPoint = xStart;
        this.yPoint = yStart;

        this.width = xEnd - xStart;
        this.height = yEnd - yStart;

        this.xMidPoint = xStart + this.width / 2;
        this.yMidPoint = yStart + this.height / 2;

        this.label = label;
        this.keyframe = this.frameCounter = 0;
    }

    mark() {
        previewContext.fillRect(this.xMidPoint - 16, this.yMidPoint - 16, 32, 32);
    }

    hover() {
        editContext.fillText(this.label, this.xPoint, this.yPoint - 8);
        editContext.strokeRect(this.xPoint, this.yPoint, this.width, this.height);
    }

    click() {
        clearContext([previewContext, editContext]);

        previewContext.fillStyle = "rgba(69, 151, 247, 0.5)";
        previewContext.fillRect(this.xPoint, this.yPoint, this.width, this.height);
        editContext.fillText(this.label, this.xPoint, this.yPoint - 8);

        updateCanvas();
    }

    edit(text) {
        editContext.fillText(text, this.xPoint, this.yPoint - 8);
        updateCanvas();
    }

    listPredictions(list, prediction) {
        if (!list || list.length < 1) { clearInstructions([8]); return; }

        for (const text of list) {
            predictContext.fillText(text, this.xPoint, this.yPoint + ((list.indexOf(text) + 1) * 16));
        }

        if (prediction != null && prediction >= 0) {
            predictContext.strokeRect(this.xPoint, this.yPoint + prediction * 16 + 4, this.width, 16);
        }

        addInstructions([8]);
        updateCanvas();
    }
}

// Initialise
$("#mode-toggle").change(() => {
    if ($("#mode-toggle").prop("checked")) initialiseInteractive();
    else initialiseGallery(), saveData();
});

window.addEventListener("keydown", (event) => {
    if (event.key == " " || event.key == "ArrowUp" || event.key == "ArrowDown") event.preventDefault();
});

$("#mode-toggle").prop("checked", false);
$("#mode-toggle").hide();

compileImages();

alert("Welcome to nostAIgia. This interactive experience is still in beta and we seek your understanding with any issues or bugs encountered.");

// Functions
async function visualiseOutput(file) {
    const image = new Image();
    // image.src = URL.createObjectURL(file);
    image.src = file;
    image.onload = async() => {
        const ratio = image.height / window.innerHeight;
        const boxes = await readImage(file);

        loadImage(image, ratio);
        loadUI(boxes, ratio);

        updateCanvas();
    };

    fileName = new URL(file).pathname.split('/').pop();
    fileName = fileName.replace(".jpg", "");
}

function loadImage(image, ratio) {
    imageCanvas.height = window.innerHeight;
    imageCanvas.width = image.width / ratio;

    if ((image.width / image.height) >= 1.75) { 
        imageCanvas.width = window.innerWidth;
        imageCanvas.height = image.height * (imageCanvas.width / image.width);
    }

    interactionCanvas.width = previewCanvas.width = editCanvas.width = predictCanvas.width = instructCanvas.width = imageCanvas.width;
    interactionCanvas.height = previewCanvas.height = editCanvas.height = predictCanvas.height = instructCanvas.height = imageCanvas.height;
    
    $("canvas").css("--width", imageCanvas.width + "px");
    $("canvas").css("--height", imageCanvas.height + "px");
    generatePixelImage(image, ratio);
}

function loadUI(boxes, ratio) {
    scaledFont = (window.innerWidth / 1440) * 17.15;
    scaledLine = (window.innerWidth / 1440) * 2;

    previewContext.strokeStyle = editContext.strokeStyle = "#4597F7";
    previewContext.fillStyle = editContext.fillStyle = "#4597F7";
    previewContext.lineWidth = editContext.lineWidth = predictContext.lineWidth = scaledLine;
    previewContext.font = editContext.font = predictContext.font = instructContext.font = `${scaledFont}px sans-serif`;

    predictContext.strokeStyle = "#ffffff";
    predictContext.fillStyle = instructContext.fillStyle = "#ffffff";

    objectArray = [];

    boxes.forEach(([xStart, yStart, xEnd, yEnd, label], index) => {
        const object = new YoloObject(xStart / ratio, yStart / ratio, xEnd / ratio, yEnd / ratio, label);
        objectArray.push(object);
    });

    keyframe = 0;
    if ($("#mode-toggle").prop("checked")) animateInteractObjects();
    else animateGalleryObjects(), previewContext.lineWidth = scaledLine;
}

function clearContext(queue) {
    queue.forEach(context => {
        context.clearRect(0, 0, interactionCanvas.width, interactionCanvas.height);
    });
}

function updateCanvas() {
    interactionContext.clearRect(0, 0, interactionCanvas.width, interactionCanvas.height);
    interactionContext.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
    interactionContext.drawImage(editCanvas, 0, 0, editCanvas.width, editCanvas.height);
    interactionContext.drawImage(predictCanvas, 0, 0, predictCanvas.width, predictCanvas.height);
    interactionContext.drawImage(instructCanvas, 0, 0, instructCanvas.width, instructCanvas.height);
}

function toggleMode(event) {
    if (event.key == "ArrowLeft" || event.key == "ArrowRight") return
    else if (event.key == "Escape" || event.type == "click") {
        clearInstructions();

        window.removeEventListener("keydown", toggleMode);
        window.removeEventListener("keydown", changeImage);
        interactionCanvas.removeEventListener("mousemove", galleryPrompt);
        interactionCanvas.removeEventListener("click", toggleMode);
    
        $("#mode-toggle").trigger("click");
    }
}

function changeImage(event) {
    if (event.key == "ArrowLeft") previousImage();
    else if (event.key == "ArrowRight") nextImage();
}

async function nextImage() {
    if (imageArray.length <= 0) { compileImages(); return };

    const randomIndex = Math.floor(Math.random() * imageArray.length);
    const randomImage = await fetch("./dataset/training/images/" + imageArray[randomIndex])
    .then((response) => {
        return response.url;
    });

    imageArray.splice(randomIndex, 1);
    historyArray.push(randomImage);
    visualiseOutput(randomImage);

    if (!$("#mode-toggle").prop("checked")) {
        galleryTimeout = setTimeout(() => {
            nextImage();
        }, 15000);
    };
}

function previousImage() {
    var lastItem = new URL(historyArray[historyArray.length - 1]).pathname.split('/').pop();
    lastItem = lastItem.replace(".jpg", "");

    if (historyArray.length <= 0) return
    else if (fileName == lastItem) historyArray.pop();

    const lastImage = historyArray.pop();
    visualiseOutput(lastImage);
}

// Interact Functions
function initialiseInteractive() {
    console.log("interactive");

    clearInstructions();
    clearTimeout(galleryTimeout);
    cancelAnimationFrame(animation);

    interactionCanvas.addEventListener("mousemove", mouseInteract);
    interactionCanvas.addEventListener("mousedown", clickInteract);
    window.addEventListener("keydown", toggleMode);
    window.addEventListener("keydown", changeImage);

    interactionCanvas.classList.add("hover-cursor");
    interactionCanvas.classList.remove("hide-cursor");

    previewContext.strokeStyle = "#4597F7";
    previewContext.fillStyle = "#4597F7";
    previewContext.lineWidth = 2;

    addInstructions([0, 2, 10, 11]);
    clearContext([previewContext]);
    drawInteractObjects();
    updateCanvas();
}

function drawInteractObjects() {
    objectArray.forEach(object => {
        object.mark();
    });
}

function mouseInteract(event) {
    const rect = interactionCanvas.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    for (var i = 0; i < objectArray.length; i++) {
        if ((Math.abs(targetX - objectArray[i].xMidPoint) < 16) && (Math.abs(targetY - objectArray[i].yMidPoint) < 16)) {
            interactionCanvas.removeEventListener("mousemove", mouseInteract);
            interactionCanvas.removeEventListener("mousedown", clickInteract);
            interactionCanvas.addEventListener("mousemove", hoverInteract);
            interactionCanvas.addEventListener("click", editInteract);

            focus = objectArray[i];
            objectArray[i].hover();
            objectArray.splice(i, 1);

            clearContext([previewContext]);
            drawInteractObjects();
            clearInstructions();
            addInstructions([3]);
            updateCanvas();

            interactionCanvas.classList.add("hide-cursor");

            break;
        }

        // Finding distance based on click to radius of a circle
        // const distance = Math.sqrt(((targetX - xPoint) * (targetX - xPoint)) + ((targetY - yPoint) * (targetY - yPoint)));
        // console.log(distance);
    }
}

function hoverInteract(event) {
    const rect = interactionCanvas.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    if ((Math.abs(targetX - focus.xMidPoint) >= 16) || (Math.abs(targetY - focus.yMidPoint) >= 16)) {
        interactionCanvas.removeEventListener("mousemove", hoverInteract);
        interactionCanvas.removeEventListener("click", editInteract);
        interactionCanvas.addEventListener("mousemove", mouseInteract);
        interactionCanvas.addEventListener("mousedown", clickInteract);

        objectArray.push(focus);
        focus = null;

        clearContext([previewContext, editContext]);
        drawInteractObjects();
        clearInstructions();
        addInstructions([0, 2, 10, 11]);
        updateCanvas();

        interactionCanvas.classList.remove("hide-cursor");
        interactionCanvas.classList.add("hover-cursor");
    }
}

function editInteract(event) {
    const rect = interactionCanvas.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    if ((Math.abs(targetX - focus.xMidPoint) < 16) && (Math.abs(targetY - focus.yMidPoint) < 16)) {
        interactionCanvas.removeEventListener("mousemove", hoverInteract);
        interactionCanvas.removeEventListener("mousemove", mouseInteract);
        interactionCanvas.removeEventListener("click", editInteract);
        window.addEventListener("keydown", keyboardInteract);
        window.removeEventListener("keydown", toggleMode);
        window.removeEventListener("keydown", changeImage);

        focus.click();

        editing = focus.label;
        clearInstructions();
        addInstructions([4, 5, 6, 7]);
        blinkCursor();
    }
}

function keyboardInteract(event) {
    const targetKey = event.key;
    var text = focus.label;

    if (targetKey == "Backspace") text = text.slice(0, -1);
    else if (targetKey == "Enter") {selectPrediction(text); cancelInteract(false); return;}
    else if (targetKey == "Escape") {cancelInteract(true); return;}
    else if (targetKey == "ArrowDown" || targetKey == "ArrowUp") {predictInteract(event.keyCode); return}
    else if (event.keyCode > 64 && event.keyCode < 91) text += targetKey.toLowerCase().trim();
    else return;

    focus.label = text;

    clearContext([editContext, predictContext]);
    focus.edit(text);
    focus.listPredictions(predictText(text), predictInput);
}

function cancelInteract(reset) {
    if (reset) focus.label = editing;
    if (focus.label == "") focus = null;

    editing = null;
    window.removeEventListener("keydown", keyboardInteract);
    window.addEventListener("keydown", toggleMode);
    window.addEventListener("keydown", changeImage);

    previewContext.fillStyle = "#4597F7";
    clearContext([previewContext, editContext, predictContext]);

    if (focus) {
        focus.hover();

        interactionCanvas.addEventListener("mousemove", hoverInteract);
        interactionCanvas.addEventListener("click", editInteract);
    }
    else {
        interactionCanvas.addEventListener("mousemove", mouseInteract);
        interactionCanvas.addEventListener("mousedown", clickInteract);
        interactionCanvas.classList.remove("hide-cursor");
        interactionCanvas.classList.add("hover-cursor");
    }

    drawInteractObjects();
    clearInstructions();
    addInstructions([0, 2, 10, 11]);
    updateCanvas();
}

function blinkCursor() {
    if (editing != null) {
        clearContext([editContext]);

        if (blink) focus.edit(focus.label);
        else focus.edit(focus.label + "|");

        setTimeout(blinkCursor, 1000);  
    }

    blink = !blink;
}

function clickInteract(event) {
    if (!focus) {
        const rect = interactionCanvas.getBoundingClientRect();
        originX = event.clientX - rect.left;
        originY = event.clientY - rect.top;

        interactionCanvas.removeEventListener("mousemove", mouseInteract);
        interactionCanvas.removeEventListener("mousedown", clickInteract);
        interactionCanvas.addEventListener("mousemove", dragInteract);
        interactionCanvas.addEventListener("mouseup", releaseInteract);

        clearInstructions();
        addInstructions([1]);
        updateCanvas();
    }
}

function dragInteract(event) {
    const rect = interactionCanvas.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    targetY = event.clientY - rect.top;

    if ((Math.abs(targetX - originX) < 64) || (Math.abs(targetY - originY) < 64)) editContext.strokeStyle = "#111111";
    else editContext.strokeStyle = "#4597F7";

    clearContext([editContext]);
    const object = new YoloObject(originX, originY, targetX, targetY, "");
    object.hover();
    updateCanvas();
}

function releaseInteract(event) {
    const rect = interactionCanvas.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    interactionCanvas.removeEventListener("mousemove", dragInteract);
    interactionCanvas.removeEventListener("mouseup", releaseInteract);

    if ((Math.abs(targetX - originX) < 64) || (Math.abs(targetY - originY) < 64)) {
        interactionCanvas.addEventListener("mousedown", clickInteract);
        interactionCanvas.addEventListener("mousemove", mouseInteract);

        editContext.strokeStyle = "#4597F7";
        clearInstructions();
        addInstructions([0, 2, 10, 11]);
        clearContext([editContext]);
        updateCanvas();
    }

    else {
        window.addEventListener("keydown", keyboardInteract);
        window.removeEventListener("keydown", toggleMode);
        window.removeEventListener("keydown", changeImage);
        interactionCanvas.classList.remove("hover-cursor");
        interactionCanvas.classList.add("hide-cursor");

        const xStart = originX < targetX ? originX : targetX;
        const yStart = originY < targetY ? originY : targetY;
        const xEnd = originX > targetX ? originX : targetX;
        const yEnd = originY > targetY ? originY : targetY;

        const object = new YoloObject(xStart, yStart, xEnd, yEnd, "");
        focus = object;
        editing = focus.label;
    
        object.click();
        clearInstructions();
        addInstructions([4, 5, 6, 7]);
        blinkCursor();
    }
}

//Gallery Functions
async function compileImages() {
    const directory = "./dataset/training/images/";
    const extension = ".jpg";

    imageArray = historyArray = [];

    $.ajax({
        url: directory,
        success: (data) => {
            $(data).find("a:contains(" + extension + ')').each((index, file) => {
                imageArray.push(file.title);
            });

            initialiseGallery();
        }
    });
}

function initialiseGallery() {
    console.log("gallery");

    interactionCanvas.addEventListener("mousemove", galleryPrompt);
    interactionCanvas.removeEventListener("mousemove", mouseInteract);
    interactionCanvas.removeEventListener("mousedown", clickInteract);
    window.removeEventListener("keydown", changeImage);

    interactionCanvas.classList.remove("hover-cursor");
    interactionCanvas.classList.add("hide-cursor");

    nextImage();
}

function galleryPrompt() {
    addInstructions([9]);
    updateCanvas();

    setTimeout(() => {
        clearInstructions();
    }, 3000);

    interactionCanvas.addEventListener("click", toggleMode);
}