'use strict';
const express = require('express');
const http = require("http");
const PORT = process.env.PORT || 8000;
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json())
const mh = require('./mathHelpers')

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});

const pHTTP = (url) =>
  new Promise((resolve, reject) => {
    http.get(url, (val) => {
      var data = "";
      val.on('data', (chunk) => data += chunk);
      val.on('end', () => resolve(data));
    }).on('error', reject);
  });


app.get('/signals/zscore/:id', (req,res) => {
    //get signals by Id
    var window = req.query.window
    pHTTP('http://predata-challenge.herokuapp.com/signals/' + req.params.id)
      .then((data) => {
        var data = JSON.parse(data)
        //normalize data values to 0-100 inclusive
        var values = [];
        var i = 0
        data.forEach((obj) =>{
          i++
          console.log(i)
          //get time of this object for comparisson
          var thisTime = new Date(obj.date)
          thisTime = thisTime.getTime() / 100000;

          //filter data set by thisTime - window
          var values = data.filter((sub) => {
            var subTime = new Date(sub.date)
            subTime = subTime.getTime() / 100000;
            return subTime >= thisTime - window;
          })
          //push values for subset into an array
          var vals = []
          values.forEach((item) => {
            vals.push(item.value);
          })
          //calculate zscore for subset
          var mean = mh.average(vals)
          var sd = mh.standardDeviation(vals)
          var zscore = obj.value  - mean / sd
          obj.value = zscore;
        })
        res.status(200).send(JSON.stringify(data))
      })
      .catch((err) => {
        console.error(err)
      })
})

app.get('/signals/combine', (req,res) => {
  //assuming that data sets are sorted and correlate by date.
    var query = req.query
    //get signals by Id
    var promises = [], params = [];
    query.signal.forEach((tuple) => {
      tuple = tuple.split(',')
      params.push(tuple)
      promises.push(pHTTP('http://predata-challenge.herokuapp.com/signals/' + tuple[0]))
    })
    Promise.all(promises)
      .then((data) => {
        //for each id data set
        var i = 0, weight, join = {};
        data.forEach((set) => {
          set = JSON.parse(set)
          weight = params[i][1]
          //for each date,value obj
          set.forEach((obj) => {
            if(!join[obj.date]) {
              join[obj.date] = 0;
            }
            join[obj.date] += obj.value * weight
          })
        })
        var result = []
        result.push(join)
        res.status(200).send(JSON.stringify(result))
      })
      .catch((err) => {
        console.error(err)
      })
})


app.get('/signals/norms/:id', (req,res) => {
    //get signals by Id
    pHTTP('http://predata-challenge.herokuapp.com/signals/' + req.params.id)
      .then((data) => {
        var data = JSON.parse(data)
        //normalize data values to 0-100 inclusive
        var numbers = [];
        data.forEach((obj) =>{
          numbers.push(obj.value)
        })
        var ratio = Math.max(...numbers) / 100;
        numbers = numbers.map(v => Math.round(v / ratio))
        data.forEach((obj) =>{
          obj.value = numbers.shift()
        })
        res.status(200).send(JSON.stringify(data))
      })
      .catch((err) => {
        console.error(err)
      })
})
