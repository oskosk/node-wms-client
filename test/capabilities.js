var expect = require( 'chai' ).expect;

var url = 'http://geocarto.igac.gov.co/geoservicios/wms',
	wmsclient = require( '..' );

describe( 'capabilities', function() {
	it( 'should fetch a non-empty json object', function( done ) {
		var wms = wmsclient( url );
		wms.capabilities( function( err, data ) {
			if ( err ) {
				return done( err );
			}
			expect( data ).to.not.be.empty;
			expect( data ).to.be.an( 'object' );
			done();
		} );

	} );
} );
