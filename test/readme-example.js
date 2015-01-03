var url = "http://geocarto.igac.gov.co/geoservicios/wms",
  wmsclient = require(".."),
  wms = wmsclient(url);

wms.capabilities(function(err, capabilities) {
  if (err) return console.log(err);
  console.log(capabilities.WMS_Capabilities.Service.Title)
});