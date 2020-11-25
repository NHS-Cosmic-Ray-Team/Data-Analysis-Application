//Add drag and drop events for the file selecter.
$(".file-chooser")
.on("dragenter dragleave dragover drop", preventDefaults)
.on("dragenter dragover mouseenter", highlight)
.on("dragleave mouseleave", unhighlight)
.on("drop", fileUpload);


//A function for handling when a file is uploaded.
function fileUpload(e) {
    
    //In case the event is registered on a child element, change to the parent.
    var target = $(e.target);
    if(target.parent(".file-chooser").length > 0)
        target = target.parent(".file-chooser");
        
    target.removeClass("hover");
    
    //Get the files
    var files = e.target.files || (e.dataTransfer && e.dataTransfer.files) || (e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files);
    
    console.log("END");
}

//Function for handling the files that are uploaded.
function handleFiles(files) {
    for(var i = 0; i < files.length; i++) {
        if(!validateFile(files[0])) {
            //Add then remove the error class.
            target.addClass("error").removeClass("hover").delay(2000).queue(function() {
                $(this).removeClass("error").dequeue();
            })
            
            return;
        }
    }
}

//Adds a class to the file chooser when it's hovered over.
function highlight(e) {    
    if(!$(e.target).hasClass("error")) {
        if($(e.target).hasClass("file-chooser"))
            $(e.target).addClass("hover");
        else
            $(e.target).parent(".file-chooser").addClass("hover");
    }
}

//Removes a class from the file chooser when it's no longer hovered over.
function unhighlight(e) {
    if($(e.target).hasClass("file-chooser"))
        $(e.target).removeClass("hover");
    else
        $(e.target).parent(".file-chooser").removeClass("hover");
}

const VALID_TYPES = ["text/plain", "text/x-csv", "application/vnd.ms-excel", "application/csv", "application/x-csv", "text/csv", "text/comma-separated-values", "text/x-comma-separated-values", "text/tab-separated-values"];

//A function for validating to make sure uploaded files are valid.
function validateFile(file) {
    //Get the extension.
    var extension = file.name.split('.').pop();
    
    //If it's not a CSV file, return.
    if(extension != "csv")
        return false;
    
    //If the mime type doesn't match that of a CSV, it's not a valid file.
    if(!VALID_TYPES.includes(file.type))
        return false;
    
    return true;
}

//Prevent defaults on an event.
function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}