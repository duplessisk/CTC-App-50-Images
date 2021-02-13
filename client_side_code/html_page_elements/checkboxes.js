// Creates checkboxes on pages 1-5.

for (var i = 0; i < 10; i++) {
    var newQuestion = document.createElement('div');
    document.querySelector("#form").appendChild(newQuestion);
    newQuestion.innerHTML = 
        "<div class='new-image-row'> "+ 
            "<div class='checkboxes-container'>" + 
                "<div class='checkbox-container'>" + 
                    "<label for='myRadioIdCell"+i+"' class='radio-btn-labels'>" + 
                        "<input type='radio' value='cell' name='radio"+i+"' class='default-radio-btns cell-check-boxes' id='myRadioIdCell"+i+"'>" + 
                        "<div class='custom-radio-btns'></div>" + 
                        "Cell" + 
                    "</label>" +
                "</div>" + 
                "<div id='buffer'></div>" + 
                "<div class='checkbox-container'>" + 
                "<label for='myRadioIdNotCell"+i+"' class='radio-btn-labels'>" + 
                    "<input type='radio' value='notCell' name='radio"+i+"' class='default-radio-btns not-cell-check-boxes' id='myRadioIdNotCell"+i+"'>" + 
                    "<div class='custom-radio-btns'></div>" + 
                    "Not Cell" + 
                "</label>" +
            "</div>" + 
                "</div>" +
                "<div class= 'cell-image-row-container'>" + 
                    "<img src='/static/final_object_images/object" + imageNum + i +".png' alt='This image was originally intended to display a row of cell images' id='cellImage'>" + 
                "</div>" + 
            "</div>" + 
        "</div>"
}