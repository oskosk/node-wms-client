var expect = require( 'chai' ).expect;

var url = 'http://geocarto.igac.gov.co/geoservicios/wms',
	wmsclient = require( '..' );

describe( 'README.md example snippet', function() {
	var wms = wmsclient( url );
	it( 'should work', function( done ) {
		wms.capabilities( function( err, capabilities ) {
			expect( capabilities.service.title ).to.not.be.empty;
			expect( capabilities.service.title ).to.be.an( 'string' );
			done( err );
		} );
	} );
} )

