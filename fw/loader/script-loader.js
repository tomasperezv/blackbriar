var ScriptLoader = {
	/**
	 * @author tom@0x101.com
	 * @return void
	 */
	getHttpRequest: function() {
		if ( window.XMLHttpRequest ) {
			return new XMLHttpRequest() ;
		} else if ( window.ActiveXObject ) {
			return new ActiveXObject("MsXml2.XmlHttp") ;
		}
	},
	
	/**
	 * Create dynamically a new script element in the DOM and insert the content
	 * passed as param. 
	 *
	 * @author tom@0x101.com
	 * @param String sid
	 * @param String source - code source to load
	 * @return void
	 */
	injectJS: function(scriptId, source) {
		if ( ( source != null ) && ( !document.getElementById( scriptId ) ) ) {
			var oHead = document.getElementsByTagName('HEAD').item(0);
			var oScript = document.createElement( "script" );
			oScript.language = "javascript";
			oScript.type = "text/javascript";
			oScript.id = scriptId;
			oScript.text = source;
			oHead.appendChild( oScript );
		}
	},
	
	/**
	 * Load dynamically a js file and insert it into the page.
	 *
	 * @author tom@0x101.com
	 * @param String scriptId
	 * @param String url
	 * @return void
	 */
	load: function(scriptId, url)
	{
		var oXmlHttp = this.getHttpRequest() ;
		var that = this;
		oXmlHttp.onreadystatechange = function() {
			if ( oXmlHttp.readyState == 4 ) {
				that.injectJS( scriptId, oXmlHttp.responseText );
			}
		}
		oXmlHttp.open('GET', url, true);
		oXmlHttp.send(null);
	}
};

