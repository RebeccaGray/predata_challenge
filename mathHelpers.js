const numbers = require('numbers');

const _fft = (signal) => {
  if(_power_of_2(signal.length) === false) {
    let add = _nextPow2(signal.length) - signal.length
    for(let i=0;i< add ;i++){
      signal.push(0);
    }
  }
   return numbers.dsp.fft(signal)
};
const _power_of_2 = (n) => {
  if (typeof n !== 'number') return 'Not a number';
  return n && (n & (n - 1)) === 0;
};
const _nextPow2 = ( x )=>{
  return Math.pow(2, Math.ceil(Math.log(x)/Math.log(2)));
}
// const _complexConj = (x)=>{
//   console.log('compconj',x)
//
//   const i = x.toString().indexOf('+')
//   const a = '-';
//   if (i === undefined) {
//      i = x.toString().indexOf('-');
//      a = '+';
//    }
//   x.toString().charAt(i) = a
//   return x
// };

const xcorr = (x,y) => {
  //Corr(x,y) => FFT(x)FFT(y)*
  //http://stackoverflow.com/questions/3949324/calculate-autocorrelation-using-fft-in-matlab/3950552#3950552
  return _fft(x) * _fft(y.reverse())
  //This is where I lost it.. I'm not sure how to multiply the resulting arrays
  //from Fast Fourier Transforms to return a maximum correlation
};

const standardDeviation = (values) => {
    return numbers.statistic.standardDev(values)
    // var avg = average(values);
    // var squareDiffs = values.map((value) => {
    //   var diff = value - avg;
    //   var sqrDiff = diff * diff;
    //   return sqrDiff;
    // });
    // var avgSquareDiff = average(squareDiffs);
    // var stdDev = Math.sqrt(avgSquareDiff);
    // return stdDev;
  }

const average = (data) => {
  //input array data
    var sum = data.reduce((sum, value) => {
      return sum + value;
    }, 0);
    var avg = sum / data.length;
    return avg;
}

// const dotProduct = (A, B) => {
//   //input arrays A,B
//    A.slice(0,B.length).map((el,i)=>el * B[i])
//    A.reduce((a,b)=>a+b)
//    return A;
// }
module.exports = {
  xcorr:xcorr,
//  dotProduct:dotProduct,
  standardDeviation:standardDeviation,
  average:average
}
