// SPDX-FileCopyrightText: 2021 IDM Südtirol Alto Adige <info@idm-suedtirol.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
    tns
} from 'tiny-slider';

//import './../scss/widget.scss';
import style from './../scss/widget.scss';

//------------------------VARS----------------------//
var hiddenEntities = "";

var container = "";
var clientColor = "";
var clientLanguage = "";
var clientIgnore = [];
var clientFilter = [];
var cards = 0;
var lazyLoadedEntities = false;
var currentPage = 1;
var currentSlide = 0;

var urlParameters = "?utm_source="+ window.location.host +"&utm_medium=howtoarrivewidget";
var randomArticles = "false";

var filterMapping = {
    "Airplane" : "5A255446-0EE1-3BEF-6007-B869AFCE9D82",
    "Train" : "796642BD-039D-7A18-B448-139D74858586",
    "Bus" : "5EF21701-2B9F-94F1-007D-44EACF19D5C9",
    "Car" : "45A9340C-7EDB-FB30-516C-08D47AFFFCAA",
    "Transfers" : "C3D525B2-1486-AC99-CF05-4C306DF7316C",
    "LocalMobility" : "E4EBB80F-293F-3669-3DCA-69E0693AEAFB",
    "Dolomitipasses" : "29FF5D46-AA5E-1207-158B-ED2C54F347D6",
    "TrafficRestrictions" : "3F5E6A07-A774-61D0-8AC7-DA25E77BB995",
};

const translations = {
    de: {
        no_program_title: "Derzeit ist kein Artikel hinterlegt",
    },
    it: {
        no_program_title: "Attualmente non è disponibile nessun articolo"
    },
    en: {
        no_program_title: "Currently there is no article available"
    },
    fr: {
        no_program_title: "Aucun article n'est actuellement disponible"
    },
    nl: { 
        no_program_title: "Er is momenteel geen artikel beschikbaar"
    },
    cs: {  
        no_program_title: "Momentálně není k dispozici žádný článek"
    },
    pl: { 
        no_program_title: "Obecnie nie jest dostępny żaden artykuł"
    }
};

// const cssPath = "./dist/css/widget.css";
// document.querySelector('head').innerHTML += '<link rel="stylesheet" href="' + cssPath + '" type="text/css"/>';
document.querySelector('head').innerHTML += '<style>' + style + '</style>';

// widget
if (document.querySelectorAll('odh-howtoarriveinsouthtyrol-widget').length) {

    container = document.querySelectorAll('odh-howtoarriveinsouthtyrol-widget')[0];
    if (container.classList.contains('odh-howtoarriveinsouthtyrol-initialized') == false) {
        container.classList.add('odh-howtoarriveinsouthtyrol-widget');
        clientColor = container.getAttribute('data-color');
        clientLanguage = container.getAttribute('data-lang');
        
        if (container.getAttribute('data-ignore') != undefined) {
            clientIgnore = container.getAttribute('data-ignore');
        }
        if (container.getAttribute('data-filter') != undefined && container.getAttribute('data-filter') != "") {
            clientFilter = container.getAttribute('data-filter');
            Object.keys(filterMapping).forEach((key) => {
                clientFilter = clientFilter.replaceAll(key, filterMapping[key]);
              });
        }
        if (container.getAttribute('data-hideaccommodations') != undefined && container.getAttribute('data-hideaccommodations') == "true") {
            urlParameters += "&partner=accommodation";
        }

        if (container.getAttribute('data-random') != undefined) {
            randomArticles = container.getAttribute('data-random');
        }

        document.write('<style>.odh-howtoarriveinsouthtyrol-widget .tns-nav button.tns-nav-active { background-color:' + clientColor + ' } </style>');
        var htmlstring = loadingPlaceholder();
        container.innerHTML = htmlstring;
        getWidgetData();
    }
}


//------------------------FUNCTIONS----------------------//


function getWidgetData(type, slider) {


    var xmlhttp = new XMLHttpRequest();

    xmlhttp.open('GET', 'https://tourism.opendatahub.com/v1/Article?articletype=specialannouncement&origin=webcomp-howtoarriveinsouthtyrol&odhactive=true&odhtagfilter=special-announcement-anreise&langfilter=' + clientLanguage + '&pagenumber=' + currentPage + '&rawsort=AdditionalArticleInfos.' + clientLanguage + '.Elements.dateposted&referer='+window.location.host, true);
    xmlhttp.setRequestHeader("Access-Control-Allow-Origin", "*");
    xmlhttp.setRequestHeader("Access-Control-Allow-Credentials", "true");
    xmlhttp.setRequestHeader("Access-Control-Allow-Methods", "GET");
    xmlhttp.setRequestHeader("Access-Control-Allow-Headers", "Content-Type");
    
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                var obj = JSON.parse(xmlhttp.responseText);
                if (type != 'update') {
                    currentPage++;
                    createSlider(obj)
                } else {
                    refreshSlider(obj, slider)

                    if (obj.NextPage != null) {
                        currentPage++;
                    } else {
                        lazyLoadedEntities = true;
                    }
                }
            }
        }
    };
    xmlhttp.send(null);
}

function createSlider(data) {

    var entities = null;
    entities = data.Items;
    
    //sort articles exactly as data-filter order
    if(clientFilter){
        entities = sortArticles(entities,clientFilter);
    }

    container.innerHTML = renderIdm(entities);
    initSlider();
}

function refreshSlider(data, slider) {

    var entities = null;
    // create Skeleton
    entities = data.Items;

    //sort articles exactly as data-filter order
    if(clientFilter){
        entities = sortArticles(entities,clientFilter);
    }

    slider.destroy()
    container.querySelector('.odh-howtoarriveinsouthtyrol-wrapper').innerHTML = container.querySelector('.odh-howtoarriveinsouthtyrol-wrapper').innerHTML += updateHtml(entities);
    initSlider();
}

//initSlider
function initSlider() {
var cardsTablet = 2;
    if (cards > 3){
        cards = 4;
        cardsTablet = 2;
    }else if(cards == 0 || cards == 1){
        cards = 1;
        cardsTablet = 1;
    }
    
    var idmslider = tns({
        container: container.querySelector(".odh-howtoarriveinsouthtyrol-wrapper"),
        slideBy: 'page',
        autoplay: false,
        autoWidth: false,
        nextButton: container.querySelector('.odh-howtoarriveinsouthtyrol-button-next'),
        prevButton: container.querySelector('.odh-howtoarriveinsouthtyrol-button-prev'),
        loop: false,
        startIndex: currentSlide,
        nav: true,
        center: false,
        onInit: container.classList.add('odh-howtoarriveinsouthtyrol-initialized'),
        mouseDrag: true,
        responsive: {
            0: {
                edgePadding: 20,
                gutter: 10,
                items: 1,
                center: true
            },
            600: {
                items: cardsTablet,
                edgePadding: 0,
                gutter: 0,
                center: false,
            },
            1100: {
                items: cards,
                center: false,

            },
            9999: {
                items: cards,
                center: false,

            },

        }
    });

    idmslider.events.on('transitionEnd', function () {
        currentSlide = idmslider.getInfo().index;
        if (container.querySelector('.odh-howtoarriveinsouthtyrol-button-next').getAttribute('aria-disabled') == 'true') {
            if (lazyLoadedEntities == false) {
                getWidgetData('update', idmslider);
            }
        }

    });
}

//loading
function loadingPlaceholder() {
    var htmlstring = '';
    htmlstring += '<div style="text-align: center;">';
    htmlstring += '<svg height="38" viewBox="0 0 38 38" width="38" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="a" x1="8.042%" x2="65.682%" y1="0%" y2="23.865%"><stop offset="0%" stop-color="#ccc" stop-opacity="0"></stop><stop offset="63.146%" stop-color="#ccc" stop-opacity=".631"></stop><stop offset="100%" stop-color="#ccc"></stop></linearGradient></defs><g fill="none" fill-rule="evenodd"><g transform="translate(1 1)"><path d="M36 18c0-9.94-8.06-18-18-18" id="Oval-2" stroke="url(#a)" stroke-width="2"><animateTransform attributeName="transform" dur="0.9s" from="0 18 18" repeatCount="indefinite" to="360 18 18" type="rotate"></animateTransform></path><circle cx="36" cy="18" fill="#ccc" r="1"><animateTransform attributeName="transform" dur="0.9s" from="0 18 18" repeatCount="indefinite" to="360 18 18" type="rotate"></animateTransform></circle></g></g></svg>';
    htmlstring += '</div>';
    return htmlstring;
}

function renderIdm(entities) {

    if(randomArticles == "true"){
        shuffleArticles(entities)
    }

    var htmlstring = '';
    htmlstring += '<div class="odh-howtoarriveinsouthtyrol-widget-outer-container">';
    htmlstring += '<div class="odh-howtoarriveinsouthtyrol-widget-container odh-howtoarriveinsouthtyrol-container-horizontal">';
    htmlstring += '<div class="odh-howtoarriveinsouthtyrol-wrapper">';

    for (var key in entities) {
        var entity = entities[key];

        
        if ((clientFilter.includes(entity.Id) || clientFilter.length == 0) && (!clientIgnore.includes(entity.Id) || clientIgnore.length == 0)) {
            //SLIDE
            cards ++;
            if (entity.AdditionalArticleInfos[clientLanguage] != null) {
                htmlstring += '<a target="_blank" href="' +(entity.AdditionalArticleInfos[clientLanguage].Elements.newsUpdatesAndGuidelines) + urlParameters + '">';
            }
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide">';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-container">';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-inner">';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-inner-top">';
            if (entity.ImageGallery != '') {
                htmlstring += '<img class="tns-lazy-img" src="' + entity.ImageGallery[0].ImageUrl + '&width=1024' + '"></div>';
            }
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-inner-bottom">';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-inner-text">' + entity.Detail[clientLanguage].Title + '<div class="odh-howtoarriveinsouthtyrol-slide-inner-date">';
            htmlstring += '</div>';
            htmlstring += '</div>';
            htmlstring += '</div>';
            htmlstring += '</div>';
            htmlstring += '</div>';
            htmlstring += '</div>';
            if (entity.AdditionalArticleInfos[clientLanguage] != null) {
                htmlstring += '</a>';
            }
        }

    }

    // SHOW EMPTY TEXT IF NO ARTICLES
    if(cards == 0){
        htmlstring += '<div class="odh-no-entries">';
        htmlstring += '<p>' + translations[clientLanguage].no_program_title + '</p>';
        htmlstring += '</div>';
    }

    htmlstring += '</div>';
    if(cards > 1){
    // PREV ARROW
    htmlstring += '<div class="odh-howtoarriveinsouthtyrol-button-prev" tabindex="0" role="button" aria-label="Previous slide"  aria-disabled="false"><svg height="17.64" viewBox="0 0 9.84 17.64" width="9.84" xmlns="http://www.w3.org/2000/svg"> <defs>  <style> .odh-howtoarriveinsouthtyrol-widget .a-arrow  {  fill: ' + clientColor + ';    }      </style>  </defs>  <path class="a-arrow" d="M5389.72,253.56l8.22,8.28.48.54-.48.54-8.22,8.28-1.14-1.14,7.74-7.68-7.74-7.68"  transform="translate(5398.42 271.2) rotate(180)"></path> </svg></div>';
    }

    if(cards > 1){
    // NEXT ARROW
    htmlstring += '<div class="odh-howtoarriveinsouthtyrol-button-next active" tabindex="0" role="button" aria-label="Next slide" aria-disabled="false"><svg height="17.64" viewBox="0 0 9.84 17.64" width="9.84" xmlns="http://www.w3.org/2000/svg">  <defs> <style> .odh-howtoarriveinsouthtyrol-widget .a-arrow  {  fill: ' + clientColor + '; }  </style> </defs>   <path class="a-arrow"  d="M5389.72,253.56l8.22,8.28.48.54-.48.54-8.22,8.28-1.14-1.14,7.74-7.68-7.74-7.68"   transform="translate(-5388.58 -253.56)"></path>   </svg></div>';
    }

    htmlstring += '</div>';
    //powered by Suedtirolinfo
    htmlstring += '<div class="odh-howtoarriveinsouthtyrol-powered-by"> powered by <a href="https://www.suedtirol.info/" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="93.663" height="73.688" viewBox="0 0 93.663 73.688"><path d="M0,64.491V3.353l1.222-.137C1.508,3.184,30.012,0,46.838,0,65.7,0,92.187,3.185,92.453,3.217l1.21.147V64.491l-46.832,9.2Z" fill="#d0d7d8"/><path d="M46.976,1.513c19,0,45.449,3.207,45.449,3.207V63.5L46.969,72.424,1.513,63.5V4.72S30.031,1.513,46.976,1.513Z" transform="translate(-0.138 -0.138)" fill="#fff"/><g transform="translate(2.925 47.664)"><path d="M3.217,65.2V67.37l7.871,1.546,1.523-3.806-1.523-3.806Z" transform="translate(-3.217 -53.236)" fill="#50742f"/><path d="M15.237,59.476l-3.362,1.663V68.75l10.046,1.973,1.251-5.464-1.251-5.783Z" transform="translate(-4.004 -53.069)" fill="#a9cde9"/><path d="M27.642,62.412l-2.249-2.936H22.925V70.723l4.717.926,1.264-5.3Z" transform="translate(-5.008 -53.069)" fill="#b31939"/><path d="M32.449,71.959l1.185-9.223-1.185-9.224-2.381,1.265L28.114,61.87v9.238Z" transform="translate(-5.48 -52.527)" fill="#de7000"/>';
    htmlstring += '<path d="M41.521,57.585l.532,7.337-.532,8.636-8.639-1.7V53.414l1.85-.985Z" transform="translate(-5.913 -52.429)" fill="#a9bf00"/><path d="M42.385,58.1V74.072l.711.14L44.288,66.3,43.1,58.638Z" transform="translate(-6.777 -52.944)" fill="#b31939"/><path d="M47.4,60.606l-.871.635-3.357-2.549V74.266l4.228.83L48.86,67.3Z" transform="translate(-6.848 -52.998)" fill="#a9bf00"/><path d="M61.4,73.67l.938-6.153L61.4,62.4l-9.88-4.575-3.7,2.7v14.49l3.359.66Z" transform="translate(-7.27 -52.919)" fill="#f4d100"/><path d="M67.091,73.276l1.3-5.167-1.3-4.954-2.141.721-2.2-1.016V74.128Z" transform="translate(-8.628 -53.377)" fill="#6f273f"/><path d="M76.767,71.18l1.4-5.782-1.4-5.637-9.242,3.112V72.994Z" transform="translate(-9.061 -53.095)" fill="#f4d100"/><path d="M84.81,69.709l1.541-4.5L84.81,60.721l-4.968-1.756-2.151.724V71.106Z" transform="translate(-9.985 -53.023)" fill="#b31939"/><path d="M85.522,60.891v8.993l12.989-2.551V65.442Z" transform="translate(-10.697 -53.198)" fill="#50742f"/></g><g transform="translate(7.256 18.467)"><path d="M12.1,38.95A6.69,6.69,0,0,1,7.981,37.7a5.291,5.291,0,0,1,1.233-2.59,5.781,5.781,0,0,0,3.528,1.441c.12,0,.243-.005.366-.016a3.735,3.735,0,0,0-1.37-2.6,7.064,7.064,0,0,1-2.257-4.575,5.9,5.9,0,0,1,.772-1.58,6.771,6.771,0,0,1,2.9-.533,7.806,7.806,0,0,1,3.218.546,7.175,7.175,0,0,1-.939,2.4,4.925,4.925,0,0,0-2.649-.76q-.173,0-.351.013c0,1.13.784,1.962,1.618,2.843a6.181,6.181,0,0,1,2.149,3.92,7.014,7.014,0,0,1-.8,1.96A6.83,6.83,0,0,1,12.1,38.95Z" transform="translate(-7.981 -20.943)" fill="#758592"/><path d="M21.5,38.27c-1.771,0-2.726-1.984-2.726-3.851,0-1.674.772-3.354.772-4.977A3.6,3.6,0,0,0,19.2,27.63a9.561,9.561,0,0,1,3.1-.619,5.814,5.814,0,0,1,.373,2.279c0,1.52-.721,3.183-.721,4.6,0,1.059.3,1.692.807,1.692a5.947,5.947,0,0,0,2.481-.772c.022-.049-.028-.487-.028-1.045,0-1.177.241-2.488.241-3.562a7,7,0,0,0-.554-2.849,9.863,9.863,0,0,1,3.082-.558,6.394,6.394,0,0,1,.575,2.991c0,1.231-.216,2.437-.216,3.784,0,1.392.127,3.213.727,4.068a9.043,9.043,0,0,1-2.643.555c-.189,0-.423-.022-.446-.025a7.918,7.918,0,0,1-.453-1.547C24.881,37.012,23.071,38.27,21.5,38.27ZM19.621,25.721A9.68,9.68,0,0,1,17.943,22.3h0a6.817,6.817,0,0,1,2.091-.917A9.3,9.3,0,0,1,21.5,24.833,3.554,3.554,0,0,1,19.621,25.721Zm2.961-1.157A19.6,19.6,0,0,1,22.1,20.65a5.122,5.122,0,0,1,2.287-.317,12.091,12.091,0,0,1,.312,4,3.757,3.757,0,0,1-2.119.228Z" transform="translate(-8.886 -20.313)" fill="#758592"/>';
    htmlstring += '<path d="M35.385,38.872a20.065,20.065,0,0,1-2.357-.1,7.836,7.836,0,0,1-.562-3.3c0-1.577.2-3.2.2-4.7a6.2,6.2,0,0,0-.583-2.991,17.546,17.546,0,0,1,3.027-.557,5.873,5.873,0,0,1,.4,1.11,7.207,7.207,0,0,1,3-1.112,5.042,5.042,0,0,1,4.223,5.184C42.732,35.532,40.8,38.872,35.385,38.872Zm2.382-9.211a5.091,5.091,0,0,0-2.037.49c-.014.13.022.482.022,1.5,0,.979-.165,2.335-.165,3.177a4.978,4.978,0,0,0,.237,1.734,2.035,2.035,0,0,0,.481.052c1.61,0,3.234-1.154,3.234-3.732,0-1.77-.575-2.823-1.757-3.221Z" transform="translate(-10.171 -20.941)" fill="#758592"/><path d="M49.149,38.976a4.829,4.829,0,0,1-1.792-.323,7.47,7.47,0,0,1-.778-3.679c0-1.085.252-2.43.252-3.444v-.052l-1.511.2a3.2,3.2,0,0,1,.049-2.149l1.4-.239a3.579,3.579,0,0,0-.242-1.495,10.345,10.345,0,0,1,2.9-.541,6.226,6.226,0,0,1,.26,1.517l0,.049,2.834-.512a5,5,0,0,1,.025,2.5l-2.825.35c-.091,1.246-.271,2.264-.271,3.162a5.61,5.61,0,0,0,.305,2.1.913.913,0,0,0,.369.053,7.974,7.974,0,0,0,2.476-.644,4.5,4.5,0,0,1,.306,1.382,5.108,5.108,0,0,1-.054.89A9,9,0,0,1,49.149,38.976Z" transform="translate(-11.36 -20.944)" fill="#758592"/><path d="M56.441,38.59a2.658,2.658,0,0,1-.4-.025,6.663,6.663,0,0,1-.378-2.346c0-1.756.245-2.762.245-4.737a11.9,11.9,0,0,0-.28-2.56,13.624,13.624,0,0,1,3.045-.566,10.272,10.272,0,0,1,.35,2.62c0,1.342-.273,3.3-.273,4.869a9.377,9.377,0,0,0,.3,2.347,9.4,9.4,0,0,1-2.615.4Zm.076-12.042a14.53,14.53,0,0,1-.81-3.5,5.627,5.627,0,0,1,2.794-.579,15.461,15.461,0,0,1,.485,3.547,4.987,4.987,0,0,1-2.438.535Z" transform="translate(-12.312 -20.508)" fill="#758592"/><path d="M71.473,39.086c-2.607-.6-4.754-3.442-5.461-4.378a.144.144,0,0,0-.044,0c-.11,0-.391.031-.724.036a5.113,5.113,0,0,0-.092,1.026,9.871,9.871,0,0,0,.492,2.835,9.909,9.909,0,0,1-2.456.338,3.971,3.971,0,0,1-.5-.025,8.157,8.157,0,0,1-.489-2.821c0-1.976.3-3.116.3-5.455a5.283,5.283,0,0,0-.533-2.613A14.656,14.656,0,0,1,64.83,27.4a12.208,12.208,0,0,1,.371,1.23,7.123,7.123,0,0,1,3.918-1.017,7.632,7.632,0,0,1,1.1.055,4.567,4.567,0,0,1,1.52,3.2c0,1.013-.457,2.39-2.636,3.2l-.059.022.04.049A11.285,11.285,0,0,0,72.9,36.763,5.281,5.281,0,0,1,71.473,39.086ZM66.238,30.2a5.5,5.5,0,0,0-.794.324c-.014.079-.1,2.3-.1,2.362.542-.044,3.255-.3,3.255-2.017a1.426,1.426,0,0,0-.35-.986,6.225,6.225,0,0,0-2.008.318Z" transform="translate(-12.887 -20.957)" fill="#758592"/>';
    htmlstring += '<path d="M79.172,38.936a10.158,10.158,0,0,1-2.053-.2,7.257,7.257,0,0,1-2.251-5.285c0-2.7,1.581-5.862,6.038-5.862a9.4,9.4,0,0,1,2.1.25,9.348,9.348,0,0,1,2.077,5.511C85.084,36.744,82.763,38.936,79.172,38.936Zm.9-9.062c-1.3,0-2.144,1.108-2.144,2.823a6.732,6.732,0,0,0,1.25,3.916,2.732,2.732,0,0,0,.617.063c1.363,0,2.244-1.108,2.244-2.823a6.4,6.4,0,0,0-1.3-3.892,2.553,2.553,0,0,0-.667-.087Z" transform="translate(-14.06 -20.974)" fill="#758592"/>';
    htmlstring += '<path d="M91.29,38.885a6.168,6.168,0,0,1-2.193-.4,8.507,8.507,0,0,1-.954-4.383c0-1.552.327-2.738.327-4A9.169,9.169,0,0,0,88.229,28a9.133,9.133,0,0,1,2.911-.534,5.793,5.793,0,0,1,.388,2.418c0,1.323-.333,3.281-.333,4.148a5.783,5.783,0,0,0,.331,2.255,1.6,1.6,0,0,0,.67.1,8.419,8.419,0,0,0,2.252-.4,5.075,5.075,0,0,1,.318,1.666,4.833,4.833,0,0,1-.05.642A12.058,12.058,0,0,1,91.29,38.885Z" transform="translate(-15.266 -20.963)" fill="#758592"/></g></svg></a>';
    //odh logo
    htmlstring += '<a href="https://opendatahub.com/" target="_blank"><?xml version="1.0" encoding="UTF-8"?><svg id="Ebene_1" class="odh-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28.25 28.21"><defs><style>.cls-1{fill:#12100b;stroke-width:0px;}</style></defs><g id="Livello_3"><path class="cls-1" d="m0,3.73C0,1.78,1.31,0,3.71,0s3.7,1.76,3.7,3.69-1.26,3.76-3.67,3.76c-2.4-.01-3.74-1.78-3.74-3.72m5.81,0c0-1.34-.62-2.5-2.06-2.5S1.63,2.35,1.63,3.69s.66,2.52,2.09,2.52,2.09-1.14,2.09-2.48"/><path class="cls-1" d="m8.76.13h2.36c1.56,0,2.75.72,2.75,2.27s-1.13,2.36-2.92,2.36h-.66v2.56h-1.53s0-7.19,0-7.19Zm2.21,3.47c.96,0,1.37-.39,1.37-1.19,0-.72-.4-1.12-1.34-1.12h-.71v2.31h.68Z"/><polygon class="cls-1" points="15.15 .13 19.3 .13 19.3 1.38 16.65 1.38 16.65 3 18.98 3 18.98 4.19 16.65 4.19 16.65 6.06 19.37 6.06 19.37 7.31 15.15 7.31 15.15 .13"/><path class="cls-1" d="m20.86.13h1.53l2.59,3.72c.43.62.69,1.09.75,1.21h.02c0-.1-.04-.58-.04-1.13V.13h1.38v7.19h-1.39l-2.79-3.99c-.39-.54-.6-.94-.69-1.08h-.02c.01.1.04.51.04.96v4.11h-1.38s0-7.19,0-7.19Z"/><path class="cls-1" d="m.4,9.55h2.17c2.83,0,4.11,1.42,4.11,3.5s-1.31,3.69-4.16,3.69H.4v-7.19Zm2.23,5.97c1.62,0,2.44-.83,2.44-2.43s-.79-2.32-2.49-2.32h-.66v4.75h.71Z"/><path class="cls-1" d="m10.1,9.55h1.47l2.82,7.19h-1.66l-.49-1.35h-2.87l-.48,1.35h-1.53l2.74-7.19Zm1.7,4.62l-.62-1.71c-.23-.62-.32-1.08-.39-1.24h-.02c-.05.17-.17.66-.38,1.24l-.61,1.71h2.02Z"/><polygon class="cls-1" points="17.04 10.8 15.05 10.8 15.05 9.55 20.54 9.55 20.54 10.8 18.57 10.8 18.57 16.74 17.04 16.74 17.04 10.8"/><path class="cls-1" d="m23.96,9.55h1.47l2.82,7.19h-1.66l-.49-1.35h-2.87l-.48,1.35h-1.53l2.74-7.19Zm1.7,4.62l-.62-1.71c-.23-.62-.32-1.08-.39-1.24h-.01c-.05.17-.17.66-.38,1.24l-.61,1.71h2.01Z"/><polygon class="cls-1" points=".4 18.67 1.99 18.67 1.99 22.49 6.68 22.49 6.68 18.67 8.27 18.67 8.27 28.05 6.68 28.05 6.68 23.8 1.99 23.8 1.99 28.05 .4 28.05 .4 18.67"/><path class="cls-1" d="m10.97,24.47v-5.8h1.59v5.65c0,1.75.68,2.57,2.28,2.57s2.2-.96,2.2-2.42v-5.8h1.48v5.67c0,2.43-1.21,3.87-3.72,3.87-2.64,0-3.83-1.4-3.83-3.74"/><path class="cls-1" d="m21.42,18.67h2.83c1.75,0,3.17.61,3.17,2.34,0,1.17-.65,1.84-1.68,2.11v.03c1.14.18,2.07.96,2.07,2.28,0,1.91-1.48,2.62-3.6,2.62h-2.79v-9.38Zm2.64,3.93c1.23,0,1.76-.44,1.76-1.38s-.59-1.3-1.73-1.3h-1.11v2.68s1.08,0,1.08,0Zm.09,4.2c1.36,0,2.04-.42,2.04-1.45s-.55-1.55-1.96-1.55h-1.25v3h1.17Z"/></g></svg></a>';
    htmlstring += '</div>';
    htmlstring += '</div>';
    // ENDMODAL
    return htmlstring;
}

function updateHtml(entities) {

    if(randomArticles){
        shuffleArticles(entities)
    }
    
    var htmlstring = '';


    for (var key in entities) {
        if (!entities.hasOwnProperty(key)) continue;

        var entity = entities[key];
    

        if ((clientFilter.includes(entity.Id) || clientFilter.length == 0) && (!clientIgnore.includes(entity.Id) || clientIgnore.length == 0)) {

            //SLIDE
            cards++;
            if (entity.AdditionalArticleInfos[clientLanguage] != null) {
                htmlstring += '<a target="_blank" href="' + (entity.AdditionalArticleInfos[clientLanguage].Elements.newsUpdatesAndGuidelines) + urlParameters +'">';
            }
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide">';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-container">';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-inner">';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-inner-top">';
            if (entity.ImageGallery != '') {
                htmlstring += '<img class="tns-lazy-img" src="' + entity.ImageGallery[0].ImageUrl + '">';
            }
            htmlstring += '</div>';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-inner-bottom">';
            htmlstring += '<div class="odh-howtoarriveinsouthtyrol-slide-inner-text">' + entity.Detail[clientLanguage].Title + '<div class="odh-howtoarriveinsouthtyrol-slide-inner-date">';
            htmlstring += '</div>';
            htmlstring += '</div>';
            htmlstring += '</div>';
            htmlstring += '</div>';
            htmlstring += '</div>';
            htmlstring += '</div>';
            if (entity.AdditionalArticleInfos[clientLanguage] != null) {
                htmlstring += '</a>';
            }
        }
    }

    return htmlstring;
}

function shuffleArticles(array) {
    var currentIndex = array.length;
  
    while (currentIndex != 0) {
  
      var randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  }

function sortArticles(array,sortOrder) {
    array.sort((a, b) => {
        let indexA = sortOrder.indexOf(a.Id);
        let indexB = sortOrder.indexOf(b.Id);
        if (indexA === -1) indexA = Infinity;
        if (indexB === -1) indexB = Infinity;
        return indexA - indexB;
    });

    return array;
}