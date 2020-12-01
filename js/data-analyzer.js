//The array of contents, held as an object
var contentObjsAnalyzer;

//Acts as a callback for the filechooser
function loadDatasetsAnalyzer(fileContents) {    
    //Empty the array when new files are uploaded
    contentObjsAnalyzer = [];
    
    //Remove pre-existing UI
    $("div[name=data-analyzer] form.file-headers").remove();
    
    //Create the form for selecting options.
    var form = $("<form class='file-headers file-headers-grid'><h3>Fields</h3><ul name='checkboxes'></ul></form>");
    $("div[name=data-analyzer] .panel").prepend(form);
    
    //Loop through each file, save its contents, and add its fields to the list of choices.
    for(var i = 0; i < fileContents.length; i++) {
        fileContents[i] = fileContents[i].split('\n').filter(x => {
            return x.replace(/,|\r|\n/g, '').length != 0;
        }).join('\n');
        
        var data = Papa.parse(fileContents[i], {
            header: true,
            skipEmptyLines: true
        });
        contentObjsAnalyzer.push(data.data);
        
        //Create the column labels for the grid.
        var row = $("<li class='flex-row columns'></li>");
        for(var l = 0; l < data.meta.fields.length; l++)
            row.append($("<p>" + data.meta.fields[data.meta.fields.length - 1 - l] + "</p>"));
        
        form.find("ul").append(row);
        
        //Create the checkbox grid for fields to be selected as both rows and columns;
        for(var j = 0; j < data.meta.fields.length; j++) {
            //Create a new row of checkboxes
            var newRow = $("<li class='flex-row'><p>" + data.meta.fields[j] + "</p></li>")
            
            for(var k = 0; k < data.meta.fields.length - j; k++) {                
                //Get the fields
                var fieldX = data.meta.fields[j];
                var fieldY = data.meta.fields[data.meta.fields.length - 1 - k];
                
                //Add callbacks for creating/destroying graphs
                var newCheckbox = $("<input type='checkbox' data-field-x='" + fieldX + "' data-field-y='" + fieldY + "'>").change(function() {
                    //Get fields of checkbox
                    var _fieldX = $(this).attr('data-field-x');
                    var _fieldY = $(this).attr('data-field-y');
                                        
                    //Generate or destroy based on whether something was enabled or disabled.
                    if($(this).prop("checked"))
                        generateGraph(_fieldX, j, _fieldY, k);
                    else
                        destroyGraph(_fieldX, _fieldY);
                });
                newRow.append(newCheckbox);
            }
            
            form.find("ul").append(newRow);
        }
    }
    
    form.append($("<a name='scroll-to-graphs' href='graphs><p>Scroll Down for Results</p></a>'"));
}

//A function for generating graphs based on an independent and dependent field
function generateGraph(fieldX, rowNum, fieldY, colNum) {    
    //Create the foldout header object
    var foldoutHeader = $("<div class='graph-expand flex-row' name='" + fieldX + "-" + fieldY + "'>" + fieldX + "(X) x " + fieldY + " (Y)</div>");
    
    //Create the element that actually holds the foldout
    var foldout = $("<div class='graph flex-column' name='" + fieldX + "-" + fieldY + "' style='display: none; border-width: 0px;'><canvas></div>");
    
    //Get the canvas context.
    var ctx = foldout.find("canvas").get(0).getContext('2d');
    
    //Collect the data
    var points = [];
    contentObjsAnalyzer.forEach(obj => {
        obj.forEach(dataPoint => {
            points.push({
                x: dataPoint[fieldX],
                y: dataPoint[fieldY]
            });
        })
    });
    
    
    $("<button type='button' class='vernier-export' name='" + fieldX + "-" + fieldY + "'>Export to Graphical Analysis</button>").click(function() {
        exportVernierFile({
            name: fieldX,
            data: points.map(a => a.x)
        }, {
            name: fieldY,
            data: points.map(a => a.y)
        });
    }).appendTo(foldout);
    
    
    
    //Options
    var options = {
        legend: {
            display: false
        },
        title: {
            display: false
        },
        tooltips: {
            enabled: false
        },
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom'
            }]
        }
    }
    
    //Create the line graph.
    var chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: "",
                data: points
            }]
        },
        options: options
    });
    
    //Append the elements.
    $("div[name=data-graphs] .panel").append(foldoutHeader);
    $("div[name=data-graphs] .panel").append(foldout);
}

//A function for destroying graphs associated with the provided fields
function destroyGraph(fieldX, fieldY) {
    //Delete the elements
    $("div.graph-expand[name='" + fieldX + "-" + fieldY + "']").remove();
    $("div.graph[name='" + fieldX + "-" + fieldY + "']").remove();
}




//UI Functions
$(document).on("click", "div.graph-expand", function() {    
    $(this).toggleClass("expanded");
    var hasClass = $(this).hasClass("expanded");
    
    if(hasClass)
        $(this).find("+ div.graph").css("border-width", "1px");
    
    $(this).find("+ div.graph").animate({
        height: 'toggle'
    }, 500, "swing", function() {
        if(!hasClass)
            $(this).find("+ div.graph").css("border-width", "0px");
    });
})