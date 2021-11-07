let db;
let budgetVersion;

// Open the database
const request = indexedDB.open("budget", 1);

// Create an objectStore for this database
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore("pending", {
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
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite"); // ==> Object { stores inside }
    
    // access your pending object store
    const store = transaction.objectStore("pending");
    
    // add record to your store with add method.
    store.add(record);
}

// called when user goes online to send transactions stored in db to server
function checkDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(["pending"], "readwrite");

    // access your pending object store
    const store = transaction.objectStore("pending");

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
            .then(() => {
                // if successful, open a transaction on your pending db
                const transaction = db.transaction(["pending"], "readwrite");
                
                // access your pending object store
                const store = transaction.objectStore("pending");

                // clear all items in your store
                store.clear();
            });
        }
    };
}
    
// listen for app coming back online
window.addEventListener("online", checkDatabase); 