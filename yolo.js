// Variables
const data = YAML.load("./dataset/data.yaml");
const yoloClassList = data.names;

//Initialise

//Functions
async function readImage(buf) {
    const [input, imageWidth, imageHeight] = await prepareInput(buf);
    const output = await runModel(input);

    return processOutput(output, imageWidth, imageHeight);
}

async function prepareInput(buf) {
    return new Promise(resolve => {
        const image = new Image();
        // image.src = URL.createObjectURL(buf);
        image.src = buf;
        image.onload = () => {
            const [imageWidth, imageHeight] = [image.width, image.height];
            const canvas = document.createElement("canvas");
            canvas.width = 640;
            canvas.height = 640;
    
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, 640, 640);
    
            const imageData = context.getImageData(0, 0, 640, 640);
            const pixels = imageData.data;
    
            const red = [], green = [], blue = [];
            for (var i = 0; i < pixels.length; i += 4){
                red.push(pixels[i] / 255.0);
                green.push(pixels[i + 1] / 255.0);
                blue.push(pixels[i + 2] / 255.0);
            }
    
            const input = [...red, ...green, ...blue];
            resolve([input, imageWidth, imageHeight]);
        }
    })
}

async function runModel(input) {
    const model = await ort.InferenceSession.create("yolov8m.onnx");
    input = new ort.Tensor(Float32Array.from(input), [1, 3, 640, 640]);

    const outputs = await model.run({images: input});
    
    return outputs["output0"].data;
}

function processOutput(output, imageWidth, imageHeight) {
    let boxes = [];
    for (var i = 0; i < 8400; i++) {
        const [classID, probability] = [...Array(80).keys()]
            .map(col => [col, output[8400 * (col + 4) + i]])
            .reduce((accum, item) => item[1] > accum[1] ? item : accum, [0, 0]);

        if (probability < 0.5) continue;

        const label = yoloClassList[classID];
        const xc = output[i];
        const yc = output[8400 + i];
        const w = output[2 * 8400 + i];
        const h = output[3 * 8400 + i];
        const x1 = (xc - w / 2) / 640 * imageWidth;
        const y1 = (yc - h / 2) / 640 * imageHeight;
        const x2 = (xc + w / 2) / 640 * imageWidth;
        const y2 = (yc + h / 2) / 640 * imageHeight;
        
        boxes.push([x1, y1, x2, y2, label, probability]);
    }

    boxes = boxes.sort((boxOne, boxTwo) => boxTwo[5] - boxOne[5])
    const result = [];
    
    while (boxes.length > 0) {
        result.push(boxes[0]);
        boxes = boxes.filter(box => iou(boxes[0], box) < 0.7);
    }

    return result;
}

function iou(boxOne, boxTwo) {
    return intersection(boxOne, boxTwo) / union(boxOne, boxTwo);
}

function union(boxOne, boxTwo) {
    const [boxOne_x1, boxOne_y1, boxOne_x2, boxOne_y2] = boxOne;
    const [boxTwo_x1, boxTwo_y1, boxTwo_x2, boxTwo_y2] = boxTwo;
    const boxOne_area = (boxOne_x2 - boxOne_x1) * (boxOne_y2 - boxOne_y1);
    const boxTwo_area = (boxTwo_x2 - boxTwo_x1) * (boxTwo_y2 - boxTwo_y1);

    return boxOne_area + boxTwo_area - intersection(boxOne, boxTwo);
}

function intersection(boxOne, boxTwo) {
    const [boxOne_x1, boxOne_y1, boxOne_x2, boxOne_y2] = boxOne;
    const [boxTwo_x1, boxTwo_y1, boxTwo_x2, boxTwo_y2] = boxTwo;
    const x1 = Math.max(boxOne_x1, boxTwo_x1);
    const y1 = Math.max(boxOne_y1, boxTwo_y1);
    const x2 = Math.min(boxOne_x2, boxTwo_x2);
    const y2 = Math.min(boxOne_y2, boxTwo_y2);

    return (x2 - x1) * (y2 - y1);
}