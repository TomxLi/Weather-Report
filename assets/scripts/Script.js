const uvLow = 3;
const uvModerate = 6;
const uvHigh = 8;
const uvVeryhigh = 10;
const APIKey="0b272b429a3ea8b8aca72e75cef0d9fd";
const searchInput = $("#searchInput");
const searchButton = $("#searchBtn");
const clearButton = $("#clearBtn");
const currentCity = $("#currentCity");
const currentTemperature = $("#temperature");
const currentHumidty= $("#humidity");
const currentWSpeed=$("#windSpeed");
const currentUvindex= $("#uvIndex");
var sCity=[];
var city="";

function getWeather(event){
    event.preventDefault();
    if(searchInput.val().trim()!==""){
        city=searchInput.val().trim();
        currentWeather(city);
    }
}

//Use Open Weather API & parse the response to display various weather data
function currentWeather(city){
    var queryURL= "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&APPID=" + APIKey;
    $.ajax({
        url:queryURL,
        method:"GET",
    }).then(function(response){
        var weathericon= response.weather[0].icon;
        var iconurl="https://openweathermap.org/img/wn/"+weathericon +"@2x.png";
        var date=new Date(response.dt*1000).toLocaleDateString();
        $(currentCity).html(response.name +"("+date+")" + "<img src="+iconurl+">");
        //Convert Celsius to Fahrenheit
        var tempF = (response.main.temp - 273.15) * 1.80 + 32;
        $(currentTemperature).html((tempF).toFixed(2)+"&#8457");
        $(currentHumidty).html(response.main.humidity+"%");
        var ws=response.wind.speed;
        //convert MPS to MPH
        var windsmph=(ws*2.237).toFixed(1);
        $(currentWSpeed).html(windsmph+"MPH");
        //Extract Geographic coordinates and use as a parameter to build UV function.
        getUVIndex(response.coord.lon,response.coord.lat);
        //Extract city ID and use as a parameter to build forecasting function.
        getForecast(response.id);
        //if search is valid, start to build search history
        if(response.cod==200){
            sCity=JSON.parse(localStorage.getItem("cityname"));
            if (sCity==null){
                sCity=[];
                sCity.push(city.toUpperCase());
                localStorage.setItem("cityname",JSON.stringify(sCity));
                addToList(city);
            }
            else {
                var cityUppercase = city.toUpperCase();
                if(!sCity.includes(cityUppercase)){
                    sCity.push(cityUppercase);
                    localStorage.setItem("cityname",JSON.stringify(sCity));
                    addToList(city);
                }
            }
        }
    });
}

function addToList(c){
    var listEl= $("<li>"+c.toUpperCase()+"</li>");
    $(listEl).attr("class","list-group-item");
    $(listEl).attr("data-value",c.toUpperCase());
    $(".list-group").append(listEl);
}

//UVIndex.
function getUVIndex(ln,lt){
    var uvqURL="https://api.openweathermap.org/data/2.5/uvi?appid="+ APIKey+"&lat="+lt+"&lon="+ln;
    $.ajax({
        url:uvqURL,
        method:"GET"
        }).then(function(response){
            $(currentUvindex).html(response.value);
            //Extract UV Index value and use as a parameter to build UVcolor.
            getUVcolor(response.value);
        });
}

function getUVcolor(value){
    if (value < uvLow) {
        $(currentUvindex).css("background-color", "green");
    } else if (value < uvModerate) {
        $(currentUvindex).css("background-color", "yellow");
    } else if (value < uvHigh) {
        $(currentUvindex).css("background-color", "orange");
    } else if (value < uvVeryhigh) {
        $(currentUvindex).css("background-color", "red");
    } else {
        $(currentUvindex).css("background-color", "violet");
    }
}

//Forecast future 5day value
function getForecast(cityid){
    var dayover = false;
    var queryforcastURL="https://api.openweathermap.org/data/2.5/forecast?id="+cityid+"&appid="+APIKey;
    $.ajax({
        url:queryforcastURL,
        method:"GET"
    }).then(function(response){
        for (i=0;i<5;i++){
            //future weather data has 3hour gap, use [(i+1)*8)-1] to pull data in every 24hours
            var date= new Date((response.list[((i+1)*8)-1].dt)*1000).toLocaleDateString();
            var iconcode= response.list[((i+1)*8)-1].weather[0].icon;
            var iconurl="https://openweathermap.org/img/wn/"+iconcode+".png";
            var tempK= response.list[((i+1)*8)-1].main.temp;
            var tempF=(((tempK-273.5)*1.80)+32).toFixed(2);
            var humidity= response.list[((i+1)*8)-1].main.humidity;
        
            $("#fDate"+i).html(date);
            $("#fImg"+i).html("<img src="+iconurl+">");
            $("#fTemp"+i).html(tempF+"&#8457");
            $("#fHumidity"+i).html(humidity+"%");
        }
    });
}

// display weather info when search history is clicked
function historyClick(event){
    var liEl=event.target;
    if (event.target.matches("li")){
        city=liEl.textContent.trim();
        currentWeather(city);
    }
}

//load last city info when page reopened
function lastCity(){
    $("ul").empty();
    var sCity = JSON.parse(localStorage.getItem("cityname"));
    if(sCity!==null){
        sCity=JSON.parse(localStorage.getItem("cityname"));
        for(i=0; i<sCity.length;i++){
            addToList(sCity[i]);
        }
        city=sCity[i-1];
        currentWeather(city);
    }

}
//Clear button
function clearHistory(event){
    event.preventDefault();
    sCity=[];
    localStorage.removeItem("cityname");
    document.location.reload();

}
//event listener
$("#searchBtn").on("click",getWeather);
$("#clearBtn").on("click",clearHistory);
$("#searchInput").keypress(function (e) {
    if (e.which == 13) {
      $("#searchBtn").click();
      return false;  
    }
});
$(document).on("click",historyClick);
$(window).on("load",lastCity);