var url = "http://geocarto.igac.gov.co/geoservicios/wms",
  wms = require("..")(url);

wms.serviceMetadata(function(err, serviceMetadata) {
  if (err) {
    return console.log("error: %j", err);
  }
  console.log(serviceMetadata);
});