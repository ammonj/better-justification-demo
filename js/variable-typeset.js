// To Do

// Bug: wdth: 101 (Tritt nur in Safari auf?)
// wenn satz länger als columne, dann hängt es sich zuverlässig(?) auf

// Optischer Randausgleich
// Hurenkinder in letzter Zeile vermeiden
// Dependencies bei checkboxes umsetzen
// Ui sperren während Funktion läuft
// Overflow-Berechnung in Funktion auslagern
// Geschütztes Leerzeichen vor Gedankenstrichen



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
	let txtval = $txtarea.value; // get value from textarea
	txtval = txtval.replace(/\u00AD/g, ""); // remove softhyphens
	$txtarea.text(txtval) // insert into textarea as text
}

// Word Spacing anpassen (Funktion)

function adjustWordSpacing($currentline) {
	$currentline.removeClass("full").css("word-spacing", "normal"); // set width: auto and reset word-spacing

	function countSpaces(text) {
		// spaces zählen
		spaces = 0;
		for (
			i = 0;
			i < text.length;
			i++ // durchlaufe alle zeichen
		) {
			if (text.charAt(i) == "\u0020") {
				// wenn leerzeichen
				spaces++; // setze variable +1
			}
		}
		return spaces;
	}

	leftSpace = columnWidth - $currentline.width();
	wordSpacing = ruler.width() + leftSpace / countSpaces($currentline.text());
	$currentline.css("word-spacing", wordSpacing + "px").css("width", "100%");
	$currentline.addClass("full");
}

// Optischer Randausgleich (Funktion)

function optischerRandausgleich() {
	columnwidth = $column.width;
	lineIndex = 0;
	nol = $("#column .line").length; // Total number of lines

	$("#column .line").each(function (lineIndex) {
		// Gehe alle Zeilen durch
		lineIndex++;
		string = $(this).text();

		if (
			(string.charAt(string.length - 1) == "-" ||
				string.charAt(string.length - 1) == "\u002E") &&
			lineIndex < nol
		) {
			// Wenn letztes Zeichen ein hyphen oder Punkt UND nicht letzte Zeile

			if (string.charAt(string.length - 1) == "-") {
				// wenn letztes Zeichen ein hyphen
				$(this).html(function (_, html) {
					// Zeichen in ein Span setzen um Breite zu messen
					return html.split("-").join("<span class='measure'>-</span>");
				});

				measure = $(this).find(".measure").width();
				wdth = parseInt(
					$(this).css("font-variation-settings").replace('"wdth" ', "")
				);
				wordspacing = parseInt(
					$(this).css("word-spacing").replace("px", "").replace("normal", "0")
				);

				$(this).css("display", "inline"); // Zeile auf inline setzen um Messung vorzunehmen

				if ($(this).width() > columnwidth) {
					while ($(this).width() > columnwidth + measure / 2) {
						wdth = wdth - 1;
						$(this).css("font-variation-settings", '"wdth" ' + wdth);
						if (wdth == fontmin) {
							break;
						}
					}
					// $(this).css("color","red"); // debug
				}
				if ($(this).width() <= columnwidth) {
					while ($(this).width() < columnwidth + measure / 2) {
						wdth = wdth + 1;
						$(this).css("font-variation-settings", '"wdth" ' + wdth);
						if (wdth > fontmax) {
							wordspacing = wordspacing + 1;
							$(this).css("word-spacing", wordspacing + "px");
						}
					}
					// $(this).css("color","blue");// debug
				}
				$(this).css("display", "inline-block"); // display-Wert wieder zurücksetzen
			}

			if (string.charAt(string.length - 1) == "\u002E") {
				// wenn letztes Zeichen ein Punkt
				$(this).html(function (_, html) {
					// Zeichen in ein Span setzen um Breite zu messen
					return html.split(".").join("<span class='measure'>.</span>");
				});

				measure = $(this).find(".measure").width();
				wdth = parseInt(
					$(this).css("font-variation-settings").replace('"wdth" ', "")
				);
				wordspacing = parseInt(
					$(this).css("word-spacing").replace("px", "").replace("normal", "0")
				);

				$(this).css("display", "inline"); // Zeile auf inline setzen um Messung vorzunehmen

				while ($(this).width() < columnwidth + measure / 2) {
					wdth = wdth + 1;
					$(this).css("font-variation-settings", '"wdth" ' + wdth);
					if (wdth > fontmax) {
						wordspacing = wordspacing + 1;
						$(this).css("word-spacing", wordspacing + "px");
					}
				}
				// $(this).css("color","green");// debug
			}
		}
	});
}

//////////////////
// Advanced Line Breaking (Variable)
//////////////////

async function advancedLineBreaking(dlig, slow) {
	const text = $txtarea.text();
	const columnWidth = $column.width(); // Spaltenbreite

	let lineIndex = 1;
	let ccounter = -1;
	let wdth = normalwdth;

	// $('#xxxxccc') --> auf basis <html>, im besten fall bei <body>
	// $('#askjdhaskjdh', myElement) --> startet bei myElement

	let $currentLine;
	let totaleLines = 0;

	for (c = 0; c < text.length; c++) {
		// test if line exists, create line
		if (lineIndex > totaleLines) {
			$currentLine = $("<span class='line line-" + lineIndex + "'></span>");
			$column.append($currentLine);

			totaleLines++;
		}

		$currentLine.append(text.charAt(c)); // Buchstabe setzen
		if (slow) await sleep(0); // Sleep (only for debug purpose)

		if (
			$currentLine.width() >= columnWidth &&
			(text.charAt(c) == "\u0020" || text.charAt(c) == "\u00AD")
		) {
			// wenn Zeile voll und Breakpoint erreicht
			//console.log("fire currentLine width " + $currentLine.width())

			overflow = $currentLine.width() - columnWidth; // differenz zwischen zeilenlänge und spaltenbreite

			// $currentLineClone = $currentLine.clone()
			$currentLineClone = $currentLine; // schneller bugfix, weil clone nicht gemessen werden kann

			while (overflow > 0) {
				// verkleinere die wdth Achse schrittweise bis nur noch 0px Platz am Ende
				wdth = wdth - 1;
				$currentLineClone.css("font-variation-settings", "'wdth'" + wdth);
				overflow = $currentLineClone.width() - columnWidth; // differenz erneut berechnen
				//console.log("wdth " + wdth + "overflow" + overflow);
				if (wdth <= fontmin) {
					// wenn wdth achse ausgerzeizt ist
					myConsole("⚠️ line " + lineIndex + ": shrinking failed"); // Console Output

					if (dlig == true) {
						// wenn dlig == true
						$currentLineClone.css("font-feature-settings", "'dlig'"); // aktiviere dlig feature in dieser zeile
						overflow = $currentLineClone.width() - columnWidth; // differenz erneut berechnen
						if (overflow > 0) {
							$currentLineClone.css("font-feature-settings", ""); // dlig  hat nichts gebracht, kann also wieder deaktiviert werden
							myConsole(
								"⚠️ line " + lineIndex + ": dlig nicht angewandt" + overflow
							); // Console Output
						} else {
							myConsole("✅ line " + lineIndex + ": dlig angewandt"); // Console Output
						}
					}
					break; // aus while ausbrechen
				} // close if
			} // close while

			$currentLine.css(
				"font-variation-settings",
				$currentLineClone.css("font-variation-settings")
			);

			overflow = $currentLine.width() - columnWidth; // differenz erneut berechnen (kann evtl gespart werden)
			if (overflow > 0) {
				// wenn zeile immer noch länger als spaltenbreite
				// vor dem wort abschneiden
				c = c - 1; // gehe einen character zurück im string, damit while-schleife nicht direkt abbricht
				while (true) {
					// gehe so lange zurück bis nächstmöglicher Breakpoint kommt
					if (text.charAt(c) == "\u0020" || text.charAt(c) == "\u00AD") {
						break;
					}
					c = c - 1;
				}
			} // close if

			// String am Breakpoint abschneiden

			cneu = c - ccounter;

			if (text.charAt(c) == "\u0020") {
				// Wenn Leerzeichen: nur abschneiden
				$currentLine.text(function (_, txt) {
					return txt.slice(0, cneu - 1);
				});
			}

			if (text.charAt(c) == "\u00AD") {
				// Wenn Softhyphen: abschneiden und Trennstrich einfügen
				$currentLine.text(function (_, txt) {
					return txt.slice(0, cneu - 1) + "-";
				});
			}

			// Variable Font Action

			ccounter = ccounter + cneu;
			wdth = normalwdth; // reset wdth Achse, um Vorgang zu beschleunigen
			overflow = $currentLine.width() - columnWidth; // differenz zwischen zeilenlänge und spaltenbreite

			// $currentLineClone = $currentLine.clone()
			$currentLineClone = $currentLine; // schneller bugfix, weil clone nicht gemessen werden kann

			while (overflow < 0) {
				// vergrößere die wdth Achse schrittweise bis nur noch 0px Platz am Ende
				wdth = wdth + 1;
				$currentLineClone.css("font-variation-settings", "'wdth'" + wdth);
				overflow = $currentLineClone.width() - columnWidth; // differenz erneut ausrechnen

				if (wdth > fontmax) {
					console.log("LeftSpace in Zeile " + lineIndex); // Legacy Console
					myConsole("⚠️ line " + lineIndex + ": adjusted word spacing");
					$currentLine.css(
						"font-variation-settings",
						$currentLineClone.css("font-variation-settings")
					);
					$currentLine.prepend("<span class='leftSpaceIndicator'>!</span>"); // Add LeftSpace Indicator in front of line
					adjustWordSpacing($currentLine);
					break;
				} // wenn max der wdth-achse erreicht, unterbreche schleife -> justiere word spacing
			}

			$currentLine.addClass("full"); // Zeile auf volle Breite stellen
			lineIndex++; // Nächste Zeile
		} // end if

		// Letzte Zeile

		if (c == text.length - 1) {
			// Wenn beim letzten Zeichen angekommen
			$currentLine.css("font-variation-settings", "'wdth'" + normalwdth); // reset wdth Achse in aktueller Zeile
			overflow = $currentLine.width() - columnWidth; // differenz erneut ausrechnen
			if (overflow > 0) {
				while (overflow > 0) {
					// verkleinere die wdth Achse schrittweise bis nur noch 0px Platz am Ende
					wdth = wdth - 1; // wdth wert um 1 vermindern
					$currentLine.css("font-variation-settings", "'wdth'" + wdth); // neuen wdth wert setzen
					overflow = $currentLine.width() - columnWidth; // differenz erneut berechnen
				} // close while
			}
		}
	} // close for

	optischerRandausgleich();

	myConsole("✅ broke text successfully into " + lineIndex + " lines"); // Public Console
} // close function advanced linebreaking (variable)

//////////////////
// Linksbündigen Text setzen
//////////////////

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

		$("#column .line-" + lineIndex).append(text.charAt(c)); // Buchstabe setzen
		await sleep(0); // Sleep (only for debug purpose)

		if ($("#column .line-" + lineIndex).width() >= columnWidth) {
			// wenn Zeile voll

			if ((text.charAt(c) != "\u0020") & (text.charAt(c) != "\u00AD")) {
				// wenn kein Leerzeichen und kein Softhyphen an aktueller Position
				while (true) {
					// gehe so lange zurück bis ein Leerzeichen oder Softhyphen kommt
					if (text.charAt(c) == "\u0020" || text.charAt(c) == "\u00AD") {
						break;
					}
					c = c - 1;
				}
			}

			if (text.charAt(c) == "\u0020" || text.charAt(c) == "\u00AD") {
				// wenn Leerzeichen oder Softhyphen an aktueller Position

				// Unvollständiges Wort am Ende abschneiden

				cneu = c - ccounter;

				if (text.charAt(c) == "\u0020") {
					// Wenn Leerzeichen: nur abschneiden
					$("#column .line-" + lineIndex).text(function (_, txt) {
						return txt.slice(0, cneu - 1);
					});
				}

				if (text.charAt(c) == "\u00AD") {
					// Wenn Softhyphen: abschneiden und Trennstrich einfügen
					$("#column .line-" + lineIndex).text(function (_, txt) {
						return txt.slice(0, cneu - 1) + "-";
					});
				}

				ccounter = ccounter + cneu;
				$("#column .line-" + lineIndex).addClass("full"); // Zeile auf volle Breite stellen
				lineIndex++; // Nächste Zeile
			}
		}
	} // close for

	makeBlocksatz(); // Blocksatz anwenden
} // close textSetzen

//////////////////
// Blocksatz anwenden
//////////////////

function makeBlocksatz() {
	zeilenZahl = $("#column .line").length; // Zeilenlänge
	columnWidth = $("#column").width(); // Spaltenbreite

	$("#column .line").each(function (index, element) {
		$(this).removeClass("full").css("word-spacing", "normal"); // set width: auto and reset word-spacing

		function countSpaces(text) {
			// spaces zählen
			spaces = 0;
			for (
				i = 0;
				i < text.length;
				i++ // durchlaufe alle zeichen
			) {
				if (text.charAt(i) == "\u0020") {
					// wenn leerzeichen
					spaces++; // setze variable +1
				}
			}
			return spaces;
		}

		leftSpace = columnWidth - $(this).width();
		wordSpacing = ruler.width() + leftSpace / countSpaces($(this).text());

		if (index != zeilenZahl - 1) {
			// wenn zeile nicht die letzte
			$(this)
				.css("word-spacing", wordSpacing + "px")
				.css("width", "100%"); // wende errechnetes word spacing an
		}

		$(this).addClass("full");
	});

	myConsole("✅ applied blocksatz"); // Public Console
}
