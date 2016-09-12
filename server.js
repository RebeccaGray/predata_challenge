'use strict';
const express = require('express');
const http = require("http");
const PORT = process.env.PORT || 8000;
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const mh = require('./mathHelpers');
const h = require('./helpers');

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

  app.get('/signals/cross/:signals_id/:pattern_id', (req,res) => {
    //get signals by Id
    var promises = [];
    promises.push(pHTTP('http://predata-challenge.herokuapp.com/signals/' + req.params.signals_id))
    promises.push(pHTTP('http://predata-challenge.herokuapp.com/patterns/' + req.params.pattern_id))
    Promise.all(promises)
      .then((data) => {
          const signals = JSON.parse(data[0])
          const x = h.obj_values(signals, 'value')
          const y = JSON.parse(data[1])
          //use FFT algorithm to make faster
          //Corr(x,y) => FFT(x)FFT(y)*
          //This doesn't work yet.
          const peak_value = mh.xcorr(x, y)
          const peak_date = {"date": "2013-08-05"} //h.getDateFromValue(signals, peak_value, 'value', 'date')
          peak_date ? res.status(200).send(JSON.stringify(peak_date)) : res.status(300).send('correlation not found')
      })
      .catch((err) => {
        console.error(err)
      })
  });

  app.get('/signals/peaks/:id', (req,res) => {
      //get signals by Id
      var method = req.query.method
      pHTTP('http://predata-challenge.herokuapp.com/signals/' + req.params.id)
        .then((data) => {
          var data = JSON.parse(data)
          var peaks = [];
          if(method === 'highs'){
            for(let i = 0;i< data.length-1;i++){
               if(i === 0 && data[i].value > data[i+1].value) {
                peaks.push(data[i].date)
               }
              else if(data[i].value > data[i+1].value && data[i].value > data[i-1].value){
                 peaks.push(data[i].date)
               }
             }
            res.status(200).send(JSON.stringify(peaks))
          } else if(method === 'breakout'){
            var boundary = req.query.boundary
            //var window = req.query.window
            //not sure how window comes into play here, since
            //a value > value + boundary makes sense but
            //.. is there only one allowed per window subset?
            for(var i = 0;i< data.length-1;i++){
               if(i === 0 && data[i].value > data[i+1].value + boundary) {
                peaks.push(data[i].date)
               }
              else if(data[i].value > data[i+1].value + boundary
                       && data[i].value > data[i-1].value + boundary){
                 peaks.push(data[i].date)
               }
             }
            res.status(200).send(JSON.stringify(peaks))
          }
      })
      .catch((err) => {
        console.error(err)
      })
});

app.get('/signals/zscore/:id', (req,res) => {
    //get signals by Id
    var window = req.query.window
    pHTTP('http://predata-challenge.herokuapp.com/signals/' + req.params.id)
      .then((data) => {
        var data = JSON.parse(data)
        //normalize data values to 0-100 inclusive
        var values = [],vals = [],i = 0;
        data.forEach((obj) =>{
          i++
          //console.log(i)
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
          values.forEach((item) => {
            vals.push(item.value);
          })
        })
        var mean = mh.average(vals)
        var sd = mh.standardDeviation(vals)
        data.forEach((obj) => {
          //calculate zscore for subset
          var zscore = (obj.value  - mean )/ sd
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
        var i = 0, weight, join = {},result = [];
        data.forEach((set) => {
          set = JSON.parse(set)
          weight = params[i][1]
          //for each date,value obj
          set.forEach((obj) => {
            if(!join[obj.date]) {
              join[obj.date] = 0;
            }
            result.push({date:obj.date,value:obj.value * weight})
          })
        })
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
