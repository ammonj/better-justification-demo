// global variables

const normalwdth = 100
const fontmin = 40
const fontmax = 200

$(document).ready(function(){
	$txtarea = $("textarea#text-input")
	$column = $("#column")
	$console = $("#console")
})
////////////////////
// helper functions
////////////////////

// "sleep"
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Space-Ruler (from: https://github.com/bramstein/typeset)
ruler = $('<div class="ruler">&nbsp;</div>').css({
	visibility: "visible",
	position: "absolute",
	top: "-8000px",
	width: "auto",
	display: "inline",
	left: "-8000px",
});

// MyConsole (public user interface output)
function myConsole(log) {
	$console.append("<li>" + log + "</li>");
}

// prepare hyphenation and perform it via hypher.js
function makeHyphenation() {
	$txtarea.text($txtarea.val()); // get value of textarea and add it as text so we can inject softhyphens
	let lang = "en"; // set lang default to English
	guessLanguage.detect($txtarea.value, function (language) {
		// language detection via guessLanguage.js
		lang = language; // set lang to returned language
		myConsole("✅ detected language: " + language); // public console output
	});
	if (lang == "de") {
		// if german, insert german hyphenations
		$($txtarea).hyphenate("de");
		myConsole("✅ inserted breakpoints for german language"); // public console output
	} else {
		// if not german, insert english hyphenations
		$($txtarea).hyphenate("en-us");
		myConsole("✅ inserted breakpoints for english language"); // public console output
	}
}

// remove hyphenation
function removeHyphenation() {
	let txtval = $txtarea.val(); // get value from textarea
	txtval = txtval.replace(/\u00AD/g, ""); // remove softhyphens
	$txtarea.text(txtval) // insert into textarea as text
}

// adjust word spacing
function adjustWordSpacing($currentline) {
	$currentline.removeClass("full").css("word-spacing", "normal"); // set width: auto and reset word-spacing

	function countSpaces(text) {
		// count spaces
		spaces = 0;
		for (
			i = 0;
			i < text.length;
			i++
		) {
			if (text.charAt(i) == "\u0020") {
				// if space character
				spaces++; // count up the number of spaces
			}
		}
		return spaces;
	}

	leftSpace = columnWidth - $currentline.width();
	wordSpacing = ruler.width() + leftSpace / countSpaces($currentline.text());
	$currentline.css("word-spacing", wordSpacing + "px").css("width", "100%");
	$currentline.addClass("full");
}


// hanging characters (optical margin) // not finished yet
function optischerRandausgleich() {
	columnwidth = $column.width();
	lineIndex = 0;
	$lines = $("#column .line"); // all the lines
	nol = $lines.length; // total number of lines

	$lines.each(function (lineIndex) {
		// for every line
		lineIndex++;
		string = $(this).text();
		lastCharacter = string.charAt(string.length - 1)

		// if last character is a hyphen or a fullstop AND its not the last line
		if ((lastCharacter == "-" || lastCharacter == "\u002E") && lineIndex < nol) {

			$(this).html(function (_, html) {
				return html.split(lastCharacter).join("<span class='measure'>" + lastCharacter + "</span>");
			});
			
			measure = $(this).find(".measure").width();
			
			wdth = parseInt(
				// get wdth value of current line
				$(this).css("font-variation-settings").replace('"wdth" ', "")
			);
			wordspacing = parseInt(
				// get word spacing value of current line
				$(this).css("word-spacing").replace("px", "").replace("normal", "0")
			);

			$(this).css("display", "inline"); // set line to display: inline to measure it
			
			while ($(this).width() <= columnwidth + (measure / 2)) {
				wdth = wdth + 1;
				$(this).css("font-variation-settings", '"wdth" ' + wdth);

				if (wdth > fontmax) {
					wordspacing = wordspacing + 1;
					$(this).css("word-spacing", wordspacing + "px");
				}
			} 
			$(this).css("display", "inline-block"); // reset display property to fix line in place
		}
		myConsole("✅ line " + lineIndex + ": applied hanging characters");
	});
}



// advanced line breaking (including variable font)
async function advancedLineBreaking(dlig, slow) {
	const text = $txtarea.text(); // get text
	const columnWidth = $column.width(); // get column width

	let lineIndex = 1;
	let ccounter = -1;
	let wdth = normalwdth;

	let $currentLine;
	let totaleLines = 0;

	for (c = 0; c < text.length; c++) {
		// test if line exists, create line
		if (lineIndex > totaleLines) {
			$currentLine = $("<span class='line line-" + lineIndex + "'></span>");
			$column.append($currentLine);

			totaleLines++;
		}

		$currentLine.append(text.charAt(c)); // set character
		if (slow) await sleep(0); // sleep (only for debug purpose)

		if (
			$currentLine.width() >= columnWidth &&
			(text.charAt(c) == "\u0020" || text.charAt(c) == "\u00AD")
		) {
			// if line is full and algorithm reaches break character

			overflow = $currentLine.width() - columnWidth; // delta between line length and column width

			while (overflow > 0) {
				// decrease wdth value of variable font step by step until 0px overflow is left
				wdth = wdth - 1;
				$currentLine.css("font-variation-settings", "'wdth'" + wdth);
				overflow = $currentLine.width() - columnWidth; // recalculate delta
				if (wdth <= fontmin) {
					// if minimum wdth value of variable font is reached
					myConsole("⚠️ line " + lineIndex + ": shrinking failed"); // console output

					if (dlig == true) {
						// if user activated ligatures
						$currentLine.css("font-feature-settings", "'dlig'"); // turn ligatures on
						overflow = $currentLine.width() - columnWidth; // recalculate delta
						if (overflow > 0) {
							$currentLine.css("font-feature-settings", ""); // ligatures are useless in this case, turn them off again
							myConsole(
								"⚠️ line " + lineIndex + ": ligatures didn’t help."
							); // Console Output
						} else {
							myConsole("✅ line " + lineIndex + ": dlig ligatures applied."); // console output
						}
					}
					break; // break out from while loop
				} // close if
			} // close while


			overflow = $currentLine.width() - columnWidth; // recalculate delta
			//console.log("overflow in line" + lineIndex + ": " + overflow);
			
			if (overflow > 0) {
				// if line is still longer than column
				c = c - 1; // go back one character to keep while loop alive
				while (true) {
					// go back character by character to nearest breakpoint
					if (text.charAt(c) == "\u0020" || text.charAt(c) == "\u00AD") {
						break;
					}
					c = c - 1;
				} // close while loop
			} // close if

			// cut string from breakpoint
			cneu = c - ccounter;

			if (text.charAt(c) == "\u0020") {
				// if breakpoint is a space character: just cut
				$currentLine.text(function (_, txt) {
					return txt.slice(0, cneu - 1);
				});
			}

			if (text.charAt(c) == "\u00AD") {
				// if breakpoint is a softhyphen: cut and insert hyphen
				$currentLine.text(function (_, txt) {
					return txt.slice(0, cneu - 1) + "-";
				});
			}

			ccounter = ccounter + cneu;
			overflow = $currentLine.width() - columnWidth; // recalculate delta

			while (overflow < 0) {
				// increase wdth value of variable font, until overflow is 0px
				wdth = wdth + 1;
				$currentLine.css("font-variation-settings", "'wdth'" + wdth);
				overflow = $currentLine.width() - columnWidth; // glaube ich unnötig

				if (wdth > fontmax) {
					$currentLine.prepend("<span class='leftSpaceIndicator'>!</span>"); // add indicator in front of line
					myConsole("⚠️ line " + lineIndex + ": adjusted word spacing");
					adjustWordSpacing($currentLine);
					break;
				} // wenn max der wdth-achse erreicht, unterbreche schleife -> justiere word spacing
			}
			
			overflow = $currentLine.width() - columnWidth; // recalculate delta
			

			// correction for edge cases where +1 on wdth axis makes a huge difference
			if(overflow > 2){
				wdth = wdth - 1;
				$currentLine.css("font-variation-settings", "'wdth'" + wdth);
				$currentLine.prepend("<span class='leftSpaceIndicator'>!</span>"); // add indicator in front of line
				myConsole("⚠️ line " + lineIndex + ": adjusted word spacing");
				adjustWordSpacing($currentLine);
			}
			
			console.log("line: " + lineIndex + " overflow: " + overflow);
			$currentLine.addClass("full"); // fix this line in place
			lineIndex++; // move on with next line
		} // end if

		// last line
		if (c == text.length - 1) {
			// if current character is last character of the given text
			$currentLine.css("font-variation-settings", "'wdth'" + normalwdth); // reset wdth axis in this line
			overflow = $currentLine.width() - columnWidth; // recalculate delta
			if (overflow > 0) {
				while (overflow > 0) {
					// decrease wdth value of variable font until overflow is 0px
					wdth = wdth - 1;
					$currentLine.css("font-variation-settings", "'wdth'" + wdth); // set new wdth value
					overflow = $currentLine.width() - columnWidth; // recalculate delta
					
					if (wdth < fontmin) {
						// if line is still not fitting at minimum font wdth value
						myConsole("⚠️ last line not fitting. didn’t have time to fix this edge case. shit happens.");
						break;
					}
				}// close while
			}
		}
	} // close for

	optischerRandausgleich();
	myConsole("✅ broke text successfully into " + lineIndex + " lines"); // console output
} // close function advanced line breaking



// set text (ragged right)
async function textSetzen() {
	const text = $txtarea.text();
	const columnWidth = $("#column").width();
	let lineIndex = 1;
	let ccounter = -1;

	for (c = 0; c < text.length; c++) {
		// test if line exists, create line
		if ($("#column .line-" + lineIndex).length == 0) {
			$("#column").append("<span class='line line-" + lineIndex + "'></span>");
		}

		$("#column .line-" + lineIndex).append(text.charAt(c)); // set character
		await sleep(0); // sleep (only for debug purpose)

		if ($("#column .line-" + lineIndex).width() >= columnWidth) {
			// if line is full

			if ((text.charAt(c) != "\u0020") & (text.charAt(c) != "\u00AD")) {
				// if no breakpoint at current position
				while (true) {
					// go back until nearest breakpoint
					if (text.charAt(c) == "\u0020" || text.charAt(c) == "\u00AD") {
						break;
					}
					c = c - 1;
				}
			}

			if (text.charAt(c) == "\u0020" || text.charAt(c) == "\u00AD") {
				// if breakpoint at current position

				// cut incomplete word at  end of the line
				cneu = c - ccounter;

				if (text.charAt(c) == "\u0020") {
					// if breakpoint is a space character: just cut
					$("#column .line-" + lineIndex).text(function (_, txt) {
						return txt.slice(0, cneu - 1);
					});
				}

				if (text.charAt(c) == "\u00AD") {
					// if breakpoint is a softhyphen: cut and insert hyphen
					$("#column .line-" + lineIndex).text(function (_, txt) {
						return txt.slice(0, cneu - 1) + "-";
					});
				}

				ccounter = ccounter + cneu;
				$("#column .line-" + lineIndex).addClass("full"); // Zeile auf volle Breite stellen
				lineIndex++; // move on to next line
			}
		}
	} // close for

	makeBlocksatz(); // apply justification
}

// apply justification
function makeBlocksatz() {
	zeilenZahl = $("#column .line").length; // line length
	columnWidth = $("#column").width(); // column width

	$("#column .line").each(function (index, element) {
		$(this).removeClass("full").css("word-spacing", "normal"); // set width: auto and reset word-spacing

		function countSpaces(text) {
			// count spaces
			spaces = 0;
			for (
				i = 0;
				i < text.length;
				i++
			) {
				if (text.charAt(i) == "\u0020") {
					spaces++;
				}
			}
			return spaces;
		}

		leftSpace = columnWidth - $(this).width();
		wordSpacing = ruler.width() + leftSpace / countSpaces($(this).text());

		if (index != zeilenZahl - 1) {
			// if line is not the last line
			$(this)
				.css("word-spacing", wordSpacing + "px")
				.css("width", "100%"); // apply wordspacing
		}

		$(this).addClass("full");
	});

	myConsole("✅ justification applied"); // public console oputput
}


// To Do

// Hurenkinder in letzter Zeile vermeiden
// Dependencies bei checkboxes umsetzen
// Ui sperren während Funktion läuft
// Overflow-Berechnung in Funktion auslagern
// Geschütztes Leerzeichen vor Gedankenstrichen
