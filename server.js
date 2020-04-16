const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const moment = require('moment')

const authenticationHandler = require('./middleware/authentication')

var appData = []

const app = express()
// Configure bodyParser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// get city by name
const getcityData = (cityname) => {
    let cityInfo
    appData.forEach(element => {
        if (element.city === cityname) {
            cityInfo = element;
        }
    })
    return cityInfo

}

// check if query dates are in city weather date range
const checkWeatherDateAvailability = (weatherData, startDate, endDate) => {
    let availableDates = []
    weatherData.forEach(element => {
        availableDates.push(element.date)
    });
    let datesToGet = getDates(startDate, endDate)
    let isAvailable = true
    datesToGet.forEach(date => {
        if (!availableDates.includes(date)) {
            isAvailable = false
        }

    })
    return isAvailable

}

// const get all dates
const getDates = (startDate, stopDate) => {
    var dateArray = [];
    var currentDate = moment(startDate);
    var stopDate = moment(stopDate);
    while (currentDate <= stopDate) {
        dateArray.push(moment(currentDate).format('YYYY-MM-DD'))
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
}



// function to check if startDate and endDate are in 
// Public End point to register the user 
app.post('/register', (req, res) => {
    const postData = req.body;
    if (!postData.email) {
        return res.status(400).json("Need a valid email to authenticate")
    }
    // token expires in 1 hour
    jwt.sign({ email: postData.email }, "APP_SECRET", { expiresIn: 3600 }, (err, token) => {
        if (err) throw err
        return res.status(200).json({ accessToken: token })
    })
})

app.post('/postCityWeather', authenticationHandler, (req, res) => {
    let { city, weatherData } = req.body;
    city = city.toLowerCase();

    weatherData.forEach(data => {
        var regEx = /^\d{4}-\d{2}-\d{2}$/;
        if (!data.date.match(regEx)) {
            return res.status(400).json("All Dates needs to be in YYYY-MM-DD format")
        }

    });

    var cityData = getcityData(city.toLowerCase())
    if (!cityData) {
        appData.push({ city, weatherData })
    }
    else {
        appData.forEach(cityData => {
            if (cityData.city === city) {
                cityData.weatherData = weatherData;
            }
        })
    }


    return res.status(201).json({ city, weatherData })

})


app.get('/getCityWeather', authenticationHandler, (req, res) => {
    var startDate = req.query.startDate
    var endDate = req.query.endDate;
    var city = req.query.city;

    // check if city exists
    var cityData = getcityData(city.toLowerCase())
    if (!cityData) {
        return res.status(400).json("City Not Found")
    }



    var cityWeatherData = cityData.weatherData

    if (checkWeatherDateAvailability(cityWeatherData, startDate, endDate)) {
        const datesToGetWeather = getDates(startDate, endDate)
        const responseData = []
        cityWeatherData.forEach(element => {
            if (datesToGetWeather.includes(element.date)) {
                responseData.push(element)
            }
        })
        return res.status(200).json({ data: responseData })
    }
    else {
        return res.status(400).json("Data for requested dates is not available")
    }

})

app.delete('/deleteCityWeather', authenticationHandler, (req, res) => {
    var cityname = req.query.city

    var cityData = getcityData(cityname.toLowerCase())
    if (!cityData) {
        return res.status(400).json("City Not Found")
    }

    var filteredArray = appData.filter(function (element) { return element.city !== cityname.toLowerCase() })
    appData = filteredArray


    return res.status(200).json("Deleted Successfully")
})



const port = process.env.PORT || 4586
// Start server
app.listen(port, () => {
    console.log("Server Listening on port " + port)
})