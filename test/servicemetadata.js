var expect = require( 'chai' ).expect;

var url = 'http://geocarto.igac.gov.co/geoservicios/wms',
	wmsclient = require( '..' );

describe( 'serviceMetadata', function() {
	it( 'should fetch a non-empty json object', function( done ) {
		var wms = wmsclient( url );
		wms.serviceMetadata( function( err, serviceMetadata ) {
			if ( err ) {
				return done( err );
			}
			expect( serviceMetadata ).to.not.be.empty;
			done();
		} );
	} );
} );

