// Creates the Begin button on the welcome and instructions pages.

var nextBtnInstructionsPageDiv = document.createElement('div');
nextBtnInstructionsPageDiv.id = "nextBtnInstructionsPageDiv";
document.querySelector("#form").appendChild(nextBtnInstructionsPageDiv);

var nextBtnInstructionsPage = document.createElement('input');
nextBtnInstructionsPage.type = "submit";
nextBtnInstructionsPage.className = "btn";
nextBtnInstructionsPage.id = "nextBtnInstructionsPage";
nextBtnInstructionsPage.name = "btn";
nextBtnInstructionsPage.value = "Next";
document.querySelector("#nextBtnInstructionsPageDiv").appendChild(nextBtnInstructionsPage);