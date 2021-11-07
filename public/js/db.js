let db;
let budgetVersion;

// Open the database
const request = indexedDB.open("budget", budgetVersion || 30);

// Create an objectStore for this database
request.onupgradeneeded = (event) => {
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

request.onsuccess = (event) => {
    console.log('success');
    db = event.target.result;
    if (navigator.onLine) {
        console.log('Backend online.');
        checkDatabase();
    }
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
}

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

// listen for app coming back online
window.addEventListener("online", checkDatabase);