const obj_values = (arr, key)=> {
  //takes array of objects and returns array of values from key of each object
   const res = []
   for(let i = 0; i<arr.length;i++){
     res.push(arr[i][key])
   }
   return res;
}
const getDateFromValue = (arr, value, key, result_key) => {
  //takes array of objects and returns result_key for value of key
  const res = false;
  for(let i = 0;i<arr.length;i++){
    if(arr[i][key] === value) res = arr[i][result_key]
  }
  return res
}

module.exports = {
  getDateFromValue:getDateFromValue,
  obj_values:obj_values
}
