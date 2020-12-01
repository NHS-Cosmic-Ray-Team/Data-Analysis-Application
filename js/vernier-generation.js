//Replaces the contents of the 'index' occurence tag 'tag' in 'xml' with 'value'. If occurence is -1, all occurences are replaced.
function modifyTag(xml, tag, value, index=-1) {
    var counter = -1;
    
    //Regex to find the location between the opening and closing tags
    var regex = new RegExp("(?<=<" + tag + ">)[\\s\\S]*?(?=<\\/" + tag + ">)", "g");
        
    return xml.replace(regex, function(match) {
        //Replaces a specific occurence, or all if one isn't specified.
        counter++;
        console.log(match);
        return (index == -1 || counter == index) ? value : match;
    });
}

//A function for generating a Vernier .gambl file and prompting the user to save it.
function exportVernierFile(column1, column2) {    
    $.ajax({
        url: "/resources/data.cmbl",
        success: function(data) {
            var xml = data;
            
            //Set the graph title
            xml = modifyTag(xml, "GraphTitle", column1.name + " vs. " + column2.name, 0);
            
            //Set the first column of data
            xml = modifyTag(xml, "DataObjectName", column1.name, 0);
            xml = modifyTag(xml, "ColumnCells", "\n" + column1.data.join("\n") + "\n", 0);
            
            //Set the second column of data
            xml = modifyTag(xml, "DataObjectName", column2.name, 1);
            xml = modifyTag(xml, "ColumnCells", "\n" + column2.data.join("\n") + "\n", 1);
                 
            //Prompt the user to save
            var blob = new Blob([
                xml
            ], {type: "application/x-tar;charset=utf-8"});
            saveAs(blob, "data.cmbl");
        }
    })
}