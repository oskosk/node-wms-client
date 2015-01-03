var url = "http://geocarto.igac.gov.co/geoservicios/wms",
  wms = require("..")(url);

wms.supportedCrs(function(err, data) {
  if (err) {
    return console.log("error: %j", err);
  }
  console.log(data);

});