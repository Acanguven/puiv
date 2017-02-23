'use strict';

var templates = {
	themeselect: `<li class="dropdown navbar-message">
	<a href="#" id="id-theme-dropdown" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-eye"></i><span id="id-theme-count" class="rounded count label label-theme"></span></a>
	<div class="dropdown-menu animated flipInX">
    <div class="dropdown-header">
      <span class="title">Temalar</span>
    </div>
    <div class="dropdown-body">
      <div id="id-theme-list" class="media-list small niceScroll">
      	<a class="media theme-select" onclick="setTheme('theme-dark');">
      		<div class="media-body">
        		<span class="media-text">Puiv - Dark</span>
        		<span class="media-meta theme-dark-meta">Seçili</span>
        	</div>
      	</a>
      	<a class="media theme-select" onclick="setTheme();">
      		<div class="media-body">
        		<span class="media-text">Puiv - Normal</span>
        	</div>
      	</a>
      </div>
    </div>
    <div class="dropdown-footer">
       <a href="/k/ssl" target="_blank">SSL</a>
    </div>
  </div>
</li>`
};

function jInvoker() {
  if (window.$){
    $(".navbar-right").prepend(templates.themeselect);
  } else {
    setTimeout(jInvoker, 50);
  }
}

function setTheme(i){
	var classList = $('body').attr('class').split(/\s+/);
	$.each(classList, function(index, item) {
	    if (item.indexOf('theme-') > -1) {
	      $("body").removeClass(item);
	    }
	});

	if(i){
		$("body").addClass(i);
		localStorage.setItem('theme', i);
	}else{
		localStorage.removeItem('theme');
	}
}

var load = function () {
  if(localStorage.getItem('theme')){
		document.body.className += ' ' + localStorage.getItem('theme');
	}
}

jInvoker();
window[ addEventListener ? 'addEventListener' : 'attachEvent' ]( addEventListener ? 'load' : 'onload', load );
