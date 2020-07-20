var CACHE_NAME = 'task-1';

// A list of local resources we want to be cached
var urlsToCache = [
  '/task2',
  '/task2'/,
  '/task2/styles/style.css',
  '/task2/images/pixel.png',
  '/task2/js/app.js',
  '/task2/js/serviceWorker/sw.js'
];                  

var serverImageParams = {
  'interaction': 'event',
  'client': 'customer',
  'os_name': 'operating_system_name', 
  'x1': 'utm_source',
  'x2': 'utm_medium',
  'x3': 'utm_campaign',
  'landing_url': 'campaign_url'
};

this.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

this.addEventListener('fetch', function(event) {
  console.info("fetch request ---->"+event.request);
  event.respondWith(function () {
    if (event.request.url.indexOf("pixel.gif")) { 
      let queryParam = url.split("?");
        updatedParams = queryParam[1];
        for (let k of Object.entries(interceptObj)) {
          updatedParams = updatedParams.replace(k[0], k[1]);
        }
        const newUrl = queryParam[0] + "?" + updatedParams;
        e.request.url = newUrl;
    }
    fetch(e.request)
      .then(response => {

        return response;
      })
      .catch(err => {         
        debugger
        console.log("hey something is wrong")
       });
      }
    );
});

this.addEventListener('activate', function(event) {

  var cacheWhitelist = ['task-1'];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
