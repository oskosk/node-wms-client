var url = "http://geocarto.igac.gov.co/geoservicios/wms",
  wms = require("..")(url);

wms.layers(function(err, data) {
  if (err) {
    return console.log("error: %j", err);
  }
  console.log(data);

});