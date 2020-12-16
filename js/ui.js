$(document).ready(function(){

	//////////////////
	// User Interface
	//////////////////
	
	// Buttons and Checkboxes
	
	$('#justify').click(async function () {
		$('#column').stop().empty().addClass("blocksatz"); // Textspalte leeren
		$('#justify').prop('disabled', true)
		$('#console').stop().empty(); // console leeren
		
		if ($('#hyphenation').is(':checked')){ // Wenn Silbentrennung an, dann mache Silbentrennung
			makeHyphenation();
		} else{ // Sonst Silbentrennung entfernen
			removeHyphenation();
		}
		
		if ($('#variable-font').is(':checked')){
			if($('#ligatures').is(':checked')){
				await advancedLineBreaking(true, true); // Verbesserten Blocksatz mit Ligaturen setzen
			} else{
				await advancedLineBreaking(false, true); // Verbesserten Blocksatz setzen
			}
		} else{ // normalen Blocksatz setzen
			textSetzen(); // zunächst Linksbündig setzen
			// makeBlocksatz();
		}
		
		$('#justify').prop('disabled', false)
	});
	
	
	$('.radiobutton').click( function () {
		if($(this).is("#r1")){
			$("#column").css("width", "22rem")
			characterCount()
		}
		if($(this).is("#r2")){
			$("#column").css("width", "35rem")
			characterCount()
		}
		if($(this).is("#r3")){
			$("#column").css("width", "50rem")
			characterCount()
		}
	});
	
	
	
	// Clone
	
	$('#clone').click(function(){

		uniqid = Date.now();
		
		$( "#column" ).clone(true, true).each(function(i){
  			this.id = uniqid; // to keep it unique
		}).appendTo("#outputsection").wrap( "<div class='wrapper'></div>" ).before("<span class='remove-col'><img src=\"img/remove.png\" /></span>");
	
	});
	
	
	// delete clone
	
	$('#outputsection').on('click', '.remove-col', function(){
		$(this).closest('.wrapper').remove();
	});
	

	

	
	
		
	// Character Count
	
	function getColor(value){
		//value from 0 to 1
		var hue=(value).toString(10);
		return ["hsl(",hue,",100%,45%)"].join("");
	}
	
	function characterCount(){
		columnWidth = $('#column').width();
		fontSize = $("#fontsize").val();
		noc = Math.floor((columnWidth / fontSize) * 2.5);
		$("#character-count").html("about <b>" + noc + "</b> characters / line");
		// $(".resizehandle").css("background-color", getColor(noc));
		$("#column").css("border-color", getColor(noc));
	}
	
	characterCount(); // CharacterCount beim Seitenaufruf ausführen
	
	
	
	// Font Size

	$('#fontsize-display').append($('#fontsize').val() + "px"); // set initial font size display
	
	
	$('#fontsize').mousemove(function(){ // live update font-size indicator + font-size preview
		fontsize = $("#fontsize").val() + "px";
		characterCount();
		$("#fontsize-display").text(fontsize);
		$('#column').css("font-size", fontsize);
	});
	
	$('#fontsize').mouseup(function(){ // rerun text setting automatically when font-size changes
		$('#column').stop().empty(); // textspalte leeren
		$('#console').stop().empty(); // console leeren
		myConsole("✅ set font-size: " + $("#fontsize").val() + "px"); // Public Console
	});
	
	
	// Resizable Text Column
	
	$("#column").resizable({
		handleSelector: ".resizehandle",
		resizeHeight: false,
		onDrag: function() {
			characterCount();
		}
	});


	$('.resizehandle').mouseup(function(){
		$('#column').stop().empty(); // textspalte leeren
		$('#console').stop().empty(); // console leeren
	});
	


	// Text Preview when Spacebar is pressed

	$(window).keydown(function( event ) {
	  if ( event.which == 32 ) {
		event.preventDefault();
		$("body").addClass("preview");
		}
	});
	  
	$(window).keyup(function( event ) {
	    if ( event.which == 32 ) {
	  	event.preventDefault();
		$("body").removeClass("preview");
	  	}
	 });
	 

}); // close document.ready



