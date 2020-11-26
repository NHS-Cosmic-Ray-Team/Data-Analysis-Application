//The array of contents, held as an object
var contentObjs;

//Acts as a callback for the filechooser
function loadDatasets(fileContents) {
    //Empty the array when new files are uploaded
    contentObjs = [];
    
    //Remove any pre-existing UI.
    $("form.file-headers").remove();
    $("div[name=data-refiner] .panel div.buttons").remove();
    $("div[name=data-refiner] .panel div.actions button[name=export]").remove();
    
    //Create the form for selecting options.
    var form = $("<form class='file-headers'><h3>Form Headers</h3><ul name='checkboxes'></ul></form><div class='buttons flex-row-center'></div>");
    $("div[name=data-refiner] .panel").prepend(form)
    
    //Loop through each file, save its contents, and add its fields to the list of choices.
    for(var i = 0; i < fileContents.length; i++) {
        var data = Papa.parse(fileContents[i], {
            header: true
        });
        contentObjs.push(data.data);
                
        //Add the fields as checkboxes to select
        data.meta.fields.forEach(field => {
            if(field != "") {
                if($("form.file-headers ul li input[name=" + field + "]").length <= 0) {
                    form.find("ul").append($("<li class='flex-row'><input name='" + field + "' type='checkbox' value='" + field + "' checked><label for='" + field + "'>" + field + "</label></li>"))
                    
                    if(i > 0)
                        form.append($("<p class='warning'>Warning: Differing fields in loaded files.</p>"))
                }
            }
        });
    }
    
    allOrNoneButtons();
    exportButton();
}

//Add buttons for selecting all or none.
function allOrNoneButtons() {
    //Create the elements
    var selectAllButton = $("<button type='button' name='select-all' class='alt-button'>Select All</button>").click(function() {
        $("form.file-headers ul[name=checkboxes] li input[type=checkbox]").prop("checked", true);
    });
    var selectNoneButton = $("<button type='button' name='select-none' class='alt-button'>Select None</button>").click(function() {
        $("form.file-headers ul[name=checkboxes] li input[type=checkbox]").prop("checked", false);
    });
    
    //Append them
    $("form.file-headers").next(".buttons").append(selectAllButton);
    $("form.file-headers").next(".buttons").append(selectNoneButton);
}

//A function for creating the export button
function exportButton() {
    var exportButton = $("<button type='button' name='export'>Export</button>").click(exportFiles);
    
    //Append it
    $("div[name=data-refiner] .panel > div.actions").prepend(exportButton);
}

//A function for exporting the selection
function exportFiles() {
    //Get all checked inputs to get a list of the selected fields.
    var selectedFields = $("form.file-headers ul[name=checkboxes] input:checked").map(function() { 
        return this.value; 
    }).get();
    
    var result = [selectedFields];
    
    contentObjs.forEach(content => {
        for(var i = 0; i < content.length; i++)
            result.push(valuesKeysContain(content[i], selectedFields))
    });
    
    var blob = new Blob([Papa.unparse(result)], {type: "text/csv;charset=utf-8"});
    saveAs(blob, "export.csv");
}
            
//A function that returns an array of values if their keys exist in the contains array.
function valuesKeysContain(pairing, contains) {
    var result = [];
    for(var key in pairing)
        if(contains.includes(key))
            result.push(pairing[key]);
    
    return result;
}