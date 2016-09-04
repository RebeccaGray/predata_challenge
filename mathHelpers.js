const standardDeviation = (values) => {
    var avg = average(values);
    var squareDiffs = values.map((value) => {
      var diff = value - avg;
      var sqrDiff = diff * diff;
      return sqrDiff;
    });
    var avgSquareDiff = average(squareDiffs);
    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
  }

const average = (data) => {
  //input array data
    var sum = data.reduce((sum, value) => {
      return sum + value;
    }, 0);
    var avg = sum / data.length;
    return avg;
}

const dotProduct = (A, B) => {
  //input arrays A,B
   A.slice(0,B.length).map((el,i)=>el * B[i])
   A.reduce((a,b)=>a+b)
   return A;
}
module.exports = {
  dotProduct:dotProduct,
  standardDeviation:standardDeviation,
  average:average
}
