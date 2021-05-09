/*
    Miro Manestar - 4/12/2021
    A simple script for basic single page applications!
*/

// appendPageTitle is only effective if changePageTitle is true
const changePageTitle = true;
const appendPageTitle = true;

const enableBreadcrumbs = false;
const enableLightbox = true;

// darkIcon only matters if enableThemeMode is true
const enableThemeMode = false;
const darkIcon = '';


$(document).ready(function () {
    if (enableThemeMode)
        colorScheme();
    stickyHeader();
});

window.addEventListener('popstate', function (e) {
    if (window.location.pathname === '/') {
        loadContent(`home`, '', false);
    } else {
        loadContent(window.location.pathname.substr(1), '', false);
    }
});


//When the page is loaded/refreshed, direct to correct page.
function onFirstLoad() {
    if (sessionStorage.getItem('redirect404') !== null) {
        loadContent(sessionStorage.getItem('redirect404').substr(1));
        sessionStorage.removeItem('redirect404');
    } else {
        loadContent('home');
    }
}

const origPageTitle = $('title').text();
function loadContent(selection, state, changeState) {
    $('#page-content').fadeOut('fast', function () {
        $('#page-content').load(`${window.location.origin}/pages/${selection}`, function (response, status) {
            $('.navbar-collapse').collapse('hide');
            if (status === 'success') {

                if (enableBreadcrumbs)
                    insertBreadcrumbs(selection);
                loadPartials(insertLightbox); //Check for partials every time the page is reloaded, then finally run insertLightbox() when finished.

                if (changePageTitle) {
                    let pageTitle = $('#page-title').innerText || selection.split('/')[selection.split('/').length - 1];
                    pageTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

                    if (appendPageTitle)
                        $('title').text(origPageTitle + ' - ' + pageTitle);
                    else
                        $('title').text(pageTitle);
                }

                $('#page-content').fadeIn('fast', function() {
                    let event = new CustomEvent("page-loaded", {"detail": `Page ${ selection } finished loading`});
                    document.dispatchEvent(event);
                });
            }
            if (status === 'error') {
                loadContent('404'); //Possible infinite loop?
                return;
            }
        });
    });
    
    if (typeof changeState === 'undefined' && changeState !== false) {
        if (selection === 'home') { //Instead of home having a /home.html url, display as base domain.
            if (window.location.pathname !== '/') {
                window.history.pushState(state, '', '/');
                $('base').attr('href', '/')
            }
        } else if (selection !== '404' && selection !== window.location.pathname.substr(1)) { //Maintain page url despite 404
            window.history.pushState(state, '', `/${selection}`);
            $('base').attr('href', `${ location.origin }`)
        }
    }

    //Make header link active based on URL
    $('.nav-link').each(function () {
        if ($(this).html().toLowerCase() === location.pathname.split('/')[1] || ( $(this).html().toLowerCase() === 'home' && location.pathname === '/' )) { //Highlight if on home page
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
        //Activate dropdowns
        if ($(this).hasClass('dropdown-toggle')) {
            if (location.pathname.split('/').length > 2 && $(this).prev().hasClass('active')) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        }
    });

    //Activate dropdown items
    $('.dropdown-item').each(function () {
        if ($(this).attr('onclick').split("'")[1] === location.pathname.substr(1)) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
}

function insertBreadcrumbs(selection) {
    const triangle = `<svg style="transform: rotate(90deg); font-size: .7em;" width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-triangle-fill ml-2 mr-2 my-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M7.022 1.566a1.13 1.13 0 0 1 1.96 0l6.857 11.667c.457.778-.092 1.767-.98 1.767H1.144c-.889 0-1.437-.99-.98-1.767L7.022 1.566z"/>
        </svg>`;

    let pathArr = selection.split('/');
    let breadcrumb = `<li class="breadcrumb-item active">Home</li>`;
    if(selection != 'home' && pathArr.length > 0) {
        breadcrumb = `<li class="breadcrumb-item"><a class="hover-scale" role="button" onclick="loadContent('home')">Home</a></li>`;
        for(let i = 0; i < pathArr.length; i++) {
            if(i == pathArr.length - 1) {
                if($('#page-title').length) {
                    breadcrumb += `${triangle} <li class="breadcrumb-item active">${ $('#page-title').text() }</li>`;
                } else {
                    breadcrumb += `${triangle} <li class="breadcrumb-item active">${ pathArr[i].charAt(0).toUpperCase() + pathArr[i].slice(1) }</li>`;
                }
            } else {
                var pageName = '';
                $.get(window.location.origin + '/pages/' + pathArr.slice(0, i + 1).join('/'), function(html) {
                    for(let i = 0 ; i < $(html).length; i++) {
                        if($(html)[i].id === 'page-title') {
                            pageName = $(html)[i].innerText;
                        }
                    }
                    if(pageName !== '') {
                        $('.breadcrumb-item a')[i + 1].innerText = pageName;
                    }
                });

                breadcrumb += `${triangle} 
                    <li class="breadcrumb-item">
                        <a role="button" class="hover-scale" onclick="loadContent('${ pathArr.slice(0, i + 1).join('/') }')">
                            ${ pathArr[i].charAt(0).toUpperCase() + pathArr[i].slice(1) }
                        </a>
                    </li>`;
            }
        }
    }

    $('#page-content').prepend(`
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                ${ breadcrumb }
            </ol>
        </nav>
    `);
}

function loadPartials(callback) {
    $('[partial]').each(function (i) {
        $(this).load(`${ window.location.origin }/partials/${$(this).attr('partial')}`, function (response, status) {
            $(this).contents().unwrap();
            if (status === 'error') {
                $(this).html(`Error loading partial: ${$(this).attr('partial')}`);
            }
        });
    });
    
    callback();
}

//Sticky header with a setTimeout to stop the header "bouncing" on size change during scroll
function stickyHeader() {
    $(window).scroll(function () {
        if ($('.navigation').offset().top >= 50) {
            $('.navigation').addClass('nav-bg');
            $('header').addClass('divider-grey');
        } else {
            $('.navigation').removeClass('nav-bg');
            $('header').removeClass('divider-grey');
        }
    });
}

//Code to easily insert lightbox functionality into images
function insertLightbox() {
    if (!enableLightbox)
        return;

    $('img').each(function () {
        if (!$(this).hasClass('logo-image') && !$(this).hasClass('no-lightbox')) {
            $(this).addClass('image');
            $(this).wrap($('<a/>').attr({ 'href': $(this).attr('src'), 'data-fancybox': 'images', 'data-caption': $(this).attr('alt') }));
        }
    });
}

function colorScheme() {
    //Switch favicon if light mode, since default is dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.getElementById('favicon').setAttribute('href', darkIcon);
    }
}