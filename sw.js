// A list of local resources we always want to be cached
const CACHE_NAME = 'task-1';

const urlsToCache = [
'/',
'/task2',
'/style.css',
'/scripts/app.js',
'/task2/sw.js'
];

const serverImageParams = {
  'interaction': 'event',
  'client': 'customer',
  'os_name': 'operating_system_name', 
  'x1': 'utm_source',
  'x2': 'utm_medium',
  'x3': 'utm_campaign',
  'landing_url': 'campaign_url'
};

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    }));
});
let our_db;
openDatabase();
self.addEventListener('activate', event => {

  const cacheWhitelist = ['task-1'];

  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          return caches.delete(cacheName);
        }
      })
    );
  }));
});


function handleUrl(newUrl, isCacheResponseSend) {
  event.waitUntil(fetch(newUrl).then(
    response => {
      // Check if we received a valid response
      if (response) {
        const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
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

self.addEventListener('fetch', event => {
  console.info(event.request);
  let newUrl = event.request.url;
  if (newUrl.indexOf("giphy.gif")> -1) { 
    const queryParam = newUrl.split("?");
      updatedParams = queryParam[1];
      for (const k of Object.entries(serverImageParams)) {
        updatedParams = updatedParams.replace(k[0], k[1]);
      }
      newUrl = `${queryParam[0]}?${updatedParams}`;
  }
  event.respondWith(caches.match(newUrl)
    .then(response => {
      // Cache hit - return response
      if (response) {
        handleUrl(newUrl, false)
        return response;

      } 
      
    }).catch(err => {
      handleUrl(newUrl, true)
    }));
});

const FOLDER_NAME = 'get_request';
function openDatabase() {
  // if `flask-form` does not already exist in our browser (under our site), it is created
  const indexedDBOpenRequest = indexedDB.open('service-worker-data');

  indexedDBOpenRequest.onerror = function(error) {
    // errpr creatimg db
    console.error('IndexedDB error:', error)
  }

  
  indexedDBOpenRequest.onupgradeneeded = function() {
    // This should only execute if there's a need to create/update db.
    this.result.createObjectStore(FOLDER_NAME, { autoIncrement: true, keyPath: 'id' })
  }

  // This will execute each time the database is opened.
  indexedDBOpenRequest.onsuccess = function() {
    our_db = this.result
    console.error('IndexedDB success');
  }
}

function saveGetRequests(url, payload) {
  const request = getObjectStore(FOLDER_NAME, 'readwrite').add({
    url: url,
    payload: payload,
    method: 'GET'
  });
  request.onsuccess = function(event) {
    console.log('a new pos_ request has been added to indexedb')
  }

  request.onerror = function(error) {
    console.error(error)
  }
}

function getObjectStore(storeName, mode) {
  return our_db.transaction(storeName, mode).objectStore(storeName)
}

self.addEventListener('sync', event => {
  if (event.tag === 'sendGetRequest' && our_db) {
  event.waitUntil(sendGetRequestToServer());
    // Send our POST request to the server, now that the user is online
  }
});

function sendGetRequestToServer() {
  const savedRequests = [];
  const req = getObjectStore(FOLDER_NAME).openCursor(); // FOLDERNAME = 'post_requests'

  req.onsuccess = async function(event) {
    const cursor = event.target.result;

    if (cursor) {
      // Keep moving the cursor forward and collecting saved requests.
      savedRequests.push(cursor.value)
      cursor.continue()
    } else {
      // At this point, we have collected all the post requests in indexedb.
        for (const savedRequest of savedRequests) {
          // send them to the server one after the other
          console.log('saved request', savedRequest)
          const requestUrl = savedRequest.url;
          const payload = JSON.stringify(savedRequest.payload);
          const method = savedRequest.method;
          const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }; // if you have any other headers put them here
          fetch(requestUrl).then(response => {
            console.log('server response', response)
            if (response.status < 400) {
              // If sending the POST request was successful, then remove it from the IndexedDB.
              getObjectStore(FOLDER_NAME, 'readwrite').delete(savedRequest.id)
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(requestUrl, responseToCache);
                });
            } 
          }).catch(error => {
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