//The array of contents, held as an object
var contentObjsRefiner;

//A dictionary of basic stats by field name
var basicStats = {};

//Acts as a callback for the filechooser
function loadDatasetsRefiner(fileContents) {
    //Empty the array when new files are uploaded
    contentObjsRefiner = [];
    
    //Remove any pre-existing UI.
    $("div[name=data-refiner] form.file-headers").remove();
    $("div[name=data-refiner] .panel div.buttons").remove();
    $("div[name=data-refiner] .panel div.actions button[name=export]").remove();
    
    //Create the form for selecting options.
    var form = $("<form class='file-headers'><h3>Form Headers</h3><ul name='checkboxes'></ul></form></div>");
    $("div[name=data-refiner] .panel").prepend(form);
    
    var dataArrays = {};
    
    //Loop through each file, save its contents, and add its fields to the list of choices.
    for(var i = 0; i < fileContents.length; i++) {
        fileContents[i] = fileContents[i].split('\n').filter(x => {
            return x.replace(/,|\r|\n/g, '').length != 0;
        }).join('\n');
        
        var data = Papa.parse(fileContents[i], {
            header: true,
            skipEmptyLines: true
        });
        contentObjsRefiner.push(data);
                
        //Add the fields as checkboxes to select
        data.meta.fields.forEach(field => {
            if(field != "") {
                data.data.forEach(obj => {
                    if(dataArrays[field] == undefined)
                        dataArrays[field] = [];
                    
                    dataArrays[field].push(obj[field]);
                })
                
                
                if(form.find("ul li input[name=" + field + "]").length <= 0) {
                    form.find("ul").append($("<li class='flex-row'><input name='" + field + "' type='checkbox' value='" + field + "' checked><label for='" + field + "'>" + field + "</label></li>"))
                    
                    $("input[name='" + field + "']").change(function() {
                        if($(this).is(":checked")) {
                            $("div.outlier-checkboxes").append($("<div class='flex-row'><input type='checkbox' name='" + field + "' checked><p>" + field + "</p></div>"));
                        } else {
                            $("div.outlier-checkboxes input[name='" + field + "']").parent().remove();
                        }
                    })
                    
                    if(i > 0)
                        form.append($("<p class='warning'>Warning: Differing fields in loaded files.</p>"))
                }
            }
        });
    }
    
    Object.keys(dataArrays).forEach(function(key) {   
        var arr = dataArrays[key].map(x => parseFloat(x));
        
        basicStats[key] = {
            mean: ss.mean(arr),
            deviation: ss.standardDeviation(arr)
        };
    });
    
    allOrNoneButtons();
    options();
    exportButton();
    sendToAnalyzerButton();
}

//Creates the options framework
function options() {
    //ROW RANGES
    {
        //A variable tracking the maximum number of rows allowed.
        var maxRows = 0;
        contentObjsRefiner.forEach(x => {
            maxRows += x.data.length;
        });


        var rowRangeCreationButton = $("<button type='button' name='row-ranges'>Create Row Range</button>").click(function() {
            createRowRange(maxRows);
        });

        $("form.file-headers").append($("<h3>Row Ranges</h3>")).append(rowRangeCreationButton);
    }
    
    //OUTLIERS
    {
        $("form.file-headers").append($("<h3>Outliers</h3><div class='option'><div class='flex-row'><input name='use-outliers' type='checkbox'><p>Exclude data points lying outside</p><input name='standard-deviations' type='number'><p>standard deviations.</p></div><div class='outlier-checkboxes flex-row'></div></div>"));
    }
}

//Creates the inputs for constructing a row range to export
function createRowRange(maxRows) { 
    //A button for deleting the ow range element.
    var deleteButton = $("<button name='delete' type='button'>&times;</button>").click(function() {
        $(this).parent("div.row-range").remove();
    }).css("min-width", 0);
    
    //Create the element and attach the delete button
    var rangeEl = $(
    "<div class='option flex-row row-range' name='rows'>" + 
        "<p>Select Rows</p>" + 
        "<input type='number' step='1' name='select-rows-start' value='0'><p>to</p><input type='number' step='1' name='select-rows-end' value='" + maxRows + "'>" + 
    "</div>"
     ).prepend(deleteButton);
    
    //Stop non-numerical values from being entered
    rangeEl.find("input[type=number]")
    .on("input", function() {
        $(this).val($(this).val().replace(/[^0-9]/g,''));
    });
    
    //Stop values over the maximum row count from being entered.
    rangeEl.find("input[name=select-rows-end]")
    .on("change", function() {
        $(this).val($(this).val().replace(/[^0-9]/g,''));
        
        if(parseInt($(this).val()) > maxRows)
            $(this).val(maxRows);
    });
    
    rangeEl.insertBefore($("button[name=row-ranges]"));
}

//Add buttons for selecting all or none.
function allOrNoneButtons() {
    //Element for holding the buttons
    var buttons = $("<div class='buttons flex-row-center'>");
    $("form.file-headers").append(buttons);
    
    //Create the elements
    var selectAllButton = $("<button type='button' name='select-all' class='alt-button flex-column'>Select All</button>").click(function() {
        $("form.file-headers ul[name=checkboxes] li input[type=checkbox]").prop("checked", true);
    });
    var selectNoneButton = $("<button type='button' name='select-none' class='alt-button flex-column'>Select None</button>").click(function() {
        $("form.file-headers ul[name=checkboxes] li input[type=checkbox]").prop("checked", false);
    });
    
    //Append them
    buttons.append(selectAllButton);
    buttons.append(selectNoneButton);
}

//A function for creating the export button
function exportButton() {
    var exportButton = $("<button type='button' name='export'>Export</button>").click(exportFiles);
    
    //Append it
    $("div[name=data-refiner] .panel > div.actions").prepend(exportButton);
}

//A function for creating the send to analyzer button
function sendToAnalyzerButton() {
    var sendToAnalyzerButton = $("<button type='button' name='export'>Send to Analyzer</button>").click(function() {
        loadDatasetsAnalyzer(
            Papa.unparse(generateExportedCSVObject())
        );
    });
    
    //Append it
    $("div[name=data-refiner] .panel > div.actions").prepend(sendToAnalyzerButton);
    
    window.scrollTo(0, $("a[name=graphs]").position().top);
}

//A function for exporting the selection
function exportFiles() {
    var blob = new Blob([
        Papa.unparse(generateExportedCSVObject())
    ], {type: "text/csv;charset=utf-8"});
    saveAs(blob, "export.csv");
}

//Generates a CSV file with only the selected fields included.
function generateExportedCSVObject() {
    //Get all checked inputs to get a list of the selected fields.
    var selectedFields = $("form.file-headers ul[name=checkboxes] input:checked").map(function() { 
        return this.value; 
    }).get();
    
    var result = [selectedFields];
    
    //Get the start and end rows.
    var rowRanges = [];
    $("form.file-headers .option.row-range").each(function(index, el) {
        rowRanges.push([
            parseInt($(this).find("input[name=select-rows-start]").val()),
            parseInt($(this).find("input[name=select-rows-end]").val())
        ]);
    });
    
    if(rowRanges.length == 0)
        rowRanges.push([0, 0]);
        
    //Loop through all files and all row ranges
    contentObjsRefiner.forEach(data => {
        var content = data.data;
        
        rowRanges.forEach(range => {
            //Deal with cases where no range was specified or the range is out of bounds
            if(range[1] == 0 || range[1] > content.length)
                range[1] = content.length;

            for(var i = range[0]; i < range[1]; i++) {
                var push = valuesKeysContain(content[i], selectedFields);
                
                if($("input[name=use-outliers]").is(":checked"))
                    if(checkForOutliers(selectedFields, push))
                        continue;
                
                result.push(push);
            }
        });
    });
    
    if($("input[name=use-outliers]").is(":checked")) {
        $("div.outlier-checkboxes input[type=checkbox]:checked").each(function() {
            var field = $(this).attr("name");
        });
    }
    
    return result;
}
            
//A function that returns an array of values if their keys exist in the contains array.
function valuesKeysContain(pairing, contains) {
    var result = [];
    for(var key in pairing)
        if(contains.includes(key))
            result.push(pairing[key]);
    
    return result;
}

function checkForOutliers(fields, array) {
    var deviations = parseFloat($("input[name=standard-deviations]").val());
    
    for(var i = 0; i < fields.length; i++) {
        if($("div.outlier-checkboxes input[type=checkbox][name='" + fields[i] + "']:checked").length > 0) {
            console.log(basicStats[fields[i]].mean + ":" + basicStats[fields[i]].deviation);
            
            if(array[i] < basicStats[fields[i]].mean - basicStats[fields[i]].deviation * deviations || array[i] > basicStats[fields[i]].mean + basicStats[fields[i]].deviation * deviations)
                return true;
        }
    }
    
    return false;
}