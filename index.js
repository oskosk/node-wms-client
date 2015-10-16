var request = require("superagent");
var urijs = require("URIjs");
var debug = require("debug")("wms-client");
var extend = require("extend");
var xml2json = require("xml2json");

/**
 * @param {String} baseURL. WMS service base URL. This URL is used in subsequent
 *   calls to wms() methods.
 * @returns {Object} wms object
 */
function wms(baseUrl, requestOptions) {
  if (!(this instanceof wms)) {
    return new wms(baseUrl, requestOptions);
  }
  this.prototype = extend(this, requestOptions);
  this.baseUrl = baseUrl;
}

wms.prototype = {
  baseUrl: "",
  // Default version used in WMS GET requests
  version: "1.3.0",
  // Default resolution for pixel to coordinates calculations.
  resolution: 0.0293611270703125,
  /**
   * @param {Object} [Optional] queryOptions. Options passed as GET parameters
   * @param {Function} callback.
   *   - {Error} null if nothing bad happened
   *   - {Object} WMS Capabilities as Plain Object
   */
  capabilities: function(queryOptions, callback) {
    var url;
    if (typeof queryOptions === "function") {
      callback = queryOptions;
      queryOptions = {};
    }
    url = this.capabilitiesUrl(this.baseUrl, queryOptions);
    debug("Fetching %s", url);
    // Force buffering for handling the
    // case of a content-disposition header present.
    // i.e. like Geoserver for gml info_format
    var stream = request.get(url).type("xml").buffer();
    stream.end(function(err, res) {
      var json;
      if (err) {
        debug("Error getting capabilities: %j", err);
        return callback(err);
      }
      if (!res.text) {
        debug("Got empty response from WMS");
        err = new Error("Empty response for WMS capabilities request");
        return callback(err);
      }
      try {
        json = xml2json.toJson(res.text);
        json = JSON.parse(json);
      } catch (e) {
        return callback(e, json);
      }
      // Remove root property WMS_Capabilities or old WMT_MS_Capabilities
      if (json.WMS_Capabilities) {
        json = json.WMS_Capabilities;
      }
      if (json.WMT_MS_Capabilities) {
        json = json.WMT_MS_Capabilities;
      }
      callback(null, json);
    });
    return stream;
  },
  /**
   * Gets the WMS service layers reported in the capabilities as an array
   *
   * @param {Object} [Optional] queryOptions. Options passed as GET parameters
   * @param {Function} callback.
   *   - {Error} null if nothing bad happened
   *   - {Array} WMS layers as an array Plain Objects
   */
  layers: function(queryOptions, callback) {
    var _this = this;
    if (typeof queryOptions === "function") {
      callback = queryOptions;
      this.capabilities(function(err, capabilities) {
        if (err) {
          debug("Error getting layers for server '%s': %j", _this.baseUrl, err.stack);
          return callback(err);
        }
        try {
          callback(null, capabilities.Capability.Layer.Layer);
        } catch(e) {
          callback(e);
        }
      });
    } else if (typeof callback === "function") {
      this.capabilities(queryOptions, function(err, capabilities) {
        if (err) {
          debug("Error getting layers for server '%s': %j", _this.baseUrl, err.stack);
          return callback(err);
        }
        callback(null, capabilities.Capability.Layer.Layer);
      });
    }
  },
  /**
   * Gets the WMS supported Coordinate reference systems reported in the capabilities as an array
   *
   * @param {Object} [Optional] queryOptions. Options passed as GET parameters
   * @param {Function} callback.
   *   - {Error} null if nothing bad happened
   *   - {Array} CRSs as an array strings
   */
  supportedCrs: function(queryOptions, callback) {
    if (typeof queryOptions === "function") {
      callback = queryOptions;
      this.capabilities(function(err, capabilities) {
        if (err) {
          debug("Error getting layers: %j", err);
          return callback(err);
        }
        if (this.version === "1.3.0") {
          callback(null, capabilities.Capability.Layer.CRS);
        } else {
          callback(null, capabilities.Capability.Layer.SRS);
        }
      });
    } else if (typeof callback === "function") {
      this.capabilities(queryOptions, function(err, capabilities) {
        if (err) {
          debug("Error getting layers: %j", err);
          return callback(err);
        }
        if (this.version === "1.3.0") {
          callback(null, capabilities.Capability.Layer.CRS);
        } else {
          callback(null, capabilities.Capability.Layer.SRS);
        }
      });
    }
  },
  /**
   * Gets the WMS service metadata reported in the capabilities as a plain object
   *
   * @param {Object} [Optional] queryOptions. Options passed as GET parameters
   * @param {Function} callback.
   *   - {Error} null if nothing bad happened
   *   - {Array} WMS Service metadata as a Plain Object
   */
  serviceMetadata: function(queryOptions, callback) {
    if (typeof queryOptions === "function") {
      callback = queryOptions;
      queryOptions = {};
    }
    this.capabilities(queryOptions, function(err, capabilities) {
      if (err) {
        debug("Error getting service metadata: %j", err);
        return callback(err);
      }
      callback(null, capabilities.Service);
    });
  },
  /**
   * Gets an image for a layer from a WMS service
   *
   * @param {Object} [Optional] queryOptions. Options passed as GET parameters
   * @param {Function} callback.
   *   - {Error} null if nothing bad happened
   *   - {Buffer} WMS GetMap response as a buffer. It usually is a PNG/JPEG/GIF image
   * @returns {Stream} you can use it to pipe to a file.
   *   If you pipe the stream, the parameter `callback` will be ignored
   */
  getMap: function(queryOptions, callback) {
    var url = this.getMapUrl(this.baseUrl, queryOptions);
    debug("Fetching %s", url);
    var stream = request.get(url);
    stream.end(function(err, res) {
      if (err) {
        debug("Error requesting getMap to server: %j", err);
        return callback(err);
      }
      if (!res.ok) {
        debug("WMS error response %s", res.text);
        err = new Error(res.text);
        return callback(err);
      }
      // if (res.text) {
      //   var json = xml2json.toJson(res.text);
      //   json = JSON.parse(json);
      //   debug(json);
      // }
      if (typeof callback === "function") {
        callback(err, res.body);
      }
    });
    return stream;
  },
  /**
   * Gets an image for a layer from a WMS service
   *
   * @param {Object} [Optional] queryOptions. Options passed as GET parameters
   * @param {Function} callback.
   *   - {Error} null if nothing bad happened
   *   - {Buffer} WMS GetMap response as a buffer. It usually is a PNG/JPEG/GIF image
   * @returns {Stream} you can use it to pipe to a file.
   *   If you pipe the stream, the parameter `callback` will be ignored
   */
  getFeatureInfo: function(xy, queryOptions, callback) {
    queryOptions = extend({
      query_layers: queryOptions.layers,
      info_format: "application/vnd.ogc.gml"
    }, queryOptions);
    queryOptions.request = "GetFeatureInfo";
    if (this.version === "1.3.0") {
      queryOptions.i = xy.x;
      queryOptions.j = xy.y;
    } else {
      queryOptions = extend(queryOptions, xy);
    }
    var url = this.getMapUrl(this.baseUrl, queryOptions);
    debug("Fetching %s", url);
    // Force buffering for handling the
    // case of a content-disposition header present.
    // i.e. like Geoserver for gml info_format
    var stream = request.get(url).buffer();
    stream.end(function(err, res) {
      if (err) {
        debug("Error requesting getFeatureInfo to server: %j", err);
        return callback(err);
      }
      if (!res.ok) {
        debug("WMS error response %s", res.text);
        err = new Error(res.text);
        return callback(err);
      }
      // if (res.text) {
      //   var json = xml2json.toJson(res.text);
      //   json = JSON.parse(json);
      //   debug(json);
      // }
      if (res.headers['content-disposition'] === 'inline; filename=geoserver-GetFeatureInfo.application') {
        debug("Geoserver content-disposition header present");
      }
      if (typeof callback === "function") {
        var json;
        try {
          json = xml2json.toJson(res.text);
          json = JSON.parse(json);
        } catch (e) {
          return callback(e, json);
        }
        return callback(null, json);
      }
    });
    return stream;
  },
  getInfo: function(layers, latlng, options, callback) {
    options = extend({
      crs: "EPSG:4326"
    }, options);
    var buffer = 128;
    var resolution = 0.0293611270703125;
    var minx = latlng.lng - (buffer * resolution);
    var miny = latlng.lat - (buffer * resolution);
    var width = buffer * 2;
    var maxx = latlng.lng + (buffer * resolution);
    var maxy = latlng.lat + (buffer * resolution);
    var height = buffer * 2;
    var stream = this.getFeatureInfo({
      x: buffer,
      y: buffer
    }, {
      layers: layers,
      crs: options.crs,
      bbox: {
        minx: minx,
        miny: miny,
        maxx: maxx,
        maxy: maxy
      },
      width: width,
      height: height
    }, function(err, response) {
      if (err) {
        return console.error(err);
      }
      console.log(response);
      callback(null, response);

    });
    return stream;
  },
  /**
   * @param {String} WMS opeation (GetMap, GetCapabilities, etc)
   * @param {Object} WMS request parameters
   * @param {Function} callback
   *   - {Error} null if nothing bad happened
   *   - {json|Bufer} response from the server
   *
   */
  wmsrequest: function(operation, parameters, callback) {
    parameters.request = operation;
    request.get(this.baseUrl).end(function(err, res) {
      if (err) {
        debug("Error requesting %s to WMS service: %j", operation, err);
        return callback(err);
      }
      // superagent set res.error for 4xx and 5xx HTTP errors
      if (res.error) {
        debug("HTTP error response %s", res.error.message);
        err = new Error(res.error.message);
        return callback(err);
      }
      if (typeof callback === "function") {
        callback(err, res.text);
      }
    });
    return request;
  },
  /**
   * Formats an URL to include specific GET parameters
   * required for a GETCAPABILITIES WMS method request
   */
  capabilitiesUrl: function(wmsBaseUrl, queryOptions) {
    queryOptions = extend({
      request: "GetCapabilities",
      version: this.version,
      service: "WMS"
    }, queryOptions);
    // Append user provided GET parameters in the URL to required queryOptions
    var urlQueryParams = new urijs(wmsBaseUrl).search(true);
    queryOptions = extend(queryOptions, urlQueryParams);
    // Merge queryOptions GET parameters to the URL
    var url = new urijs(wmsBaseUrl).search(queryOptions);
    debug("Using capabilities URL: %s", url);
    return url.toString();
  },
  /**
   * Formats an URL to include specific GET parameters
   * required for a GetMap WMS method request
   * @param {String} mwsBaseUrl. URL of the WMS Service endpoint
   * @param {Object} QueryOptions
   *   - {String} layers. comma separated Layers names
   *   - {String|Object} bbox. Bounding box as string (commas eparated values)
   *                           or as an objext with keys minx,miny,maxx,maxy
   *
   */
  getMapUrl: function(wmsBaseUrl, queryOptions) {
    var bbox = queryOptions.bbox;
    if (typeof bbox !== "string") {
      bbox = this.extentToBbox(bbox.minx,
        bbox.miny,
        bbox.maxx,
        bbox.maxy);
      delete queryOptions.bbox;
    }
    queryOptions = extend({
      request: "GetMap",
      version: this.version,
      service: "wms",
      format: "image/png",
      styles: "",
      width: "256",
      height: "256",
      bbox: bbox
    }, queryOptions);
    var url = new urijs(wmsBaseUrl).addQuery(queryOptions);
    return url.toString();
  },
  /**
   * Returns a bbox WMS string.
   * @param {Float} minx left  bound of the bounding box in CRS units
   * @param {Float} miny lower bound of the bounding box in CRUS units
   * @param {Float} maxx right bound of the bounding box in CRUS units
   * @param {Float} maxy upper bound of the bounding box in CRUS units
   */
  extentToBbox: function(minx, miny, maxx, maxy) {
    var bbox = "";
    if (this.version === "1.3.0") {
      bbox = [minx, miny, maxx, maxy].join(",");
    } else {
      bbox = [miny, minx, maxy, maxx].join(",");
    }
    return bbox;
  }
};

module.exports = wms;
