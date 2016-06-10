var expect = require( 'chai' ).expect;

var url = 'http://wms.ign.gob.ar/geoserver/wms',
	wmsclient = require( '..' );

var CRS = 'EPSG:4326';
var l = 'ign2014:salud';

describe( 'getFeatureInfo', function() {
	it( 'should return a non-empty json object', function( done ) {
		var wms = wmsclient( url, {
			versino: '1.1.1'
		} );

		wms.getFeatureInfo( {
			x: 243,
			y: 299
		}, {
			layers: l,
			crs: CRS,
			bbox: '-44.570689,-66.719856,-29.537792,-53.331182',
			width: 456,
			height: 512
		}, function( err, response ) {
			if ( err ) {
				return done( err );
			}
			expect( response ).to.be.not.empty;
			done();
		} );
	} );
} );
