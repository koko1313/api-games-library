// глобални променливи
var currentPage = 1;
const RESULTS_PER_PAGE = 5;
var NUMBER_OF_PAGES = 0;
var resultDesign = 1;

// връща URL-а, нужен ни за търсене в API-то
function getURL() {
    var url = "https://rawg-video-games-database.p.rapidapi.com/games?page=" + currentPage + "&page_size=" + RESULTS_PER_PAGE;
    
    // проверяваме за селектирани жанрове
    var genresCount = 0;
    var genres = $("input[name='genresCheckBoxes']:checked");
    for(var i=0; i<genres.length; i++) {
        var genreValue = $(genres[i]).val();
        if(i == 0) url += "&genres="; // само при първа итерация
        url += genreValue + ",";
        genresCount++;
    }
    if(genresCount > 0) {
        $("#openGenresModalButton").find(".badge").text(genresCount);
    } else {
        $("#openGenresModalButton").find(".badge").text("");
    }

    // проверяваме за селектирани платформи
    var platformsCount = 0;
    var platforms = $("input[name='platformsCheckBoxes']:checked");
    for(var i=0; i<platforms.length; i++) {
        var platformValue = $(platforms[i]).val();
        if(i == 0) url += "&parent_platforms="; // само при първа итерация
        url += platformValue + ",";
        platformsCount++;
    }
    if(platformsCount > 0) {
        $("#openPlatformsModalButton").find(".badge").text(platformsCount);
    } else {
        $("#openPlatformsModalButton").find(".badge").text("");
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

// показва резултатите (извиква се като callback от ajax)
function showResult(resp) {
    // само при зареждането на първата страница (логическо си го правим така)
    if(NUMBER_OF_PAGES == 0) {
        NUMBER_OF_PAGES = Math.ceil(resp.count / RESULTS_PER_PAGE);
    }
    
    $("#currentPage").val(currentPage);

    var games = generateArrayOfGames(resp);

    // показва резултатите, спрямо дизайна, който e избран
    switch(resultDesign) {
        case 1 : showResultDesign1(games); break;
    }

}

// показва резултата по първия дизайн
function showResultDesign1(games) {
    $("#results").html("");

    for(var i=0; i<games.length; i++) {
        var htmlResult = $("#result-template-1").clone();
        htmlResult.attr('id', '');

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
            /*
            switch(game.platforms[j].toLowerCase()) {
                case "pc" : htmlResult.find('.badge-pc').show(); break;
                case "playstation" : htmlResult.find('.badge-ps').show(); break;
                case "xbox" : htmlResult.find('.badge-xbox').show(); break;
                default : 
                    htmlResult.find('.badge-another').html(game.platforms[j]);
                    htmlResult.find('.badge-another').show();
            }
            */
           htmlResult.find('.platforms').text(game.platforms.join(", "));
        }

        htmlResult.show();
        $("#results").append(htmlResult);
    }
}

// next page button
$("#nextPageButton").click(function() {
    if(currentPage+1 > NUMBER_OF_PAGES) return; // подсигуряваме си, че няма да отворим несъществуваща страница

    currentPage++;
    var url = getURL();
    ajax(url, showResult);
});

// previous page button
$("#previousPageButton").click(function() {
    if(currentPage-1 < 1) return; // подсигуряваме си, че няма да отворим несъществуваща страница

    currentPage--;
    var url = getURL();
    ajax(url, showResult);
});

// попълва филтъра с жанровете
function loadGenres() {
    ajax("https://rawg-video-games-database.p.rapidapi.com/genres", function(resp) {
        for(var i=0; i<resp.count; i++) {
            var checkbox = $("#genresCheckboxGroupTemplate").clone();
            checkbox.find("input").val(resp.results[i].id);
            checkbox.find("label").text(resp.results[i].name);
            checkbox.show();
            $("#genresModal").find(".modal-body").append(checkbox);
        }
    });
}

// попълва филтъра с платформите
function loadPlatforms() {
    ajax("https://rawg-video-games-database.p.rapidapi.com/platforms/lists/parents", function(resp) {
        for(var i=0; i<resp.count; i++) {
            var checkbox = $("#platformsCheckboxGroupTemplate").clone();
            checkbox.find("input").val(resp.results[i].id);
            checkbox.find("label").text(resp.results[i].name);
            checkbox.show();
            $("#platformsModal").find(".modal-body").append(checkbox);
        }
    });
}

// попълва всички филтри
function loadFilters() {
    loadGenres();
    loadPlatforms();
}

// търси и показва резултатите
function search() {
    var url = getURL();
    ajax(url, showResult);
}

$(document).ready(function() {
    resultDesign = 1; // тук ще се взима по някакъв начин по кой дизайн да се показват резултатите
    search();

    loadFilters();
});