// create flexbox-container-new-row div html elements
for (var i = 0; i < 3; i++) {
    var newDiv = document.createElement('div');
    document.body.appendChild(newDiv);
    newDiv.classList.add("flexbox-container-new-row");
    newDiv.innerHTML = "<div class='flexbox-container-new-row'><div class='checkbox-container'><div><input type='checkbox' class='yescheckboxes' id="+i+"> <label for='yes'>yes</label></div><input type='checkbox' class = 'nocheckboxes' id="+i+"> <label for='yes'>no</label></div><div class= 'checkbox-container'><img src='images/yesImage.jpg' id='cell'></div></div>";
}

// create button
var submitButton = document.createElement('button');
var submitButtonText = document.createTextNode('Submit');
submitButton.appendChild(submitButtonText);
submitButton.classList.add("submitbutton");
document.body.appendChild(submitButton);

var numYesCheckBoxes = document.querySelectorAll(".yescheckboxes").length;
var numNoCheckBoxes = document.querySelectorAll(".nocheckboxes").length;

var responses = new Array(6);

for (var i = 0; i < responses.length; i++) {
    responses[i] = null;
    console.log(responses[i]);
}

// yes-check-boxes event listener
for (var i = 0; i < numYesCheckBoxes; i++) {
    document.querySelectorAll(".yescheckboxes")[i].addEventListener('change', function() {
        if (this.checked) {
            responses[2*this.id] = true;
        } else {
            responses[2*this.id] = null;
        }
        console.log(responses);
    });
}

// no-check-boxes event listener 
for (var i = 0; i < numNoCheckBoxes; i++) {
    document.querySelectorAll(".nocheckboxes")[i].addEventListener('change', function() {
        if (this.checked) {
            responses[2*this.id + 1] = true;
        } else {
            responses[2*this.id + 1] = null;
        }
        console.log(responses);
    });
}

// submit button event listener
document.querySelector('.submitbutton').addEventListener('click', function() {
    var formFinished = true;
    var noDoubleChecks = true;
    formFinished = checkFormFinished(formFinished);
    noDoubleChecks = checkDoubleChecks(noDoubleChecks);
    if (formFinished && noDoubleChecks) {
        var totalScore = 3;
        // check for checked no-check-boxes
        for (var i = 0; i < responses.length/2; i++) {
            if (responses[(2*i)+1]) {
                totalScore--;
            }
        }
        alert("num correct: " + totalScore);
    } else if (!formFinished) {
        alert("Please submit a response for all images");
    } else {
        alert("Please submit one response per image");
    }
});

function checkFormFinished(formFinished) {
    for (var i = 0; i < responses.length/2; i++) {
        var yesResponse = responses[2*i];
        var noResponse = responses[2*i + 1];
        if (yesResponse == null && noResponse == null) {
            formFinished = false;
        } 
    }
    return formFinished;
}

function checkDoubleChecks(noDoubleChecks) {
    for (var i = 0; i < responses.length/2; i++) {
        var yesResponse = responses[2*i];
        var noResponse = responses[2*i + 1];
        if (yesResponse != null && noResponse != null) {
            noDoubleChecks = false;
        } 
    }
    return noDoubleChecks;
}