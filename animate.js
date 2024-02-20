// Variables
var pixelation;
var scaledWidth;
var scaledHeight;
var image;
var keyframe;

// Initialise

// Functions
function updateImageCanvas() {
    imageContext.drawImage(image, 0, 0, scaledWidth * pixelation, scaledHeight * pixelation);
    imageContext.drawImage(imageCanvas, 0, 0, scaledWidth * pixelation, scaledHeight * pixelation, 0, 0, scaledWidth, scaledHeight);
}

function generatePixelImage(reference, ratio) {
    image = reference;
    scaledWidth = image.width / ratio;
    scaledHeight = image.height / ratio;

    imageContext.msimageSmoothingEnabled = false;
    imageContext.mozImageSmoothingEnabled = false;
    imageContext.webkitImageSmoothingEnabled = false;
    imageContext.imageSmoothingEnabled = false;    

    pixelation = 0.01;
    animatePixelation();
}

function animatePixelation() {
    pixelation = pixelation < 0.35 ? pixelation += 0.001 : pixelation += 0.01;
    if (pixelation > 1) pixelation = 1;

    updateImageCanvas();

    if (pixelation < 1) animation = requestAnimationFrame(animatePixelation);
}

function animateInteractObjects() {
    keyframe = keyframe < 75 ? keyframe += 0.75 : keyframe += 0.15;
    if (keyframe > 100) keyframe = 100;

    previewContext.fillStyle = `rgba(69, 151, 247, ${keyframe / 132})`;

    clearContext([previewContext]);
    objectArray.forEach((object, index) => {
        const currentWidth = 128 - ((keyframe) * 0.96);

        previewContext.fillRect(object.xMidPoint - (currentWidth / 2), object.yMidPoint - (currentWidth / 2), currentWidth, currentWidth);
    });
    updateCanvas();

    if (this.keyframe < 100) animation = requestAnimationFrame(animateInteractObjects);
}

function animateGalleryObjects() {
    keyframe = keyframe < 75 ? keyframe += 0.5 : keyframe += 0.1;
    if (keyframe > 100) keyframe = 100;

    previewContext.strokeStyle = `rgba(69, 151, 247, ${keyframe / 100})`;
    previewContext.fillStyle = `rgba(69, 151, 247, ${keyframe / 100})`;
    previewContext.lineWidth = (keyframe / 100) * scaledLine;

    clearContext([previewContext]);
    objectArray.forEach((object, index) => {
        const xOffset = keyframe * (object.width / 200);
        const yOffset = keyframe * (object.height / 200);
        const widthOffset = object.width - (keyframe * (object.width / 100));
        const heightOffset = object.height - (keyframe * (object.height / 100));

        previewContext.strokeRect(object.xMidPoint - xOffset, object.yMidPoint - yOffset, object.width - widthOffset, object.height - heightOffset);
        previewContext.fillText(object.label, object.xMidPoint - xOffset, object.yMidPoint - yOffset - 8);
    });
    updateCanvas();

    if (this.keyframe < 100) animation = requestAnimationFrame(animateGalleryObjects);
}