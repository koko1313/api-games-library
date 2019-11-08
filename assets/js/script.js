// глобални променливи
var currentPage = 1;
const RESULTS_LOAD_AT_A_TIME = 6;
var resultDesign = 1;

var genre = null; // ще ни служи за зареждане по жанр
var platform = null; // ще ни служи за зареждане по платформа
var orderByReleased = false; // ще ни служи за сортиране по дата на публикуване

// връща URL-а, нужен ни за търсене в API-то
function getURL() {
    var url = "https://rawg-video-games-database.p.rapidapi.com/games?page=" + currentPage + "&page_size=" + RESULTS_LOAD_AT_A_TIME;
    
    // ако има избран жанр, търсим за него
    if(genre) {
        url += "&genres=" + genre;
    }

    // ако има избрана платформа
    if(platform) {
        url += "&parent_platforms=" + platform;
    }

    // ако е избрано сортиране
    if(orderByReleased) {
        url += "&ordering=released";
    }

    return url;
}

// прави ajax заявката и се обръща към callback функция
function ajax(url, callback, async = true) {
    $("#loadingBar").show();
    $.ajax({
        type: "GET",
        url: url,
        async: async,
        headers: {
            "x-rapidapi-host": "rawg-video-games-database.p.rapidapi.com",
            "x-rapidapi-key": "c0b2d8dca2msh0671a66d5c7bdf7p112ca6jsnd725d307e9ef"
        },
    }).done(function(resp) {
        $("#loadingBar").hide();
        callback(resp);
    });
}

// връща масив с обекти - игри
function generateArrayOfGames(resp) {
    var gamesArray = [];

    for(var i=0; i<resp.results.length; i++) {
        var currentResult = resp.results[i];
        
        var name = currentResult.name;
        var image = currentResult.background_image;
        var releaseDate = currentResult.released;
        var rating = currentResult.rating + " / " + currentResult.rating_top + " (" + currentResult.ratings_count + " гласа)";
        var platforms = [];
        var genres = [];
        var developers = [];

        // generating list of platforms
        for(var j=0; j<currentResult.platforms.length; j++) {
            platforms.push(currentResult.platforms[j].platform.name);
        }

        ajax("https://rawg-video-games-database.p.rapidapi.com/games/"+currentResult.id, function(resp) {
            // generating list of genres
            for(var i=0; i<resp.genres.length; i++) {
                genres.push(resp.genres[i].name);
            }
            // generating list of developers
            for(var i=0; i<resp.developers.length; i++) {
                developers.push(resp.developers[i].name);
            }
        }, false); // call it async

        var game = {
            "name" : name,
            "image" : image,
            "releaseDate" : releaseDate,
            "rating" : rating,
            "platforms" : platforms,
            "genres" : genres,
            "developers" : developers,
        }

        gamesArray.push(game);
    }

    return gamesArray;
}

// сетва избрания дизайн за показване на резултатите и ги визуализира по него
function setResultDesign(designNumber) {
    resultDesign = designNumber;
    clearResults();
    search();
}

// изчиства всички резултати
function clearResults() {
    $("#results").html("");
}

// показва резултатите (извиква се като callback от ajax)
function showResult(resp) {
    var games = generateArrayOfGames(resp);

    // показва резултатите, спрямо дизайна, който e избран
    switch(resultDesign) {
        case 1 : showResultDesign1(games); break;
        case 2 : showResultDesign2(games); break;
    }

}

// показва резултата по първия дизайн
function showResultDesign1(games) {
    for(var i=0; i<games.length; i++) {
        var htmlResult = $("#result-template-1").clone();
        htmlResult.attr("id", "");

        var game = games[i];

        // заглавие
        htmlResult.find('h3').text(game.name);

        // картинка
        htmlResult.find('img').attr("src", game.image);

        // дата на излизане
        htmlResult.find('.release-date').text(game.releaseDate);

        // рейтинг
        htmlResult.find('.rating').text(game.rating);

        // разработчици
        htmlResult.find('.developers').text(game.developers.join(", "));

        // жанрове
        htmlResult.find('.genres').text(game.genres.join(", "));

        // платформи
        for(var j=0; j<game.platforms.length; j++) {
           htmlResult.find('.platforms').text(game.platforms.join(", "));
        }

        htmlResult.show();
        $("#results").append(htmlResult);
    }
}

// показва резултата по втория дизайн
function showResultDesign2(games) {
    var resultCards = $("#result-template-2").clone();

    for(var i=0; i<games.length; i++) {
        var htmlResult = $("#result-template-2-card").clone();
        $(htmlResult).attr("id", "");
        var game = games[i];

        // заглавие
        htmlResult.find('h3').text(game.name);

        // картинка
        htmlResult.find('img').attr("src", game.image);

        // дата на излизане
        htmlResult.find('.release-date').text(game.releaseDate);

        // рейтинг
        htmlResult.find('.rating').text(game.rating);

        // разработчици
        htmlResult.find('.developers').text(game.developers.join(", "));

        // жанрове
        htmlResult.find('.genres').text(game.genres.join(", "));

        // платформи
        for(var j=0; j<game.platforms.length; j++) {
           htmlResult.find('.platforms').text(game.platforms.join(", "));
        }

        htmlResult.show();
        resultCards.append(htmlResult);
    }

    resultCards.show();
    $("#results").append(resultCards);
}

// търси и показва резултатите
function search(param) {
    if(param) {
        clearResults(); // когато е зададен нов параметър, трием показаните до момента резултати

        if(param.genre) {
            genre = param.genre;
        }

        if(param.platform) {
            platform = param.platform;
        }
    }

    var url = getURL();
    ajax(url, showResult);
}

// селектиране на жанр - извикава се когато се кликне бутона на някой жанр
function selectGenre(htmlItem) {

    // премахваме класът за активен бутон от всички бутони
    var genres = $(htmlItem).parent().children();
    for(var i=0; i<genres.length; i++) {
        genres.removeClass("active");
    }

    $(htmlItem).addClass("active");
    var genreId = htmlItem.dataset.value;

    var genreName = $(htmlItem).text();
    $("#openGenresModalButton").text("Жанр: "+ genreName);
    $("#genresModal").modal('hide');

    // да се покажат всички
    if(genreId == 0) {
        genre = null;
        clearResults();
        search();
        return;
    }

    search({genre: genreId});
}

// селектиране на платформа - извиква се когато се кликне бутона на някоя платформа
function selectPlatform(htmlItem) {

    // премахваме класът за активен бутон от всички бутони
    var platforms = $(htmlItem).parent().children();
    for(var i=0; i<platforms.length; i++) {
        platforms.removeClass("active");
    }

    $(htmlItem).addClass("active");
    var platformId = htmlItem.dataset.value;

    var platformName = $(htmlItem).text();
    $("#openPlatformsModalButton").text("Платформа: "+ platformName);
    $("#platformsModal").modal('hide');

    // да се покажат всички
    if(platformId == 0) {
        platform = null;
        clearResults();
        search();
        return;
    }

    search({platform: platformId});
}

// тригърва сортирането по дата
function trigerOrderByReleased() {
    orderByReleased = !orderByReleased;
    
    clearResults();
    search();

    // променяме иконката на бутона
    if(orderByReleased) {
        $("#trigerOrderByReleasedButton").html('<i class="fas fa-sort-numeric-up"></i>');
    } else {
        $("#trigerOrderByReleasedButton").html('<i class="fas fa-sort-numeric-down-alt"></i>');
    }
}

// попълва филтъра с жанровете
function loadGenres() {
    ajax("https://rawg-video-games-database.p.rapidapi.com/genres", function(resp) {
        for(var i=0; i<resp.count; i++) {
            var genreItem = $("#genreItemTemplate").clone();
            genreItem.removeAttr("id");
            genreItem.attr("data-value", resp.results[i].id);
            genreItem.text(resp.results[i].name);

            genreItem.show();
            $("#genresModal").find(".modal-body").find("ul").append(genreItem);
        }
    });
}

// попълва филтъра с платформите
function loadPlatforms() {
    ajax("https://rawg-video-games-database.p.rapidapi.com/platforms/lists/parents", function(resp) {
        for(var i=0; i<resp.count; i++) {
            var platformItem = $("#platformItemTemplate").clone();
            platformItem.removeAttr("id");
            platformItem.attr("data-value", resp.results[i].id);
            platformItem.text(resp.results[i].name);

            platformItem.show();
            $("#platformsModal").find(".modal-body").find("ul").append(platformItem);
        }
    });
}

// попълва всички филтри
function loadFilters() {
    loadGenres();
    loadPlatforms();
}

var position = $(window).scrollTop(); 
$(window).scroll(function() {

    // зарежда още резултати, когато скролнем до най-долу
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        currentPage++;
        search();
    }

    var scroll = $(window).scrollTop();

    // scroll down
    if(scroll > position) {
        $("#goTopButton").fadeOut();

    // scroll up
    } else {
        $("#goTopButton").slideDown();
    }

    position = scroll;

    // скриваме "go to top" бутона, когато сме най-горе
    if(position == 0) {
        $("#goTopButton").fadeOut();
    }
});

// скролва до началото на страницата
function goToTopOfPage() {
    $("html, body").animate({ scrollTop: 0 }, "medium");
}

$(document).ready(function() {
    search();
    loadFilters();
});