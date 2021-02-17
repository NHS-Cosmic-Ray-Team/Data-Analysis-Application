$(".overlay .panel.closeable header").hover(function() {
    $(this).parent(".panel").toggleClass("header-hover");
})
.click(function() {
    $(this).parentsUntil(".overlay").parent().fadeOut(200);
})

$(".overlay").click(function(e) {
    if($(e.originalEvent.target).hasClass("overlay"))
        $(this).fadeOut(200);
})

//Custom dropdown functionality
$("body").on("click", "ul.select", function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if($(this).siblings("input[type=checkbox]:checked").length > 0)
        $(this).toggleClass("open");
}).on("click", "ul.select li", function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    var parent = $(this).parentsUntil("ul.select").parent();
    
    parent.attr("value", $(this).attr("value"));
    parent.find("> p").text($(this).text());
    parent.removeClass("open");
});
$(window).click(function() {
    $("ul.select.open").removeClass("open");
})

//A function for making an overlay visible
function overlay(name, callback = undefined) {
    var t = $(".overlay[name='" + name + "']");
    
    //In case there's no overlay with that name
    if(t.length <= 0)
        return;
    
    //If a callback was defined, add it as an attribute to the overlay.
    if(callback != undefined)
        t.attr("data-callback", callback)
        
    if(t.hasClass("flex-row") || t.hasClass("flex-column"))
        t.css("display", "flex").hide().fadeIn(200);
    else
        t.fadeIn(200);
}



//Mutation observer to add help buttons to any elements with the data-documentation attribute
var MutationObserver    = window.MutationObserver || window.WebKitMutationObserver;
var myObserver          = new MutationObserver (mutationHandler);
var obsConfig           = { childList: true, characterData: true, attributes: true, subtree: true };
myObserver.observe (document.body, obsConfig);

function mutationHandler (mutationRecords) {
    mutationRecords.forEach ( function (mutation) {
        for(var i = 0; i < mutation.addedNodes.length; i++) {
            //Only process actual elements.
            if(mutation.addedNodes[i].nodeType != 1) continue;
            
            //If the data-documentation attribute is present, add the help button.
            if(mutation.addedNodes[i].hasAttribute("data-documentation")) {
                var target = $(mutation.addedNodes[i]);
                target.append($("<a class='help flex-row-center' href='docs/#/" + target.attr("data-documentation") + "' target='_blank'>?</a>"));
            }
        }
    } );
}

$("[data-documentation]").each(function() {
    $(this).append($("<a class='help flex-row-center' href='docs/#/" + $(this).attr("data-documentation") + "' target='_blank'>?</a>"));
})