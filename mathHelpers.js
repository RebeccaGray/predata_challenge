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
    var sum = data.reduce((sum, value) => {
      return sum + value;
    }, 0);
    var avg = sum / data.length;
    return avg;
}

module.exports = {
  standardDeviation:standardDeviation,
  average:average
}
