//begin by hiding everything in order to prevent flickering
$(".tab_container").hide();

//define options to be used for pager
var pagerOptions = {

	// target the pager markup - see the HTML block below
	container: $(".ts-pager"),

	// target the pager page select dropdown - choose a page
	cssGoto  : ".pagenum",
	cssNext: '.next', // next page arrow
	cssPrev: '.prev', // previous page arrow
	cssFirst: '.first', // go to first page arrow
	cssLast: '.last', // go to last page arrow

	// remove rows from the table to speed up the sort of large tables.
	// setting this to false, only hides the non-visible rows; needed if you plan to add/remove rows with the pager enabled.
	removeRows: false,

	// output string - default is '{page}/{totalPages}';
	// possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
	output: '{startRow} - {endRow} / {filteredRows} ({totalRows})'

};

var isActivated = false;

$(function () {
	// Localization : setting values that cannot be localized in plain HTML
	$('#change_pass').attr('value', self.options.change_pass_value);
	$('#table-history .pagesize').attr('title', self.options.page_size_title);
	$('#table-history .pagenum').attr('title', self.options.page_num_title);

	/**
	 * Nav bar management
	 */
    "use strict";
    $("#nav > ul > li").not('#lists, #reports').click(function () {
		showTab($(this).attr('id'));
    });

    /**
     * Save button management
     */
    $('#save').click(function () {
    	if(isActivated) {
    		window.alert('You need to reactivate the extension to use the latest settings');
    	}
    	self.port.emit('save_settings');
    });

	/**
	 * Password page submit action
	 */
	$("#change-pass-pane input.password").keyup(function (event) { 
		//if user presses enter while in a password field, "click" on the submit button
		if(event.keyCode == 13) {
			$("#change_pass").click();
		}
	});

	$("#private-question-pane input.password").keyup(function (event) { 
		//if user presses enter while in a password field, "click" on the submit button
		if(event.keyCode == 13) {
			$("#set-private-question").click();
		}
	});
	
	$("#change_pass").click(function () {
		$(".alert").hide(); //remove any leftover alert

		if($("#new_pass1").val() === $("#new_pass2").val() && $("#new_pass1").val().length >= 4){ //if there was no validation error, send old and new passwords
			var pwords = {};
			pwords.oldpass = $("#old_pass").val();
			pwords.newpass = $("#new_pass1").val();
			self.port.emit("update_pass", pwords);
		} else if($("#new_pass1").val() !== $("#new_pass2").val()) {
			$("#new_pass2").parent().addClass('has-error');
			$("#new_pass2").parent().find('.help-block').css('visibility', 'visible');
		} else if($("#new_pass1").val().length < 4) {
			$("#new_pass1").parent().addClass('has-error');
			$("#new_pass1").parent().find('.help-block').css('visibility', 'visible');
		}
	});

	$('#old_pass').on('change keyup paste', function () {
		$(this).parent().removeClass('has-error');
		$(this).parent().find('.help-block').css('visibility', 'hidden');
	});

	$('#new_pass1').on('change keyup paste', function () {
		if($(this).val().length >= 4) {
			$(this).parent().removeClass('has-error').addClass('has-success');
			$(this).parent().find('.help-block').css('visibility', 'hidden');
		}
		$('#new_pass2').change();
	});

	$('#new_pass1').focusout(function () {
		if($(this).val().length < 4) {
			$(this).parent().removeClass('has-success').addClass('has-error');
			$(this).parent().find('.help-block').css('visibility', 'visible');
		}
	});

	$('#new_pass2').on('change keyup paste', function () {
		if($(this).val() === $('#new_pass1').val()) {
			$(this).parent().removeClass('has-error').addClass('has-success');
			$(this).parent().find('.help-block').css('visibility', 'hidden');
		} else {
			$(this).parent().removeClass('has-success').addClass('has-error');
			$(this).parent().find('.help-block').css('visibility', 'visible');
		}
	});

	$('#set-private-question').click(function () {
		self.port.emit('set_private_question', $('#secret-question').val(), $('#secret-answer').val());
		$('#private-question-pane').hide();
		$('#change-pass-pane').show();
		// display menu if hidden
		if($('#nav').css('opacity') == 0) {
			$('#welcome').remove();
			$('#change-password-title').show();
			$('#nav').css('visibility', 'visible');
			$('#nav').animate({
				opacity: '1.0'
			}, 1000, function () {
				
			});
			showTour();
		}
	});

    /**
     * Handle filtering options clicks
     */
    $("input:radio[name=filteringOptions]").click(function () {
        var val = $(this).val();
        self.port.emit("filter", val); //val can be none, wlist or blist
    });

    /**
     * Handle limit time type options clicks
     */
    $('input:radio[name=limit-time-type-options]').click(function () {
        var val = $(this).val();
        self.port.emit('limit_time_type_set', val); //val can be overall or categories
        $('#limit-time-overall-header, #limit-time-categories-header').hide();
		$('#limit-time-' + val + '-header').show();
		if(val === 'categories') {
			if($('#limit_time_tab select option').length === 0) {
				$('#limitTimeOptions').hide();
			}
		} else {
			$('#limitTimeOptions').show();
		}
		$('input:radio[name=limitTimeOptions]').click(function () {
			var category = $('#limit_time_tab select option:selected').val();
			self.port.emit('limit_time_choice', category, $(this).val());
		});
    });
	
	/**
	 * Init dropdowns for lists management
	 */
	$('#nav #lists .dropdown-menu li').not('.dropdown-header').click(function () {
		showList($(this).attr('id'));
	});

	$('#default-blacklist-search-form').submit(function (e) {
		e.preventDefault();
		if($('#default-blacklist-search-term').val().length < 3) {
			$('#default-blacklist-search-form .help-block').css('visibility', 'visible');
			$('#default-blacklist-search-form').addClass('has-error');
		} else {
			$('#default-blacklist-search-term, #default-blacklist-search-button').attr('disabled', 'disabled');
			$('#default-blacklist-search-button #search-icon').hide();
			$('#default-blacklist-search-button #search-loader').show();
			self.port.emit('default_blacklist_search', $('#default-blacklist-search-term').val());
		}
	});

	$('#default-blacklist-search-term').on('change keyup paste', function () {
		if($(this).val().length > 2) {
			$('#default-blacklist-search-form').removeClass('has-error');
			$('#default-blacklist-search-form .help-block').css('visibility', 'hidden');
		}
	});

	/**
	 * Init tabs in reports panel
	 */
	$('#nav #reports .dropdown-menu li').click(function () {
		showReport($(this).attr('id'));
	});

	$('#clear_login_log, #clear_history_log, #clear_time_log').click(function () {
		var localThis = this;
		var logType = $(localThis).attr('id').split('_')[1];
		self.port.emit('clear_log', logType);
	});

	$('#limit_time').click(function (e) {
		e.preventDefault();
		self.port.emit('limit_time_tab_clicked');
	})

	var idHandledButtons =	'#remove-default-blacklist, ' +
							'#add-default-blacklist, ' +
							'#remove-default-whitelist, ' +
							'#add-default-whitelist, ' +
							'#remove-custom-blacklist, ' +
							'#remove-custom-whitelist';

	$(idHandledButtons).click(function () {
		var self = this;
		var paramArray = $(self).attr('id').split('-');
		listsButtonHandler.apply(null, paramArray);
	});

	$('#add-custom-blacklist, #add-custom-whitelist').click(function () {
		var listName = $(this).attr('id').split('-').pop();
		var uri = window.prompt(self.options.url_add_prompt + ' ' + self.options[listName] + ':');
		if(uri) {
			var category = $('#custom-' + listName + '-categories select option:selected').val();
			if(category) {
				self.port.emit('add_custom_' + listName, uri, category);
			} else {
				inform('Please select a category', 'error', 5000);
			}
		}
	});

	$('#add-custom-blacklist-category, #add-custom-whitelist-category').click(function () {
		var category = window.prompt(self.options.new_category);
		if(category) {
			var id = $(this).attr('id').split('-');
			id.pop();
			var listName = id.pop();
			var select = $('#custom-' + listName + '-categories select');
			// check if this category doesn't already exists
			if(select.find('option[value="' + category.replace(' ', '_') + '"]').length === 0) {
				$('#custom-' + listName + '-inner').append($('<div>', {'id': 'custom-' + listName + '-category-' + category.replace(' ', '_')}));
				select.append(createOption(category).prop('selected', 'selected'));
				select.change();
				self.port.emit('add_custom_' + listName + '_category', category.replace(' ', '_'));
			}
		}
	});

	$('#remove-custom-blacklist-category, #remove-custom-whitelist-category').click(function () {
		var id = $(this).attr('id').split('-');
		id.pop();
		var listName = id.pop();
		var select = $('#custom-' + listName + '-categories select');
		var selectedOption = select.find('option:selected');
		var category = selectedOption.val();
		selectedOption.remove();
		select.change();
		self.port.emit('remove_custom_' + listName + '_category', category);
	});
	
	
	// ------ jQuery Tablesorter plugin------------
	$.extend($.tablesorter.themes.bootstrap, {
		// these classes are added to the table. To see other table classes available,
		// look here: http://twitter.github.com/bootstrap/base-css.html#tables
		table      : 'table table-bordered',
		caption    : 'caption',
		header     : 'bootstrap-header', // give the header a gradient background
		footerRow  : '',
		footerCells: '',
		icons      : '', // add "icon-white" to make them white; this icon class is added to the <i> in the header
		sortNone   : 'bootstrap-icon-unsorted',
		sortAsc    : 'icon-chevron-up glyphicon glyphicon-chevron-up',     // includes classes for Bootstrap v2 & v3
		sortDesc   : 'icon-chevron-down glyphicon glyphicon-chevron-down', // includes classes for Bootstrap v2 & v3
		active     : '', // applied when column is sorted
		hover      : '', // use custom css here - bootstrap class may not override it
		filterRow  : 'form-control', // filter row class
		even       : '', // odd row zebra striping
		odd        : ''  // even row zebra striping
	});
	// call the tablesorter plugin and apply the uitheme widget
	$("#table-history").tablesorter({
		// this will apply the bootstrap theme if "uitheme" widget is included
		// the widgetOptions.uitheme is no longer required to be set
		theme : "bootstrap",

		widthFixed: true,

		headerTemplate : '{content} {icon}', // new in v2.7. Needed to add the bootstrap icon!

		// widget code contained in the jquery.tablesorter.widgets.js file
		// use the zebra stripe widget if you plan on hiding any rows (filter widget)
		widgets : [ "uitheme", "filter", "zebra" ],

		widgetOptions : {
			// using the default zebra striping class name, so it actually isn't included in the theme variable above
			// this is ONLY needed for bootstrap theming if you are using the filter widget, because rows are hidden
			zebra : ["even", "odd"],

			// reset filters button
			filter_reset : ".reset"

			// set the uitheme widget to use the bootstrap theme class names
			// this is no longer required, if theme is set
			// ,uitheme : "bootstrap"
		}
	})
		.tablesorterPager(pagerOptions);
});

// --- END OF document.ready function



function inform(message, type, timeout) { //adds the message to the page in an alert div depending on type (error or success)
	var alertclass = '';
	switch(type){
		case 'error':
			alertclass = 'alert alert-danger';
		break;
		case 'success':
			alertclass = 'alert alert-success';
		break;
	}
	$('#message_container #inform').remove();
	$('#message_container').append($('<div>', {'id': 'inform', 'class': alertclass}).append($('<small>', {'text': message})));

	if(timeout) {
		setTimeout(function () {
			$('#message_container #inform').fadeOut(500, function () {
				$('#message_container #inform').remove();
			});
		}, timeout);
	}
}

// external events listeners
self.port.on("change_pass_result", function (result) {
	if(result) {
		inform(self.options.password_change_success, "success", 3000);
		$("#old_pass").parent().show(); //this was hidden if first password change
		$('#change-pass-pane').hide();
		$('#private-question-pane').show();
		$("#welcome").hide();
		$("input[type=password]").val(""); //set all fields to empty
		$('#old_pass, #new_pass1, #new_pass2').parent().removeClass('has-error').removeClass('has-success');
    } else {
    	$('#old_pass').parent().addClass('has-error');
    	$('#old_pass').parent().find('.help-block').css('visibility', 'visible');
    }
});

self.port.on("set_first_password", function () {
	showTab("pass");
	$("#old_pass").parent().hide();
	$('#change-password-title').hide();
	$('#nav').css('opacity', 0);
	$('#nav').css('visibility', 'hidden');
	$("#message_container").append($('<div>', {'id': 'welcome'}).append($('<h3>', {'text': self.options.welcome_text}))
																.append($('<p>', {'text': self.options.welcome_advice})));
});

self.port.on('current_filter', function (value) {
	if(!value) {
		value = 'none';
	}
	$('#filtering_tab input[name="filteringOptions"][value="' + value + '"]').prop('checked', true);
});

self.port.on('filter_save_success', function () {
	inform(self.options.filter_set, 'success', 3000);
});

// Add elements in lists when initialization is done
self.port.on('blacklist_initialized', function (removedDefaultBlacklistElements) {
	$('#default-blacklist-categories select').selectpicker();
});

self.port.on('default_blacklist_search_response', function (matches, removedMatchesElements) {
	$('#default-blacklist-search-term, #default-blacklist-search-button').removeAttr('disabled');
	$('#default-blacklist-search-button #search-loader').hide();
	$('#default-blacklist-search-button #search-icon').show();

	if(Object.keys(matches).length === 0) {
		$('#default-blacklist-inner').append($('<h4>', {'text': self.options.no_match}));
	} else {
		fillListDivs(matches, removedMatchesElements, 'blacklist', 'default');
	}
});

self.port.on('whitelist_initialized', function (defaultWhitelist, removedDefaultBlacklistElements) {
	fillListDivs(defaultWhitelist, removedDefaultBlacklistElements, 'whitelist', 'default');
});

self.port.on('custom_blacklist_initialized', function (list) {
	fillListDivs(list, null, 'blacklist', 'custom');
});

self.port.on('custom_whitelist_initialized', function (list) {
	fillListDivs(list, null, 'whitelist', 'custom');
});

self.port.on('blacklist_custom_added', function (host, category) {
	addCustomListListener('blacklist', host, category);
});

self.port.on('whitelist_custom_added', function (host, category) {
	addCustomListListener('whitelist', host, category);
});

self.port.on('error_null_category', function () {
	inform(self.options.no_category_error, 'error', 5000);
});

self.port.on('malformed_url', function() {
	inform(self.options.malformed_url, 'error', 5000);
});

self.port.on('host_already_added', function() {
	inform(sefl.options.already_present_url, 'error', 5000);
});

self.port.on('login_log_read', function (events) {
	fillLoginReport(events);
});

self.port.on('history_log_read', function (visits) {
	fillHistoryReport(visits);
});

self.port.on('time_log_read', function (times) {
	fillTimeReport(times);
});

self.port.on('show_filtering', function () {
	$('#filtering').click();
});

self.port.on('limit_time_type', function (value) {
	if(!value) {
		value = 'overall';
	}
	$('#limit_time_tab input[name="limit-time-type-options"][value="' + value + '"]').prop('checked', true).click();
});

self.port.on('limit_time_type_save_success', function () {
	inform('Time limitation method has been successfully saved', 'success', 3000);
});

self.port.on('time_limit_initialized', function (categories) {
	fillTimeLimitSelect(categories);
});

self.port.on('time_limit_set', function () {
	inform(self.options.time_limit_set, 'success', 3000);
});

self.port.on('is_activated', function (isActivatedParam) {
	isActivated = isActivatedParam;
});

/**
 * Event handler when the 'add' button is clicked for custom lists
 *
 * @param {blacklist|whitelist} name of the list 
 */
function addCustomListHandler(listName) {
	var uri = window.prompt(self.options.add_url + ' ' + self.options[listName] + ':');
	if(uri) {
		var category = $('#custom-' + listName + '-categories select option:selected').val();
		self.port.emit('add_custom_' + listName, uri, category);
	}
}

/**
 * Event listener when an entry is added in the custom lists
 *
 * @param {blacklist|whitelist} listName
 * @param {string} host
 * @param {string} category of the added host
 */
function addCustomListListener(listName, host, category) {
	if(host) {
		var divId = 'custom-' + listName + '-category-' + category;
		if($('#' + divId).length === 0) {
			var div = $('<div>', {'id': divId});
			$('#custom-' + listName + '-inner').append(div);
		}
		var div = $('#' + divId);
		div.append(createCheckbox(host));

		addInputChangeHandler(div);
	} else {
		inform(self.options.host_not_added + ' ' + self.options[listName] + self.options.check_syntax, 'error');
	}
}

/**
 * This function fills the correct divs when lists are initialized
 *
 * @param {object} defaultList list of default elements
 * @param {object} removedList list of removed elements (may be empty)
 * @param {blacklist|whitelist} name of the list to be filled
 * @param {default|custom} type of the list
 */
function fillListDivs(defaultList, removedList, name, type) {
	var prefix = type + '-' + name,
		removedPrefix = '';
	fillListsDivsHelper(defaultList, prefix);
	if(removedList !== null) {
		removedPrefix = 'removed-' + prefix;
		fillListsDivsHelper(removedList, removedPrefix);
	}

	fillMenu(defaultList, prefix, removedPrefix);
}

/**
 * This function is a helper for fillListsDivs function
 * This function shouldn't be used by any other function than fillListsDivs
 *
 * @param {object} list of elements to add
 * @param {string} prefix of id of elements
 */
function fillListsDivsHelper(list, prefix) {
	$('#' + prefix + '-inner').empty();

	Object.keys(list).forEach(function (category) {
		var div = $('<div>', {'id': prefix + '-category-' + category});
		list[category].forEach(function (elem) {
			div.append(createCheckbox(elem));
		});

		addInputChangeHandler(div);

		$('#' + prefix + '-inner').append(div);
	});
	$('#' + prefix + '-inner > div:not(:first)').hide();
}

/**
 * This function is a helper for fillListsDivs function.
 * It fills the menu with the categories in the given list and handles category changes
 *
 * @param {object} list of added elements
 * @param {string} prefix of id of elements
 * @param {string} prefix of the removed elements divs
 */
function fillMenu(list, prefix, removedPrefix) {
	$('#' + prefix + '-categories select').empty();

	var categories = Object.keys(list);
	var select = $('#' + prefix + '-categories select');

	if(categories.length > 0) {
		categories.forEach(function (category) {
			select.append(createOption(category));
		});
		select.first('option').prop('selected', 'selected');
		select.prop('disabled', false);
		select.selectpicker('refresh');
	} else {
		select.prop('disabled', true);
		select.selectpicker('refresh');
	}

	select.change(function () {
		$('#' + prefix + '-inner > div').hide();
		$('#' + prefix + '-category-' + $(this).val()).show();
		$('#' + prefix + '-category-' + $(this).val() + ' input').change();
	}).change();

	if(prefix.indexOf('custom') !== -1) {
		$('#' + prefix + '-categories select').change(function () {
			if($(this).find('option').length == 0) {
				$(this).prop('disabled', true);
			} else {
				$(this).prop('disabled', false);
			}
			if($(this).find('option:selected').length == 0) {
				$('#add-' + prefix).attr('disabled', 'disabled');
			} else {
				$('#add-' + prefix).removeAttr('disabled');
			}
			$(this).selectpicker('refresh');
		}).change();
	}
	
	if(removedPrefix) {
		select.change(function () {
			$('#' + removedPrefix + '-inner > div').hide();
			$('#' + removedPrefix + '-category-' + $(this).val()).show();
		}).change();
	}
}

/**
 * Event handler for lists actions
 * 
 * @param {add|remove} event type
 * @param {default|custom} list type
 * @param {blacklist|whitelist} list name
 */
function listsButtonHandler(eventType, listType, listName) {
	var prefixOrigin = '',
		prefixDest = '',
		checked_elements = [],
		category = '',
		label,
		br;

	if(eventType) {
		prefixOrigin = eventType === 'add' ? 'removed-' : '';
		prefixDest = prefixOrigin === 'removed-' ? '' : 'removed-';
	}

	category = $('#' + listType + '-' + listName + '-categories option:selected').val();

	$('#' + prefixOrigin + listType + '-' + listName + '-inner input:checked').each(function(index, element) {
		checked_elements.push(element.id);
		if(listType === 'default') {
			$(element).attr('checked', false).change();
			$('#' + prefixDest + listType + '-' + listName + '-category-' + category).append($(element).parent().parent());

			$(element).unbind('change');
			addInputChangeHandler($(element).parent().parent().parent());
		} else {
			var containingDiv = $(element).parent().parent().parent();
			$(element).parent().parent().remove();
			containingDiv.find('input').change();
			/*if($('#' + listType + '-' + listName + '-category-' + category + ' input').length == 0) {
				$('#' + listType + '-' + listName + '-categories option:selected').remove();
				$('#' + listType + '-' + listName + '-categories select').change().selectpicker('refresh');
				$('#remove-' + listType + '-' + listName).attr('disabled', 'disabled');
			}*/
		}
	});

	self.port.emit(eventType + '_' + listType + '_' + listName, checked_elements, category);
}

/**
 * This function creates a checkbox with everything around it
 *
 * @param {string} id and text of the checkbox
 */
function createCheckbox(label) {
	return $('<div>', {'class': 'checkbox'}).append($('<label>', {'text': label}).append($('<input>', {'type': 'checkbox', 'id': label})));
}

/**
 * This function creates option element for selects in lists
 *
 * @param {string} label of the option
 */
function createOption(label) {
	return $('<option>', {'value': label.replace(' ', '_'), 'text': label.replace('_', ' ')});
}

/**
 * This function adds change event handlers on every input element of the div on order to activate or deactivate buttons
 *
 * @param {Object} div containing input elements
 */
function addInputChangeHandler(div) {
	div.find('input').change(function () {
		var prefix = div.parent().attr('id').replace('-inner', '').replace('removed', 'add');
		if(!prefix.startsWith('add')) {
			prefix = 'remove-' + prefix;
		}
		var localDiv = div;

		if(localDiv.find('input:checked').length === 0) {
			$('#' + prefix).attr('disabled', 'disabled');
		} else {
			$('#' + prefix).removeAttr('disabled');
		}
	});
}

/**
 * Fill login report panel
 *
 * @param {string} events of the login report
 */
function fillLoginReport(events) {
	$('#login-pane #events').empty();
	
	if(events.length !== 1 || events[0] !== '') {
		$('#login-pane #no-event').hide();
		events.forEach(function (eventElement) {
			if(eventElement) {
				var eventSplit = eventElement.split(' : ');
				var timestamp = $('<b>', {'text': eventSplit[0] + ' : '});
				var br = $('<br>');
				var line = $('<div>', {'text': self.options[eventSplit[1]]}).prepend(timestamp).append(br);
				$('#login-pane #events').append(line);
			}
		});
	} else {
		$('#login-pane #no-event').show();
	}
}

/**
 * Fill history report panel
 *
 * @param array visits from the history log
 */
function fillHistoryReport(visits) {
	$('#history-pane tbody').empty();
	$('#table-history').trigger('destroy.pager');
	$("#table-history").trigger("update"); //trigger an update after emptying
	//pad(number) function adds zeros in front of number, used to get consistent date / time display. 
	function pad (number) {
		return ("00" + number).slice(-2);
	}

	if(visits.length === 0) {
		$('#history-pane #visits').hide();
		$('#history-pane #no-visit').show();
	} else {
		$('#history-pane #no-visit').hide();
		$('#history-pane #visits').show();
		//for each visit found in the log add a row to the table
		visits.forEach(function (visitElement) {
			if(visitElement) {
				//prepare the data for display
				var visit = {};
				
				var visitDate = new Date(+visitElement.timestamp);
				visit.date = visitDate.getFullYear() + "-"+ 
							pad((visitDate.getMonth()+1))+ "-" +
							pad(visitDate.getDate())+" "+
							pad(visitDate.getHours())+":"+
							pad(visitDate.getMinutes());

				visit.title = decodeURI(visitElement.title);
				//visit.url = $('<a>', {'href': visitElement.url, 'text': removeUrlPrefix(visitElement.url)});
				//visit.url.attr("target","_blank");

				//create a row that will hold the data
				var line = $('<tr>'); 
				
				//for each attribute of the visit, create a table data element and put it in the row
				for (var name in visit) {
					if (visit.hasOwnProperty(name)) {
						line.append($('<td>', {'text': visit[name]}));
					}
				}
				var url_cell=$('<td>').append($('<a>', {'href': decodeURI(visitElement.url), 'text': decodeURI(removeUrlPrefix(visitElement.url)), 'target':"_blank"}));
				line.append(url_cell);
				
				//append the line to the table
				$('#table-history')
					.find('tbody').append(line)
					.trigger('addRows',[$(line)]);
			}
		});
		$('#table-history').tablesorterPager(pagerOptions);
		$("#table-history").trigger("update"); //trigger update so that tablesorter reloads the table
		$(".tablesorter-filter").addClass("form-control input-md");
	}
}

/**
 * Fill time report panel
 *
 * @param array times spent on each category
 */
function fillTimeReport(times) {
	var tableBody = $('#time-pane tbody');

	tableBody.empty();

	var categories = Object.keys(times);
	if(categories.length > 0) {
		$('#time-pane #no-categories').hide();
		$('#time-pane #categories').show();

		var oneMinute = 60,
			oneHour = oneMinute*60,
			oneDay = oneHour*24;

		categories.forEach(function (category) {
			var line = $('<tr>');
			var categoryCell = $('<td>', {'text': category.replace('_', ' ')});

			var timeSpent = times[category].duration;

			var days = Math.floor(timeSpent/oneDay),
				hours = Math.floor((timeSpent%oneDay)/oneHour),
				minutes = Math.floor((timeSpent%oneDay)%oneHour/oneMinute),
				seconds = Math.floor(((timeSpent%oneDay)%oneHour)%oneMinute);

			var daysString = days>0 ? days + ' day' + (days>1 ? 's ' : ' ') : '',
				hoursString = hours>0 ? hours + ' hour' + (hours>1 ? 's ' : ' ') : '',
				minutesString = minutes>0 ? minutes + ' minute' + (minutes>1 ? 's ' : ' ') : '',
				secondsString = seconds>0 ? seconds + ' second' + (seconds>1 ? 's' : '') : '';

			var timeString = daysString + hoursString + minutesString + secondsString;
			if(timeString === '') {
				timeString = self.options.no_time_spent;
			}

			var timeSpentCell = $('<td>', {'text': timeString});

			line.append(categoryCell).append(timeSpentCell);
			tableBody.append(line);
		});
	} else {
		$('#time-pane #categories').hide();
		$('#time-pane #no-categories').show();
	}
}

/*
 * Fill the select for the time limitation
 *
 * @param {array} categories to be added to the select element
 */
function fillTimeLimitSelect (timeLimits) {
	var categories = Object.keys(timeLimits);
	$('#limit_time_tab select').empty();
	if(categories.length === 0) {
		if($('#limit-time-categories-radio').is(':checked')) {
			$('#limitTimeOptions').hide();
		}
		$('#limit_time_options_title').hide();
		$('#limit_time_tab select').selectpicker('hide');
		$('#limit_time_no_category').show();
	} else {
		$('#limit_time_no_category').hide();
		$('#limitTimeOptions').show();
		$('#limit_time_options_title').show();
		$('#limit_time_tab select').empty().selectpicker('show');
		categories.forEach(function (category) {
			$('#limit_time_tab select').append(createOption(category));
		});

		$('#limit_time_tab select').change(function () {
			var category = $('#limit_time_tab select option:selected').val();
			$('#limit_time_tab input[name="limitTimeOptions"][value="' + timeLimits[category].limit + '"]').prop('checked', true);
		}).change();

		$('#limit_time_tab select').selectpicker('refresh');
	}
}

function showTab(tab_choice) { //hides other content and shows chosen tab "pass","filtering","lists" or "report"
	self.port.emit("tab_choice", tab_choice);
	$(".tab_container").hide();
	$(".alert").hide(); //remove leftover alerts
	$("#"+tab_choice+"_tab").show();
	$("#nav .active").removeClass("active");
	$("#"+tab_choice).addClass("active");
}

function showList(list_choice) {
	self.port.emit('lists_tab_choice', list_choice);
	showTab('lists');
	$('#lists_tab .list-pane').hide();
	$('#lists_tab #' + list_choice + '-pane').show();
	// center glyphicons in buttons
	$('#lists_tab #' + list_choice + '-buttons span.glyphicon').css('margin-top', ($('#lists_tab #' + list_choice + '-buttons button').height() - $('#lists_tab #' + list_choice + '-buttons span.glyphicon').height()) / 2);
}

function showReport(report_choice) {
	self.port.emit('reports_tab_choice', report_choice);
	showTab('reports');
	$('#reports_tab .report-pane').hide();
	$('#reports_tab #' + report_choice + '-pane').show();
}

function removeUrlPrefix(url) {
	prefix = /(^https?:\/\/|www\.|\/$)/g;
	// remove any prefix
    url = url.replace(prefix, "");
	//url = url.replace(/www\/./, "");
	return url;
}