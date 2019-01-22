	//////////////////
	// Hilfsfunktionen
	//////////////////
	
	// "sleep"
	
	function sleep(ms) {
	  return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	// Space-Ruler (Bram Stein)
	ruler = $('<div class="ruler">&nbsp;</div>').css({
		visibility: 'hidden',
		position: 'absolute',
		top: '-8000px',
		width: 'auto',
		display: 'inline',
		left: '-8000px'
	});
	
	function myConsole(input){
		$("#console").append("<li>" + input + "</li>");
	}
	
	
	function makeHyphenation(){
		// Silbentrennung vorbereiten
		$("textarea#input").text($("textarea#input").val()) // neuen Text ins HTML schreiben damit die Softhyphens eingefügt werden können
		
		let lang = "en";
		
		guessLanguage.detect($("textarea#input").val(), function(language) { 	// Language detection
			lang = language;
			myConsole("✅ detected language: " + language); // Public Console
		});
		
		if(lang == "de"){  // wenn Deutsch erkannt wurde, dann deutsche Trennungen einfügen
		 	$("textarea#input").hyphenate('de');
		 	myConsole("✅ inserted breakpoints for german language"); // Public Console
		}
		else{ // sonst englische Trennungen einfügen
			$("textarea#input").hyphenate('en-us');
			myConsole("✅ inserted breakpoints for english language"); // Public Console
		}
	}
		
		
	//////////////////
	// Text setzen
	//////////////////
	
	async function lineBreaking(){
		text = $('#input').text();
		lineIndex = 1;
		ccounter = -1;
		
		// Spaltenbreite
		columnWidth = $('#paragraph').width();
		
		$('#paragraph').removeClass("blocksatz", "variable"); // reset classes for ui buttons to work properly
		
		
		for ( c = 0; c < text.length; c++ )
		{
			
			// test if line exists, create line
			if($('#line-' + lineIndex).length == 0) {
				$('#paragraph').append("<span class='line' id='line-" + lineIndex + "'></span>");
			}
			
			$('#line-' + lineIndex).append(text.charAt(c)); // Buchstabe setzen
			await sleep(0); // Sleep (only for debug purpose)

			if($('#line-' + lineIndex).width() >= columnWidth){ // wenn Zeile voll
				
				if(text.charAt(c) != '\u0020' & text.charAt(c) != '\u00AD'){	// wenn kein Leerzeichen und kein Softhyphen an aktueller Position
					while (true){ // gehe so lange zurück bis ein Leerzeichen kommt
						if(text.charAt(c) == '\u0020' || text.charAt(c) == '\u00AD'){
							break;
						}
						c = c - 1;
					}
				}
				
				if(text.charAt(c) == '\u0020' || text.charAt(c) == '\u00AD'){ // wenn Leerzeichen oder Softhyphen an aktueller Position
					
					// Unvollständiges Wort am Ende abschneiden
					
					cneu = c - ccounter;
					
					if (text.charAt(c) == '\u0020'){ // Wenn Leerzeichen: nur abschneiden
						$('#line-' + lineIndex).text(function (_,txt) {
							return txt.slice(0, (cneu - 1));
						});
					}
					
					if (text.charAt(c) == '\u00AD'){ // Wenn Softhyphen: abschneiden und Trennstrich einfügen
						$('#line-' + lineIndex).text(function (_,txt) {
							return txt.slice(0, (cneu - 1)) + "-";
						});
					}
			
					ccounter = ccounter + cneu;
					$('#line-' + lineIndex).addClass('full'); // Zeile auf volle Breite stellen
					lineIndex++; // Nächste Zeile
					
				}
				
			}
		} // close for
		
		myConsole("✅ broke text successfully into " + lineIndex + " lines"); // Public Console
		
	} // close textSetzen
	
	
	
	//////////////////
	// Blocksatz anwenden
	//////////////////
	
	
	function makeBlocksatz(){
		
		zeilenZahl = $('.line').length;	// Zeilenlänge
		columnWidth = $('#paragraph').width();	// Spaltenbreite
		
		$('.line').each(function(index, element){
			
			$(this).removeClass("full").css("word-spacing", "normal"); // set width: auto and reset word-spacing
		
			function countSpaces(text){ // spaces zählen
				spaces = 0;
				for ( i = 0; i < text.length; i++ ) // durchlaufe alle zeichen
				{
					if(text.charAt(i) == '\u0020'){ // wenn leerzeichen
						spaces++; // setze variable +1
					}
				}
				return spaces;
			}
			
			leftSpace = columnWidth - $(this).width();
			wordSpacing = ruler.width() + (leftSpace / countSpaces($(this).text()));

			if (index != (zeilenZahl - 1)) { // wenn zeile nicht die letzte
				$(this).css("word-spacing", wordSpacing + "px").css("width", "100%"); // wende errechnetes word spacing an
			}
			
			$(this).addClass("full");
		});
		
		$('#paragraph').addClass("blocksatz"); // only for ui
		myConsole("✅ applied blocksatz"); // Public Console
	}
	
	function removeBlocksatz(){
		$('.line').each(function(){
			$(this).css("word-spacing", "normal").css("width", "100%");
		});
		$('#paragraph').removeClass("blocksatz"); // only for ui
	}
	
	
	//////////////////
	// Variable Blocksatz anwenden
	//////////////////
	
	
	
	function variableBlocksatz(){
		
		console.log("processing …"); // legacy console
		
		zeilenZahl = $('.line').length;
		columnWidth = $('#paragraph').width();	// Spaltenbreite
		
		$('.line').each(function(index, element){
			
			wdth = 0;
			$(this).removeClass("full").css("word-spacing", "normal");
			
			
			leftSpace = columnWidth - $(this).width()
			
			
			// $(this).css("font-variation-settings", ("\'wdth\'" + 100));
			
			if (index != (zeilenZahl - 1)) { // außer in der letzten Zeile
				while (leftSpace > 0) { // vergrößere die wdth Achse schrittweise bis nur noch 0px Platz am Ende
					wdth = wdth + 1;
					$(this).css("font-variation-settings", ("\'wdth\'" + wdth));
					leftSpace = columnWidth - $(this).width();
					if (wdth > 200) {
						console.log("LeftSpace in Zeile " + (index + 1)) ; // Legacy Console
						myConsole("⚠️ left space in line " + (index + 1));
						$(this).prepend("<span class='leftSpaceIndicator'>!</span>"); // Add LeftSpace Indicator in front of line
						vBlocksatzAusgleich($(this));
						break;
					} // wenn wdth größer als extrempunkt des fonts, unterbreche schleife -> wende normalen Blocksatz an
				}
			}
			
			$(this).addClass("full");
						
		});
		
		$('#paragraph').addClass("variable"); // only for ui
		console.log("done!") // Legacy Console
		myConsole("✅ applied variable blocksatz"); // Public Console
	}
	
	////////////////////////////
	
	function vBlocksatzAusgleich(thisObj){
	 	
	 	thisObj.removeClass("full").css("word-spacing", "normal"); // set width: auto and reset word-spacing

	 	function countSpaces(text){ // spaces zählen
	 		spaces = 0;
	 		for ( i = 0; i < text.length; i++ ) // durchlaufe alle zeichen
	 		{
	 			if(text.charAt(i) == '\u0020'){ // wenn leerzeichen
	 				spaces++; // setze variable +1
	 			}
	 		}
	 		return spaces;
	 	}
	 	
	 	leftSpace = columnWidth - thisObj.width();
	 	wordSpacing = ruler.width() + (leftSpace / countSpaces(thisObj.text()));
	 	
	 	thisObj.css("word-spacing", wordSpacing + "px").css("width", "100%");
	 	
	 	thisObj.addClass("full");
	 	
	}
	
	////////////////////////////


	function removeVariableBlocksatz(){
		$('.line').each(function(){
			$(this).css("font-variation-settings", "\'wdth\' 0");
			makeBlocksatz();
		});
		$('#paragraph').removeClass("variable"); // only for ui
	}


