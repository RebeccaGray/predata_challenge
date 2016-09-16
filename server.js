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
      let data = "";
      val.on('data', (chunk) => data += chunk);
      val.on('end', () => resolve(data));
    }).on('error', reject);
  });

app.get('/signals/cross/:signals_id/:pattern_id', (req, res) => {
  //get signals by Id
  let promises = [];
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
      const peak_date = h.getDateFromValue(signals, peak_value, 'value', 'date')
      peak_date ? res.status(200).send(JSON.stringify(peak_date)) : res.status(300).send('correlation not found')
    })
    .catch((err) => {
      console.error(err)
    })
});

app.get('/signals/peaks/:id', (req, res) => {
  //get signals by Id
  let method = req.query.method
  pHTTP('http://predata-challenge.herokuapp.com/signals/' + req.params.id)
    .then((data) => {
      data = JSON.parse(data)
      let peaks = [];
      if (method === 'highs') {
        let high = 0;
        //higher than any previous value
        data.forEach((obj) => {
          if (obj.value > high){
             high = obj.value;
             peaks.push(obj.date)
          }
        })
        peaks.sort((a, b) => {
          return new Date(a).getTime() - new Date(b).getTime()
        });
        res.status(200).send(JSON.stringify(peaks))
      } else if (method === 'breakout') {
        let boundary = req.query.boundary
        let window = req.query.window
        //collect trailing window points
        data.forEach((obj) => {
          let t = new Date(obj.date)
          let windowt = new Date(obj.date)
          windowt.setDate(windowt.getDate() - window)
          windowt = windowt.getTime();
          t = t.getTime()
          //filter data set to window
          let trailingPoints = data.filter((x) => {
            let s = new Date(x.date).getTime();
            return s >= windowt && s <= t;
          })
          //what is boundary sigma?
          trailingPoints.forEach((point) => {
            if(obj.value > point.value + boundary) peaks.push(point.date);
          })
        })
        peaks.sort((a, b) => {
          return new Date(a).getTime() - new Date(b).getTime()
        });
        res.status(200).send(JSON.stringify(peaks))
      }
    })
    .catch((err) => {
      console.error(err)
    })
});

app.get('/signals/zscore/:id', (req,res) => {
    //get signals by Id
    let window = req.query.window
    let result = [];
    pHTTP('http://predata-challenge.herokuapp.com/signals/' + req.params.id)
      .then((data) => {
        data = JSON.parse(data)
        data.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        });
        //normalize data values to 0-100 inclusive
        let values = [],vals = [],i=0;
        let crop = new Date("2005-02-14").getTime()
        data.forEach((obj) =>{
          //get time of this object for comparisson
          let t = new Date(obj.date).getTime()
          let windowt = new Date(obj.date)
          windowt.setDate(windowt.getDate() - window)
          windowt = windowt.getTime();

          //filter data set by t - window to t
          let values = data.filter((x) => {
            let s = new Date(x.date).getTime();
            if(s >= windowt && s <= t) vals.push(x.value)
            return s >= windowt && s <= t;
          })
          if(t >= crop){
            let mean = mh.mean(vals)
            let sd = mh.standardDeviation(vals)
            let zscore = (obj.value  - mean )/ sd
            result.push({date:obj.date,value:zscore})
          } else {i++}

          if (result.length === data.length - i) {
            result.sort((a, b) => {
              return new Date(a.date).getTime() - new Date(b.date).getTime()
            });
             res.status(200).send(JSON.stringify(result))
           }
        })
      })
      .catch((err) => {
        console.error(err)
      })
})

app.get('/signals/combine', (req, res) => {
  //assuming that data sets are sorted and correlate by date.
  let query = req.query
    //get signals by Id
  let promises = [],
    params = [];
  query.signal.forEach((tuple) => {
    tuple = tuple.split(',')
    params.push(tuple)
    promises.push(pHTTP('http://predata-challenge.herokuapp.com/signals/' + tuple[0]))
  })
  Promise.all(promises)
    .then((data) => {
      //for each id data set
      let i = 0,
        weight, join = {},
        result = [];
      data.forEach((set) => {
        set = JSON.parse(set)
        let weight = params[i][1]
          //for each date,value obj
        set.forEach((obj) => {
          if (!join[obj.date]) {
            join[obj.date] = weight * obj.value;
          } else {
            let val = join[obj.date] + (obj.value * weight)
            result.push({
              date: obj.date,
              value: val
            })
          }
        })
      })
      result.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      });
      res.status(200).send(JSON.stringify(result))
    })
    .catch((err) => {
      console.error(err)
    })
})


app.get('/signals/norm/:id', (req, res) => {
  //get signals by Id
  pHTTP('http://predata-challenge.herokuapp.com/signals/' + req.params.id)
    .then((data) => {
      data = JSON.parse(data)
        //normalize data values to 0-100 inclusive
      let numbers = [];
      data.forEach((obj) => {
        numbers.push(obj.value)
      })

      let max = Math.max(...numbers)
      let min = Math.min(...numbers)
      numbers = numbers.map(v => ((100 * (v - min) / max - min) + 0))
        // let ratio = Math.max(...numbers) / 100;
        // numbers = numbers.map(v => (v / ratio))
      data.forEach((obj) => {
        obj.value = numbers.shift()
      })
      data.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      });
      data.reverse()
      res.status(200).send(JSON.stringify(data))
    })
    .catch((err) => {
      console.error(err)
    })
})
