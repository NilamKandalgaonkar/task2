//register service worker

if ('serviceWorker' in navigator) {
 window.addEventListener('load', function() {
    navigator.serviceWorker.register('js/serviceWorker/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function _getUrl(event){
    var path = 'images/'
    var imageName = "pixel.png";
    var url = path + imageName + "?";
    var imageParams = {
        "name": "pixel.png",
        "params": {
            "interaction": event.type,
            "client": "ad_media",
            "os_name": _getOsName(),
            "x1": "google",
            "x2": "email",
            "x3": "pdfconvert",
            "landing_url": "abcd1"
        }
    }

    let keys = Object.keys(imageParams.params)

    keys.map((elem, index) => 
        url  += index === keys.length - 1 ? `${elem}=${imageParams.params[elem]}`:`${elem}=${imageParams.params[elem]}&`
    )

    return url;
}

function _getOsName() {  
    var osName="Unknown OS";

    if (navigator.appVersion.indexOf("Win")!=-1) osName="Windows"; 
    else if (navigator.appVersion.indexOf("Mac")!=-1) osName="MacOS"; 
    else if (navigator.appVersion.indexOf("X11")!=-1) osName="UNIX"; 
    else if (navigator.appVersion.indexOf("Linux")!=-1) osName="Linux";
      
    return osName;
}

function loadImage(event) {
  fetch(_getUrl(event))
  .then(validateResponse)
  .then(readResponseAsBlob)
  .then(displayImage)
  .catch(logError);
}

function displayImage(responseAsBlob) {
    var container = document.getElementById('container');
    var imgElem = document.createElement('img');
    container.appendChild(imgElem);
    var imgUrl = URL.createObjectURL(responseAsBlob);
    imgElem.src = imgUrl;
}

function readResponseAsBlob(response) {
  return response.blob();
}

function logError(error) {
    console.log('something went wrong: \n', error);
}

function validateResponse(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
}