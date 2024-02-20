// Variables
const nameLength = yoloClassList.length;

// Initialise

// Functions
async function saveData() {
    var result = "";

    await objectArray.forEach(object => {
        if (!yoloClassList.includes(object.label)) {
            yoloClassList.push(object.label);
        }

        result = result.concat(
            yoloClassList.indexOf(object.label), ' ',
            (object.xMidPoint / imageCanvas.width).toFixed(9), ' ',
            (object.yMidPoint / imageCanvas.height).toFixed(9), ' ',
            (object.width / imageCanvas.width).toFixed(9), ' ',
            (object.height / imageCanvas.height).toFixed(9), "\n"
        );
    });

    const link = document.createElement('a');
    const file = packageImageData(result);

    link.href = URL.createObjectURL(file);
    link.download = `${fileName}.txt`;
    link.click();

    //uploadFile();

    if (yoloClassList.length > nameLength) {
        var content = "train: ../training/images" + "\n" + "val: ../validation/images" + "\n" + "\n" + "nc: " + yoloClassList.length + "\n" + "names: [";

        yoloClassList.forEach(name => {
            content = content.concat("'", name, "', ");
        })

        content = content.slice(0, -2) + "]";
        const file = packageImageData(content);

        link.href = URL.createObjectURL(file);
        link.download = `data.yaml`;
        link.click();
    }
}

function packageImageData(input) {
    var type;

    if (!isNaN(input.charAt(0))) type = {type: "text/plain"};
    else type = {type: "text/x-yaml"};

    return new Blob([input], type);
}