// stop loading of the page
window.stop();

var fav_toolbar = $('.child_fav_toolbar');

// replace page content and title
$('style, script, body').remove();

$('html').addClass('blacklisted');

$('html').append($('<body>', {'style': 'font-family: Helvetica;' + 
														  'background-color: #282828;' + 
													 	  '-webkit-background-clip: text;' + 
														  '-moz-background-clip: text;' + 
														  'background-clip: text;' + 
														  'color: rgba(0, 0, 0, 0.3);' +
														  'text-shadow: rgba(255, 255, 255, 0.3) 1px 1px 0px;' +
														  'width: 100%;' + 
														  'height: 100%'}));

$('body').append(fav_toolbar);
$('body').append($('<div>', {'text': String.fromCharCode('9785') + ' ' + self.options.message, 'style': 'position: absolute;' +
																											'top: 50%;' +
																											'left: 50%;' +
																											'margin-left: -50%;' +
																											'width: 100%;' +
																											'font-size: 50px;' +
																											'font-weight: bold;' +
																											'text-align: center;'}));
document.title = self.options.title;

// set favicon to null
var link = document.createElement('link');
link.type = 'image/x-icon';
link.rel = 'shortcut icon';
link.href = '';
document.getElementsByTagName('head')[0].appendChild(link);