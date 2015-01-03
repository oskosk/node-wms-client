var url = "http://geocarto.igac.gov.co/geoservicios/wms",
  wms = require("..")(url);

wms.capabilities(function(err, data) {
  if (err) {
    return console.log("Error: %j", err);
  }
  console.log(data);

});