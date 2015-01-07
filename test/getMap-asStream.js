var wmsUrl = "http://geocarto.igac.gov.co/geoservicios/wms",
  wms = require("..")(wmsUrl),
  fs = require("fs");

wms.layers(function(err, layers) {
  var CRS = "EPSG:4686";
  var l = layers[4];
  var writeStream = fs.createWriteStream(__dirname + '/streamed.png');

  var stream = wms.getMap({
    layers: l.Name,
    crs: CRS,
    bbox: {
      minx: 10.8735990610001,
      miny: -74.7945542649999,
      maxx: 10.9022271370001,
      maxy: -74.7692014769999
    },
    width: 1024,
    height: 1024
  });
  stream.pipe(writeStream);
});