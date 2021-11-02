const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;


let db;
const request = indexedDB.open("budget", 1);


request.onupgradeneeded = (event) => {
event.target.result.createObjectStore("pending", {
    keyPath: "id",
    autoIncrement: true
});
};

request.onerror = (err) => {
console.log(err.message);
};

request.onsuccess = (event) => {
db = event.target.result;

if (navigator.onLine) {
    checkDatabase();
}
};

// This function is called in index.js when the user creates a transaction while offline.
function saveRecord(record) {
    const transaction = db.transaction("pending", "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
}


// called when user goes online to send transactions stored in db to server
function checkDatabase() {
    const transaction = db.transaction("pending", "readonly");
    const store = transaction.objectStore("pending");
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
            .then(() => {
                const transaction = db.transaction("pending", "readwrite");
                const store = transaction.objectStore("pending");
                store.clear();
            });
        }
    };
}
    
// listen for app coming back online
window.addEventListener("online", checkDatabase); 