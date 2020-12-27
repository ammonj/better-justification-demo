$(document).ready(function () {
	//////////////////
	// User Interface
	//////////////////

	// Buttons and Checkboxes

	$("#justify").click(async function () {
		$("#column").stop().empty().addClass("blocksatz"); // clear text column
		$("#justify").prop("disabled", true);
		$("#console").stop().empty(); // clear console

		if ($("#hyphenation").is(":checked")) {
			// if hyphenation is checked: hyphenate
			makeHyphenation();
		} else {
			// otherwise: remove previous hyphenations
			removeHyphenation();
		}

		if ($("#variable-font").is(":checked")) {
			if ($("#ligatures").is(":checked")) {
				await advancedLineBreaking(true, true); // perform advanced line breaking with ligatures
			} else {
				await advancedLineBreaking(false, true); // perform advanced line breaking without ligatures
			}
		} else {
			// perform regular line breaking
			textSetzen(); // zunächst Linksbündig setzen
			// makeBlocksatz();
		}

		$("#justify").prop("disabled", false);
	});


	/*
	$(".radiobutton").click(function () {
		if ($(this).is("#r1")) {
			$("#column").css("width", "22rem");
			characterCount();
		}
		if ($(this).is("#r2")) {
			$("#column").css("width", "35rem");
			characterCount();
		}
		if ($(this).is("#r3")) {
			$("#column").css("width", "50rem");
			characterCount();
		}
	});
	*/

	// clone column
	$("#clone").click(function () {
		uniqid = Date.now();

		$("#column")
			.clone(true, true)
			.each(function (i) {
				this.id = uniqid; // to keep it unique
			})
			.appendTo("#outputsection")
			.wrap("<div class='wrapper'></div>")
			.before("<span class='remove-col'><img src=\"img/remove.png\" /></span>");
	});

	// delete column clone
	$("#outputsection").on("click", ".remove-col", function () {
		$(this).closest(".wrapper").remove();
	});

	// get color for column border
	function getColor(value) {
		//value from 0 to 1
		var hue = value.toString(10);
		return ["hsl(", hue, ",100%,45%)"].join("");
	}

	// character count
	function characterCount() {
		columnWidth = $("#column").width();
		fontSize = $("#fontsize").val();
		noc = Math.floor((columnWidth / fontSize) * 2.5);
		$("#character-count").html("about <b>" + noc + "</b> characters / line");
		$("#column").css("border-color", getColor(noc));
	}

	characterCount(); // initial character count, also sets border color

	// font size
	$("#fontsize-display").append($("#fontsize").val() + "px"); // set initial font size display
	$("#fontsize").mousemove(function () {
		// live update font-size indicator + font-size preview
		fontsize = $("#fontsize").val() + "px";
		characterCount();
		$("#fontsize-display").text(fontsize);
		$("#column").css("font-size", fontsize);
	});
	$("#fontsize").mouseup(function () {
		// clear column automatically when font-size changes
		$("#column").stop().empty(); // clear text column
		$("#console").stop().empty(); // clear console
		myConsole("✅ set font-size: " + $("#fontsize").val() + "px"); // public console output
	});

	// resizable text column
	$("#column").resizable({
		handleSelector: ".resizehandle",
		resizeHeight: false,
		onDrag: function () {
			characterCount();
		},
	});
	$(".resizehandle").mouseup(function () {
		$("#column").stop().empty(); // clear text column
		$("#console").stop().empty(); // clear console
	});

	// text preview when spacebar is pressed
	$(window).keydown(function (event) {
		if (event.which == 32) {
			event.preventDefault();
			$("body").addClass("preview");
		}
	});
	$(window).keyup(function (event) {
		if (event.which == 32) {
			event.preventDefault();
			$("body").removeClass("preview");
		}
	});
});