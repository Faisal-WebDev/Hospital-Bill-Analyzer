/* =========================================================
   HOSPITAL BILL ANALYZER
   Complete JavaScript
   HTML + CSS + JavaScript only
========================================================= */

/* =========================================================
   1. STORAGE
========================================================= */

const STORAGE_KEY = "hospitalBillAnalyzer_bills";

function getBills() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        console.error("Could not read saved bills:", error);
        return [];
    }
}

function saveBills(bills) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
}

/* =========================================================
   2. CURRENT BILL
========================================================= */

let currentBillId = null;

let currentBill = {
    id: null,

    patientName: "",
    hospitalName: "",
    billNumber: "",
    billDate: "",

    items: [],

    createdAt: "",
    updatedAt: "",
};

/* =========================================================
   3. DOM ELEMENTS
========================================================= */

/* ---------- Bill Information ---------- */

const billInfoForm = document.getElementById("billInfoForm");

const patientNameInput = document.getElementById("patientName");

const hospitalNameInput = document.getElementById("hospitalName");

const billNumberInput = document.getElementById("billNumber");

const billDateInput = document.getElementById("billDate");

/* ---------- Item Form ---------- */

const itemForm = document.getElementById("itemForm");

const itemDescriptionInput = document.getElementById("itemDescription");

const itemCategoryInput = document.getElementById("itemCategory");

const itemQuantityInput = document.getElementById("itemQuantity");

const itemPriceInput = document.getElementById("itemPrice");

const itemLiveTotal = document.getElementById("itemLiveTotal");

/* ---------- Items ---------- */

const itemsTableBody = document.getElementById("itemsTableBody");

const itemsEmpty = document.getElementById("itemsEmpty");

const itemCountText = document.getElementById("itemCountText");

const tableTotal = document.getElementById("tableTotal");

/* ---------- Dashboard ---------- */

const dashboardTotal = document.getElementById("dashboardTotal");

const dashboardItems = document.getElementById("dashboardItems");

const dashboardFlags = document.getElementById("dashboardFlags");

const dashboardHighest = document.getElementById("dashboardHighest");

const dashboardHighestName = document.getElementById("dashboardHighestName");

/* ---------- Chart ---------- */

const donutProgress = document.getElementById("donutProgress");

const donutTotal = document.getElementById("donutTotal");

const chartLegend = document.getElementById("chartLegend");

/* ---------- Highest Items ---------- */

const highestItems = document.getElementById("highestItems");

/* ---------- Analysis ---------- */

const analysisList = document.getElementById("analysisList");

const normalCount = document.getElementById("normalCount");

const warningCount = document.getElementById("warningCount");

const criticalCount = document.getElementById("criticalCount");

/* ---------- Report ---------- */

const reportHospital = document.getElementById("reportHospital");

const reportPatient = document.getElementById("reportPatient");

const reportBillNumber = document.getElementById("reportBillNumber");

const reportDate = document.getElementById("reportDate");

const reportTableBody = document.getElementById("reportTableBody");

const reportEmpty = document.getElementById("reportEmpty");

const reportTotal = document.getElementById("reportTotal");

/* ---------- History ---------- */

const historyList = document.getElementById("historyList");

/* ---------- Buttons ---------- */

const newBillBtn = document.getElementById("newBillBtn");

const clearItemsBtn = document.getElementById("clearItemsBtn");

const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const csvBtn = document.getElementById("csvBtn");

const printBtn = document.getElementById("printBtn");

/* ---------- Status ---------- */

const billStatus = document.getElementById("billStatus");

const statusDot = document.querySelector(".status-dot");

/* ---------- Toast ---------- */

const toast = document.getElementById("toast");

/* =========================================================
   4. BASIC HELPER FUNCTIONS
========================================================= */

function formatMoney(amount) {
    const number = Number(amount) || 0;

    return (
        "Rs. " +
        number.toLocaleString("en-PK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function getToday() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) {
        return "—";
    }

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showToast(message) {
    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);
}

function getCurrentBillTotal() {
    return currentBill.items.reduce(function (total, item) {
        return total + Number(item.total || 0);
    }, 0);
}

/* =========================================================
   5. CREATE NEW BILL
========================================================= */
function createNewBill() {
    const id = Date.now();
    const now = new Date().toISOString();

    currentBillId = id;

    currentBill = {
        id: id,

        patientName: "",
        hospitalName: "",
        billNumber: "",
        billDate: getToday(),

        items: [],

        createdAt: now,
        updatedAt: now,
    };

    // Don't save it to history yet.
    // It will be saved when the user clicks
    // "Save Bill Info".

    loadCurrentBillIntoForm();

    updateEverything();

    showToast("New bill started.");
}
/* =========================================================
   6. SAVE CURRENT BILL
========================================================= */

function saveCurrentBill() {
    if (!currentBillId) {
        showToast("Please start a new bill first.");

        return;
    }

    currentBill.updatedAt = new Date().toISOString();

    const bills = getBills();

    const existingIndex = bills.findIndex(function (bill) {
        return bill.id === currentBillId;
    });

    if (existingIndex === -1) {
        /*
            This is the first time this bill
            is being saved.

            Add it to history.
        */

        bills.unshift({
            ...currentBill,
        });
    } else {
        /*
            IMPORTANT:

            The bill already exists.

            Replace that SAME bill instead
            of creating a new one.
        */

        bills[existingIndex] = {
            ...currentBill,
        };
    }

    saveBills(bills);

    renderHistory();

    updateBillStatus();
}
/* =========================================================
   7. LOAD BILL
========================================================= */

function loadBill(id) {
    const bills = getBills();

    const bill = bills.find(function (item) {
        return item.id === id;
    });

    if (!bill) {
        showToast("Could not find that bill.");

        return;
    }

    currentBillId = bill.id;

    currentBill = {
        ...bill,

        items: (bill.items || []).map(function (item) {
            return {
                ...item,
            };
        }),
    };

    loadCurrentBillIntoForm();

    updateEverything();

    const billSection = document.getElementById("bill-info");

    if (billSection) {
        billSection.scrollIntoView({
            behavior: "smooth",
        });
    }

    showToast("Bill loaded. You can edit it.");
}

/* =========================================================
   8. LOAD BILL DATA INTO INPUTS
========================================================= */

function loadCurrentBillIntoForm() {
    if (patientNameInput) {
        patientNameInput.value = currentBill.patientName || "";
    }

    if (hospitalNameInput) {
        hospitalNameInput.value = currentBill.hospitalName || "";
    }

    if (billNumberInput) {
        billNumberInput.value = currentBill.billNumber || "";
    }

    if (billDateInput) {
        billDateInput.value = currentBill.billDate || "";
    }
}

/* =========================================================
   9. DELETE BILL
========================================================= */

function deleteBill(id) {
    const confirmed = confirm("Are you sure you want to delete this bill?");

    if (!confirmed) {
        return;
    }

    let bills = getBills();

    bills = bills.filter(function (bill) {
        return bill.id !== id;
    });

    saveBills(bills);

    if (currentBillId === id) {
        currentBillId = null;

        currentBill = {
            id: null,

            patientName: "",

            hospitalName: "",

            billNumber: "",

            billDate: getToday(),

            items: [],

            createdAt: "",

            updatedAt: "",
        };

        loadCurrentBillIntoForm();
    }

    updateEverything();

    showToast("Bill deleted.");
}

/* =========================================================
   10. BILL INFORMATION FORM
========================================================= */

if (billInfoForm) {
    billInfoForm.addEventListener("submit", function (event) {
        event.preventDefault();

        /*
                If there is no active bill,
                the user hasn't clicked
                "New Bill" yet.
            */

        if (!currentBillId) {
            showToast("Click 'New Bill' first.");

            return;
        }

        /*
                Update the CURRENT bill.
            */

        currentBill.patientName = patientNameInput.value.trim();

        currentBill.hospitalName = hospitalNameInput.value.trim();

        currentBill.billNumber = billNumberInput.value.trim();

        currentBill.billDate = billDateInput.value;

        /*
                This will either:

                1. Add the bill to history
                   if it's new

                OR

                2. Update the existing bill
                   if it's already there.
            */

        saveCurrentBill();

        updateEverything();

        showToast("Bill information saved.");
    });
}
/* =========================================================
   11. ITEM LIVE TOTAL
========================================================= */

function updateItemLiveTotal() {
    if (!itemQuantityInput || !itemPriceInput || !itemLiveTotal) {
        return;
    }

    const quantity = Number(itemQuantityInput.value) || 0;

    const price = Number(itemPriceInput.value) || 0;

    itemLiveTotal.textContent = formatMoney(quantity * price);
}

if (itemQuantityInput) {
    itemQuantityInput.addEventListener("input", updateItemLiveTotal);
}

if (itemPriceInput) {
    itemPriceInput.addEventListener("input", updateItemLiveTotal);
}

/* =========================================================
   12. ADD ITEM
========================================================= */

if (itemForm) {
    itemForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const description = itemDescriptionInput.value.trim();

        const category = itemCategoryInput.value;

        const quantity = Number(itemQuantityInput.value);

        const price = Number(itemPriceInput.value);

        /* ---------- Validation ---------- */

        if (!description) {
            showToast("Enter an item description.");

            itemDescriptionInput.focus();

            return;
        }

        if (!category) {
            showToast("Select an item category.");

            itemCategoryInput.focus();

            return;
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            showToast("Quantity must be greater than 0.");

            itemQuantityInput.focus();

            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            showToast("Enter a valid price.");

            itemPriceInput.focus();

            return;
        }

        /*
                Make sure there is an active bill.
            */

        if (!currentBillId) {
            showToast("Click 'New Bill' first.");

            return;
        }

        const item = {
            id: Date.now(),

            description: description,

            category: category,

            quantity: quantity,

            price: price,

            total: quantity * price,
        };

        currentBill.items.push(item);

        /*
                Save immediately.
            */

        saveCurrentBill();

        /*
                Reset item form.
            */

        itemForm.reset();

        if (itemQuantityInput) {
            itemQuantityInput.value = 1;
        }

        updateItemLiveTotal();

        updateEverything();

        showToast("Item added.");
    });
}

/* =========================================================
   13. DELETE ITEM
========================================================= */

if (itemsTableBody) {
    itemsTableBody.addEventListener("click", function (event) {
        const button = event.target.closest(".delete-item");

        if (!button) {
            return;
        }

        const index = Number(button.dataset.index);

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= currentBill.items.length
        ) {
            return;
        }

        const removedItem = currentBill.items[index];

        currentBill.items.splice(index, 1);

        saveCurrentBill();

        updateEverything();

        showToast(`"${removedItem.description}" removed.`);
    });
}

/* =========================================================
   14. CLEAR ITEMS
========================================================= */

if (clearItemsBtn) {
    clearItemsBtn.addEventListener("click", function () {
        if (currentBill.items.length === 0) {
            showToast("There are no items to clear.");

            return;
        }

        const confirmed = confirm("Clear all items from this bill?");

        if (!confirmed) {
            return;
        }

        currentBill.items = [];

        saveCurrentBill();

        updateEverything();

        showToast("All items cleared.");
    });
}

/* =========================================================
   15. NEW BILL BUTTON
========================================================= */

if (newBillBtn) {
    newBillBtn.addEventListener("click", function () {
        const hasCurrentData =
            currentBill.patientName ||
            currentBill.hospitalName ||
            currentBill.billNumber ||
            currentBill.items.length > 0;

        if (hasCurrentData) {
            const confirmed = confirm(
                "Start a new bill? Your current bill is already saved in history.",
            );

            if (!confirmed) {
                return;
            }
        }

        createNewBill();

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    });
}

/* =========================================================
   16. RENDER ITEMS TABLE
========================================================= */

function renderItems() {
    if (!itemsTableBody) {
        return;
    }

    itemsTableBody.innerHTML = "";

    if (currentBill.items.length === 0) {
        if (itemsEmpty) {
            itemsEmpty.style.display = "flex";
        }

        if (itemCountText) {
            itemCountText.textContent = "No items added.";
        }

        if (tableTotal) {
            tableTotal.textContent = formatMoney(0);
        }

        return;
    }

    if (itemsEmpty) {
        itemsEmpty.style.display = "none";
    }

    if (itemCountText) {
        itemCountText.textContent =
            currentBill.items.length +
            (currentBill.items.length === 1 ? " item" : " items") +
            " added.";
    }

    currentBill.items.forEach(function (item, index) {
        const row = document.createElement("tr");

        const status = getItemStatus(item, index);

        let statusText = "Normal";

        if (status === "warning") {
            statusText = "Review";
        }

        if (status === "critical") {
            statusText = "Important";
        }

        row.innerHTML = `

                <td>
                    ${escapeHTML(item.description)}
                </td>

                <td>
                    ${escapeHTML(item.category)}
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    ${formatMoney(item.price)}
                </td>

                <td>
                    <strong>
                        ${formatMoney(item.total)}
                    </strong>
                </td>

                <td>

                    <span
                        class="review-badge ${status}"
                    >
                        ${statusText}
                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="delete-item"
                        data-index="${index}"
                    >
                        ×
                    </button>

                </td>

            `;

        itemsTableBody.appendChild(row);
    });

    if (tableTotal) {
        tableTotal.textContent = formatMoney(getCurrentBillTotal());
    }
}

/* =========================================================
   17. BILL ANALYSIS
========================================================= */

function analyzeItem(item, index) {
    const issues = [];

    /* -----------------------------------------
       CHECK 1 — Invalid price
    ----------------------------------------- */

    if (item.price <= 0) {
        issues.push({
            type: "critical",

            title: "Invalid price",

            message: "This item has a zero or invalid unit price.",
        });
    }

    /* -----------------------------------------
       CHECK 2 — Possible duplicate
    ----------------------------------------- */

    const duplicate = currentBill.items.some(function (other, otherIndex) {
        if (otherIndex === index) {
            return false;
        }

        const sameDescription =
            other.description.trim().toLowerCase() ===
            item.description.trim().toLowerCase();

        const sameCategory = other.category === item.category;

        const samePrice = Number(other.price) === Number(item.price);

        return sameDescription && sameCategory && samePrice;
    });

    if (duplicate) {
        issues.push({
            type: "warning",

            title: "Possible duplicate",

            message:
                "A similar item with the same category and price appears elsewhere in this bill.",
        });
    }

    /* -----------------------------------------
       CHECK 3 — High quantity
    ----------------------------------------- */

    if (item.quantity >= 10) {
        issues.push({
            type: "warning",

            title: "High quantity",

            message:
                "This item has a quantity of " +
                item.quantity +
                ". Verify that the quantity matches the original bill.",
        });
    }

    /* -----------------------------------------
       CHECK 4 — Unusually high price
    ----------------------------------------- */

    if (currentBill.items.length >= 3) {
        const prices = currentBill.items
            .map(function (entry) {
                return Number(entry.price);
            })
            .filter(function (price) {
                return price > 0;
            });

        if (prices.length >= 3) {
            const average =
                prices.reduce(function (sum, price) {
                    return sum + price;
                }, 0) / prices.length;

            if (item.price >= average * 3) {
                issues.push({
                    type: "warning",

                    title: "Unusually high price",

                    message:
                        "This unit price is significantly higher than the average unit price of the other items.",
                });
            }
        }
    }

    /* -----------------------------------------
       CHECK 5 — Large portion of bill
    ----------------------------------------- */

    const total = getCurrentBillTotal();

    if (total > 0 && item.total / total >= 0.5) {
        issues.push({
            type: "warning",

            title: "Large share of bill",

            message:
                "This item represents 50% or more of the current bill total.",
        });
    }

    return issues;
}

/* =========================================================
   18. ITEM STATUS
========================================================= */

function getItemStatus(item, index) {
    const issues = analyzeItem(item, index);

    const hasCritical = issues.some(function (issue) {
        return issue.type === "critical";
    });

    if (hasCritical) {
        return "critical";
    }

    if (issues.length > 0) {
        return "warning";
    }

    return "normal";
}

/* =========================================================
   19. RENDER ANALYSIS
========================================================= */

function renderAnalysis() {
    if (!analysisList) {
        return;
    }

    analysisList.innerHTML = "";

    if (currentBill.items.length === 0) {
        if (normalCount) {
            normalCount.textContent = "0";
        }

        if (warningCount) {
            warningCount.textContent = "0";
        }

        if (criticalCount) {
            criticalCount.textContent = "0";
        }

        analysisList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <h4>
                    Nothing to analyze yet
                </h4>

                <p>
                    Add bill items and the analyzer
                    will check for possible unusual
                    patterns.
                </p>

            </div>

        `;

        return;
    }

    let normal = 0;

    let warnings = 0;

    let critical = 0;

    currentBill.items.forEach(function (item, index) {
        const issues = analyzeItem(item, index);

        if (issues.length === 0) {
            normal++;

            return;
        }

        issues.forEach(function (issue) {
            if (issue.type === "warning") {
                warnings++;
            }

            if (issue.type === "critical") {
                critical++;
            }

            const div = document.createElement("div");

            div.className = "analysis-item " + issue.type;

            div.innerHTML = `

                        <div class="analysis-icon">

                            ${issue.type === "critical" ? "!" : "?"}

                        </div>

                        <div class="analysis-content">

                            <strong>

                                ${escapeHTML(issue.title)}

                                —

                                ${escapeHTML(item.description)}

                            </strong>

                            <p>

                                ${escapeHTML(issue.message)}

                            </p>

                        </div>

                        <div class="analysis-price">

                            ${formatMoney(item.total)}

                        </div>

                    `;

            analysisList.appendChild(div);
        });
    });

    if (normalCount) {
        normalCount.textContent = normal;
    }

    if (warningCount) {
        warningCount.textContent = warnings;
    }

    if (criticalCount) {
        criticalCount.textContent = critical;
    }

    if (warnings === 0 && critical === 0) {
        analysisList.innerHTML = `

            <div class="analysis-item normal">

                <div class="analysis-icon">
                    ✓
                </div>

                <div class="analysis-content">

                    <strong>
                        No unusual patterns detected
                    </strong>

                    <p>
                        The current items passed
                        the basic billing checks.
                        This does not confirm that
                        the bill is correct.
                    </p>

                </div>

                <div class="analysis-price">

                    ${currentBill.items.length}
                    items

                </div>

            </div>

        `;
    }
}

/* =========================================================
   20. DASHBOARD
========================================================= */

function renderDashboard() {
    const total = getCurrentBillTotal();

    let flags = 0;

    currentBill.items.forEach(function (item, index) {
        if (getItemStatus(item, index) !== "normal") {
            flags++;
        }
    });

    if (dashboardTotal) {
        dashboardTotal.textContent = formatMoney(total);
    }

    if (dashboardItems) {
        dashboardItems.textContent = currentBill.items.length;
    }

    if (dashboardFlags) {
        dashboardFlags.textContent = flags;
    }

    if (currentBill.items.length === 0) {
        if (dashboardHighest) {
            dashboardHighest.textContent = formatMoney(0);
        }

        if (dashboardHighestName) {
            dashboardHighestName.textContent = "No items yet";
        }
    } else {
        const sorted = [...currentBill.items].sort(function (a, b) {
            return b.total - a.total;
        });

        if (dashboardHighest) {
            dashboardHighest.textContent = formatMoney(sorted[0].total);
        }

        if (dashboardHighestName) {
            dashboardHighestName.textContent = sorted[0].description;
        }
    }

    if (donutTotal) {
        donutTotal.textContent =
            total > 0
                ? "Rs. " + Math.round(total).toLocaleString("en-PK")
                : "Rs. 0";
    }

    renderDonut();

    renderHighestItems();
}

/* =========================================================
   21. DONUT CHART
========================================================= */

function renderDonut() {
    if (!donutProgress || !chartLegend) {
        return;
    }

    chartLegend.innerHTML = "";

    const total = getCurrentBillTotal();

    const radius = 45;

    const circumference = 2 * Math.PI * radius;

    donutProgress.style.strokeDasharray = circumference;

    donutProgress.style.strokeDashoffset = circumference;

    if (total === 0) {
        chartLegend.innerHTML = `

            <div class="empty-mini">

                Add bill items to see
                the price breakdown.

            </div>

        `;

        return;
    }

    const categories = {};

    currentBill.items.forEach(function (item) {
        if (!categories[item.category]) {
            categories[item.category] = 0;
        }

        categories[item.category] += item.total;
    });

    const sorted = Object.entries(categories)
        .sort(function (a, b) {
            return b[1] - a[1];
        })
        .slice(0, 5);

    const largest = sorted[0][1];

    const percentage = largest / total;

    donutProgress.style.strokeDashoffset = circumference * (1 - percentage);

    sorted.forEach(function (entry) {
        const category = entry[0];

        const amount = entry[1];

        const percentage = ((amount / total) * 100).toFixed(1);

        const div = document.createElement("div");

        div.className = "legend-item";

        div.innerHTML = `

                <span class="legend-name">

                    <span
                        class="legend-marker"
                    ></span>

                    ${escapeHTML(category)}

                </span>

                <span class="legend-value">

                    ${percentage}%

                </span>

            `;

        chartLegend.appendChild(div);
    });
}

/* =========================================================
   22. HIGHEST PRICED ITEMS
========================================================= */

function renderHighestItems() {
    if (!highestItems) {
        return;
    }

    highestItems.innerHTML = "";

    if (currentBill.items.length === 0) {
        highestItems.innerHTML = `

            <div class="empty-state small">

                <div class="empty-icon">
                    ₨
                </div>

                <h4>
                    No items yet
                </h4>

                <p>
                    Highest priced items
                    will appear here.
                </p>

            </div>

        `;

        return;
    }

    const sorted = [...currentBill.items]
        .sort(function (a, b) {
            return b.total - a.total;
        })
        .slice(0, 5);

    sorted.forEach(function (item, index) {
        const div = document.createElement("div");

        div.className = "highest-item";

        div.innerHTML = `

                <span class="rank">

                    ${String(index + 1).padStart(2, "0")}

                </span>

                <div class="highest-info">

                    <strong>

                        ${escapeHTML(item.description)}

                    </strong>

                    <span>

                        ${escapeHTML(item.category)}

                    </span>

                </div>

                <strong class="highest-price">

                    ${formatMoney(item.total)}

                </strong>

            `;

        highestItems.appendChild(div);
    });
}

/* =========================================================
   23. REPORT
========================================================= */

function renderReport() {
    if (reportHospital) {
        reportHospital.textContent =
            currentBill.hospitalName || "Hospital / Clinic";
    }

    if (reportPatient) {
        reportPatient.textContent =
            currentBill.patientName || "Patient / Customer";
    }

    if (reportBillNumber) {
        reportBillNumber.textContent = currentBill.billNumber || "—";
    }

    if (reportDate) {
        reportDate.textContent = formatDate(currentBill.billDate);
    }

    if (!reportTableBody) {
        return;
    }

    reportTableBody.innerHTML = "";

    if (currentBill.items.length === 0) {
        if (reportEmpty) {
            reportEmpty.style.display = "flex";
        }

        if (reportTotal) {
            reportTotal.textContent = formatMoney(0);
        }

        return;
    }

    if (reportEmpty) {
        reportEmpty.style.display = "none";
    }

    currentBill.items.forEach(function (item, index) {
        const row = document.createElement("tr");

        row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(item.description)}
                </td>

                <td>
                    ${escapeHTML(item.category)}
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    ${formatMoney(item.price)}
                </td>

                <td>
                    <strong>
                        ${formatMoney(item.total)}
                    </strong>
                </td>

            `;

        reportTableBody.appendChild(row);
    });

    if (reportTotal) {
        reportTotal.textContent = formatMoney(getCurrentBillTotal());
    }
}

/* =========================================================
   24. BILL HISTORY
========================================================= */

function renderHistory() {
    if (!historyList) {
        return;
    }

    const bills = getBills();

    historyList.innerHTML = "";

    if (bills.length === 0) {
        historyList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ◷
                </div>

                <h4>
                    No saved bills
                </h4>

                <p>
                    Bills you create will
                    automatically appear here.
                </p>

            </div>

        `;

        return;
    }

    bills.forEach(function (bill) {
        const historyItem = document.createElement("div");

        historyItem.className = "history-item";

        if (bill.id === currentBillId) {
            historyItem.classList.add("current-bill");
        }

        const hospital = bill.hospitalName || "Unnamed hospital";

        const patient = bill.patientName || "No patient name";

        const billNumber = bill.billNumber || "No bill number";

        const itemCount = bill.items?.length || 0;

        historyItem.innerHTML = `

                <div class="history-main">

                    <strong>

                        ${escapeHTML(hospital)}

                    </strong>

                    <span>

                        ${escapeHTML(billNumber)}

                    </span>

                </div>


                <div class="history-data">

                    <span>
                        Patient
                    </span>

                    <strong>

                        ${escapeHTML(patient)}

                    </strong>

                </div>


                <div class="history-data">

                    <span>
                        Items
                    </span>

                    <strong>
                        ${itemCount}
                    </strong>

                </div>


                <div class="history-data">

                    <span>
                        Total
                    </span>

                    <strong>

                        ${formatMoney(
                            bill.items?.reduce(function (total, item) {
                                return total + Number(item.total || 0);
                            }, 0) || 0,
                        )}

                    </strong>

                </div>


                <div class="history-actions">

                    <button
                        type="button"
                        class="history-load"
                        data-id="${bill.id}"
                    >

                        ${bill.id === currentBillId ? "Editing" : "Open / Edit"}

                    </button>


                    <button
                        type="button"
                        class="text-btn danger-text history-delete"
                        data-id="${bill.id}"
                    >

                        Delete

                    </button>

                </div>

            `;

        historyList.appendChild(historyItem);
    });
}

/* =========================================================
   25. HISTORY BUTTONS
========================================================= */

if (historyList) {
    historyList.addEventListener("click", function (event) {
        const openButton = event.target.closest(".history-load");

        const deleteButton = event.target.closest(".history-delete");

        if (openButton) {
            const id = Number(openButton.dataset.id);

            loadBill(id);

            return;
        }

        if (deleteButton) {
            const id = Number(deleteButton.dataset.id);

            deleteBill(id);
        }
    });
}

/* =========================================================
   26. CLEAR BILL HISTORY
========================================================= */

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", function () {
        const bills = getBills();

        if (bills.length === 0) {
            showToast("History is already empty.");

            return;
        }

        const confirmed = confirm(
            "Delete ALL saved bills? This cannot be undone.",
        );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem(STORAGE_KEY);

        currentBillId = null;

        currentBill = {
            id: null,

            patientName: "",

            hospitalName: "",

            billNumber: "",

            billDate: getToday(),

            items: [],

            createdAt: "",

            updatedAt: "",
        };

        loadCurrentBillIntoForm();

        updateEverything();

        showToast("Bill history cleared.");
    });
}

/* =========================================================
   27. CSV EXPORT
========================================================= */

function csvEscape(value) {
    const string = String(value ?? "");

    if (string.includes(",") || string.includes('"') || string.includes("\n")) {
        return '"' + string.replace(/"/g, '""') + '"';
    }

    return string;
}

if (csvBtn) {
    csvBtn.addEventListener("click", function () {
        if (currentBill.items.length === 0) {
            showToast("Add items before exporting.");

            return;
        }

        const rows = [];

        /*
                Bill information
            */

        rows.push(["Hospital / Clinic", currentBill.hospitalName]);

        rows.push(["Patient Name", currentBill.patientName]);

        rows.push(["Bill Number", currentBill.billNumber]);

        rows.push(["Bill Date", currentBill.billDate]);

        rows.push([]);

        /*
                Table headings
            */

        rows.push([
            "Description",
            "Category",
            "Quantity",
            "Unit Price",
            "Total",
        ]);

        /*
                Items
            */

        currentBill.items.forEach(function (item) {
            rows.push([
                item.description,

                item.category,

                item.quantity,

                item.price.toFixed(2),

                item.total.toFixed(2),
            ]);
        });

        rows.push([]);

        rows.push(["Bill Total", "", "", "", getCurrentBillTotal().toFixed(2)]);

        const csv = rows
            .map(function (row) {
                return row.map(csvEscape).join(",");
            })
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        const filename = currentBill.billNumber
            ? currentBill.billNumber
            : "hospital-bill";

        link.download = `${filename}.csv`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        showToast("CSV exported successfully.");
    });
}

/* =========================================================
   28. PRINT / PDF
========================================================= */

if (printBtn) {
    printBtn.addEventListener("click", function () {
        if (currentBill.items.length === 0) {
            showToast("Add items before creating a report.");

            return;
        }

        /*
                Browser print dialog lets the user
                choose "Save as PDF".
            */

        window.print();
    });
}

/* =========================================================
   29. BILL STATUS
========================================================= */

function updateBillStatus() {
    if (!billStatus || !statusDot) {
        return;
    }

    const hasBill = currentBillId !== null;

    if (hasBill) {
        billStatus.textContent = "Bill in progress";

        statusDot.classList.add("loaded");
    } else {
        billStatus.textContent = "No bill loaded";

        statusDot.classList.remove("loaded");
    }
}

/* =========================================================
   30. NAVIGATION ACTIVE LINK
========================================================= */

const navLinks = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", function () {
    const sections = document.querySelectorAll("main section[id]");

    let currentSection = "";

    sections.forEach(function (section) {
        const sectionTop = section.offsetTop - 150;

        if (window.scrollY >= sectionTop) {
            currentSection = section.id;
        }
    });

    navLinks.forEach(function (link) {
        link.classList.remove("active");

        const href = link.getAttribute("href");

        if (href === "#" + currentSection) {
            link.classList.add("active");
        }
    });
});

/* =========================================================
   31. MOBILE NAVIGATION
========================================================= */

const menuButton = document.querySelector(".menu-button");

const nav = document.querySelector(".nav-links");

if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
        nav.classList.toggle("open");
    });

    nav.addEventListener("click", function (event) {
        if (event.target.tagName === "A") {
            nav.classList.remove("open");
        }
    });
}

/* =========================================================
   32. KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener("keydown", function (event) {
    /*
            Ctrl + S

            Save current bill.
        */

    if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();

        if (!currentBillId) {
            createNewBill();
        }

        /*
                Read current form values
                before saving.
            */

        if (patientNameInput) {
            currentBill.patientName = patientNameInput.value.trim();
        }

        if (hospitalNameInput) {
            currentBill.hospitalName = hospitalNameInput.value.trim();
        }

        if (billNumberInput) {
            currentBill.billNumber = billNumberInput.value.trim();
        }

        if (billDateInput) {
            currentBill.billDate = billDateInput.value;
        }

        saveCurrentBill();

        updateEverything();

        showToast("Bill saved.");
    }
});

/* =========================================================
   33. UPDATE EVERYTHING
========================================================= */

function updateEverything() {
    renderItems();

    renderDashboard();

    renderAnalysis();

    renderReport();

    renderHistory();

    updateBillStatus();
}

/* =========================================================
   34. INITIALIZATION
========================================================= */

function initializeApp() {
    /*
        Don't automatically create a bill.

        Existing bills stay safely in localStorage.
        User can click New Bill or open one from history.
    */

    updateItemLiveTotal();

    updateEverything();
}

initializeApp();
