var expect = require( 'chai' ).expect;
var url = 'http://geocarto.igac.gov.co/geoservicios/wms',
	fs = require( 'fs' ),
	wmsclient = require( '..' );

var outputFilename = __dirname + '/stream-piped.png';

describe( 'getMap as stream', function() {
	it( 'should write a file with an image', function( done ) {
		var wms = wmsclient( url );
		wms.layers( function( err, layers ) {
			if ( err ) {
				return done( err );
			}
			var CRS = 'EPSG:4686';
			var l = layers[5];
			var query = {
				layers: l.Name,
				crs: CRS,
				bbox: {
					minx: 10.8735990610001,
					miny: -74.7945542649999,
					maxx: 10.9022271370001,
					maxy: -74.7692014769999
				},
				width: 300,
				height: 300
			};

			var stream = wms.getMap( query );
			var write = fs.createWriteStream( outputFilename );
			stream
				.on( 'end', function() {
					done();
				} )
				.on( 'error', function( err ) {
					done( err );
				} );
			stream.pipe( write );
		} );
	} );
} );

