// A list of local resources we always want to be cached
var CACHE_NAME = 'task-1';

const urlsToCache = [
'/nilamkandalgaonkar.github.io',
'/nilamkandalgaonkar.github.io/',
'/nilamkandalgaonkar.github.io/style.css',
'/nilamkandalgaonkar.github.io/scripts/app.js',
'/nilamkandalgaonkar.github.io/sw.js'
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

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});
var our_db;
openDatabase();
self.addEventListener('activate', function(event) {

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


function handleUrl (newUrl, isCacheResponseSend) {
  event.waitUntil(fetch(newUrl).then(
    function(response) {
      // Check if we received a valid response
      if (response) {
        var responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(function(cache) {
          cache.put(newUrl, responseToCache);
        });
      
        if (isCacheResponseSend) {
          return response;
        }

      }
      // IMPORTANT: Clone the response. A response is a stream
      // and because we want the browser to consume the response
      // as well as the cache consuming the response, we need
      // to clone it so we have two streams.
      
    }
  )
  .catch(err => {  
    saveGetRequests(newUrl);
    console.error("inside 2 the error");
  }));
}

self.addEventListener('fetch', function(event) {
  console.info(event.request);
  var newUrl = event.request.url;
  if (newUrl.indexOf("giphy.gif")> -1) { 
    let queryParam = newUrl.split("?");
      updatedParams = queryParam[1];
      for (let k of Object.entries(serverImageParams)) {
        updatedParams = updatedParams.replace(k[0], k[1]);
      }
      newUrl = queryParam[0] + "?" + updatedParams;
  }
  event.respondWith(
    caches.match(newUrl)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          handleUrl(newUrl, false)
          return response;

        } 
        
      }).catch(err => {
        handleUrl(newUrl, true)
      })
    );
});

var FOLDER_NAME = 'get_request';
function openDatabase () {
  // if `flask-form` does not already exist in our browser (under our site), it is created
  var indexedDBOpenRequest = indexedDB.open('service-worker-data')

  indexedDBOpenRequest.onerror = function (error) {
    // errpr creatimg db
    console.error('IndexedDB error:', error)
  }

  
  indexedDBOpenRequest.onupgradeneeded = function () {
    // This should only execute if there's a need to create/update db.
    this.result.createObjectStore(FOLDER_NAME, { autoIncrement: true, keyPath: 'id' })
  }

  // This will execute each time the database is opened.
  indexedDBOpenRequest.onsuccess = function () {
    our_db = this.result
    console.error('IndexedDB success');
  }
}

function saveGetRequests (url, payload) {
  var request = getObjectStore(FOLDER_NAME, 'readwrite').add({
    url: url,
    payload: payload,
    method: 'GET'
  })
  request.onsuccess = function (event) {
    console.log('a new pos_ request has been added to indexedb')
  }

  request.onerror = function (error) {
    console.error(error)
  }
}

function getObjectStore (storeName, mode) {
  return our_db.transaction(storeName, mode).objectStore(storeName)
}

self.addEventListener('sync', function(event) {
  if (event.tag === 'sendGetRequest' && our_db) {
  event.waitUntil(sendGetRequestToServer());
    // Send our POST request to the server, now that the user is online
  }
});

function sendGetRequestToServer() {
  var savedRequests = []
  var req = getObjectStore(FOLDER_NAME).openCursor() // FOLDERNAME = 'post_requests'

  req.onsuccess = async function (event) {
    var cursor = event.target.result

    if (cursor) {
      // Keep moving the cursor forward and collecting saved requests.
      savedRequests.push(cursor.value)
      cursor.continue()
    } else {
      // At this point, we have collected all the post requests in indexedb.
        for (let savedRequest of savedRequests) {
          // send them to the server one after the other
          console.log('saved request', savedRequest)
          var requestUrl = savedRequest.url
          var payload = JSON.stringify(savedRequest.payload)
          var method = savedRequest.method
          var headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          } // if you have any other headers put them here
          fetch(requestUrl).then(function (response) {
            console.log('server response', response)
            if (response.status < 400) {
              // If sending the POST request was successful, then remove it from the IndexedDB.
              getObjectStore(FOLDER_NAME, 'readwrite').delete(savedRequest.id)
              var responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(requestUrl, responseToCache);
                });
            } 
          }).catch(function (error) {
            // This will be triggered if the network is still down. The request will be replayed again
            // the next time the service worker starts up.
            console.error('Send to Server failed:', error)
            // since we are in a catch, it is important an error is thrown,
            // so the background sync knows to keep retrying sendto server
            throw error
          })
        }
    }
  }
}