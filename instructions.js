// Variables
const instructions = [];
const database = ["Mark subjects by dragging over an area with the Mouse", 
                "Release to confirm the selection area", 
                "Hover over a square to preview a subject", 
                "Click to make edits to the subject's label",
                "Add characters to the label using the A-Z keys",
                "Delete characters using the Backspace key",
                "Confirm the subject's label using the Enter key",
                "Discard any edits made using the Escape key",
                "Select an autocomplete option using the Up and Down keys",
                "Click to enter Interactive mode",
                "View the previous or next image by using the Left and Right keys",
                "Hit the Escape key to return to Gallery mode"];

// Initialise

// Functions
function addInstructions(indices) {
    for (index of indices) {
        const newItem = database[index];

        if (instructions.includes(newItem)) break;
        instructions.push(newItem);
    }

    displayInstructions();
}

function displayInstructions() {
    clearContext([instructContext]);

    for (var i = 0; i < instructions.length; i++) {
        instructContext.fillText(instructions[i], 8, 24 + (i * 24));
    };
}

function clearInstructions(indices) {
    if (indices) {
        for (index of indices) {
            const removalItem = database[index];
            if (instructions.includes(removalItem)) instructions.splice(instructions.indexOf(removalItem), 1);
        }

        displayInstructions();
    }
    else {
        instructions.length = 0;
        
        clearContext([instructContext]);
        updateCanvas();
    }
}