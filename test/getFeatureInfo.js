var wmsUrl = "http://wms.ign.gob.ar/geoserver/wms",
  wms = require("..")(wmsUrl, {
    version: "1.1.1"
  }),
  fs = require("fs");

var CRS = "EPSG:4326";
var l = "ign2014:salud";

var stream = wms.getFeatureInfo({
  x: 243,
  y: 299
}, {
  layers: l,
  crs: CRS,
  bbox: "-44.570689,-66.719856,-29.537792,-53.331182",
  width: 456,
  height: 512
}, function(err, response) {
  if (err) {
    return console.error(err);
  }
  console.log(response);


});

//stream.pipe(process.stdout);