// Variables
const predictList = [];
var predictInput;

// Initialise

// Functions
function predictText(input) {
    clearList();

    if (!input) return null;
    for (i = 0; i < yoloClassList.length; i++) {
        if (yoloClassList[i].substr(0, input.length) == input) predictList.push(yoloClassList[i]);
    }

    return predictList;
}

function predictInteract(keyCode) {    
    if (predictList.length < 1) return;

    if (keyCode == 40) predictInput < predictList.length - 1 ? predictInput += 1 : predictList.length - 1;
    else if (keyCode == 38) predictInput > -1 ? predictInput -= 1 : -1;

    clearContext([predictContext]);
    focus.listPredictions(predictList, predictInput);
}

function selectPrediction(text) {
    if (predictInput == -1) focus.label = text;
    else if (predictList.length != 0) focus.label = predictList[predictInput];
    
    clearList();
}

function clearList() {
    predictList.length = 0;
    predictInput = 0;
}