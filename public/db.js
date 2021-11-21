window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"};
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}

// Open/Create Database
let db;
const request = indexedDB.open("budget", 1);
console.log("budget");
request.onsuccess = function(event) {
    console.log('success');
    db = event.target.result;
    if (navigator.onLine) {
        console.log('Backend online.');
        checkDatabase();
    }
};

// Create an objectStore for this database
request.onupgradeneeded = function (event) {
    console.log('Upgrade needed in IndexDB');
    db = event.target.result;
    if (db.objectStoreNames.length === 0) {
        db.createObjectStore("transactions", {
        autoIncrement: true
    });
};
}

request.onerror = (err) => {
    console.log(err.message);
};



// This function is called in index.js when the user creates a transaction while offline.
const saveRecord = (record) => {
    console.log("save record invoked");
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["transactions"], "readwrite"); // ==> Object { stores inside }
    
    // access your pending object store
    const store = transaction.objectStore("transactions");
    
    // add record to your store with add method.
    store.add(record);
};

// called when user goes online to send transactions stored in db to server
function checkDatabase() {
    console.log('checkDatabase function called');
    // open a transaction on your pending db
    let transaction = db.transaction(["transactions"], "readwrite");

    // access your pending object store
    const store = transaction.objectStore("transactions");

    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then((response) => response.json())
            .then((response) => {
                // if successful, open a transaction on your pending db
                if (response.length !== 0) {
                    transaction = db.transaction(["transactions"], "readwrite");
                }
                // access your pending object store
                const store = transaction.objectStore("transactions");

                // clear all items in your store
                store.clear();
                console.log("clearing store");
            });
        }
    };
}

request.onsuccess = function (e) {
    console.log('success');
    db = e.target.result;
  
    if (navigator.onLine) {
      console.log('Backend online! 🗄️');
      checkDatabase();
    }
  };

// listen for app coming back online
window.addEventListener("online", checkDatabase);