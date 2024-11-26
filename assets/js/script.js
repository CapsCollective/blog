function openEmail() {
	let email = 'capscollective.com';
	email = ('devs' + '@' + email);
	window.location.href = 'mailto:' + email;
}

function httpGetAsJsonAsync(url, callback) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() { 
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			var responseJson = JSON.parse(xmlHttp.responseText);
			if (typeof(responseJson) == 'undefined') {
				return;
	        }
			callback(responseJson);
		}
	}
	xmlHttp.open("GET", url, true);
	xmlHttp.send(null);
}