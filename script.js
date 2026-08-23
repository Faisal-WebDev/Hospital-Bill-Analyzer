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

let editingItemIndex = null;

const billInfoForm = document.getElementById("billInfoForm");

const patientNameInput = document.getElementById("patientName");

const hospitalNameInput = document.getElementById("hospitalName");

const billNumberInput = document.getElementById("billNumber");

const billDateInput = document.getElementById("billDate");

const itemForm = document.getElementById("itemForm");

const itemDescriptionInput = document.getElementById("itemDescription");

const itemCategoryInput = document.getElementById("itemCategory");

const itemQuantityInput = document.getElementById("itemQuantity");

const itemPriceInput = document.getElementById("itemPrice");

const itemLiveTotal = document.getElementById("itemLiveTotal");

const itemsTableBody = document.getElementById("itemsTableBody");

const itemsEmpty = document.getElementById("itemsEmpty");

const itemCountText = document.getElementById("itemCountText");

const tableTotal = document.getElementById("tableTotal");

const dashboardTotal = document.getElementById("dashboardTotal");

const dashboardItems = document.getElementById("dashboardItems");

const dashboardFlags = document.getElementById("dashboardFlags");

const dashboardHighest = document.getElementById("dashboardHighest");

const dashboardHighestName = document.getElementById("dashboardHighestName");

const donutSegments = document.getElementById("donutSegments");

const donutTotal = document.getElementById("donutTotal");

const chartLegend = document.getElementById("chartLegend");

const highestItems = document.getElementById("highestItems");

const analysisList = document.getElementById("analysisList");

const normalCount = document.getElementById("normalCount");

const warningCount = document.getElementById("warningCount");

const criticalCount = document.getElementById("criticalCount");

const reportHospital = document.getElementById("reportHospital");

const reportPatient = document.getElementById("reportPatient");

const reportBillNumber = document.getElementById("reportBillNumber");

const reportDate = document.getElementById("reportDate");

const reportTableBody = document.getElementById("reportTableBody");

const reportEmpty = document.getElementById("reportEmpty");

const reportTotal = document.getElementById("reportTotal");

const historyList = document.getElementById("historyList");

const newBillBtn = document.getElementById("newBillBtn");

const clearItemsBtn = document.getElementById("clearItemsBtn");

const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const csvBtn = document.getElementById("csvBtn");

const printBtn = document.getElementById("printBtn");

const billStatus = document.getElementById("billStatus");

const statusDot = document.querySelector(".status-dot");

const toast = document.getElementById("toast");

const CATEGORY_COLORS = {
    Consultation: "#00ff66" /* green  */,
    Medicine: "#007bff" /* blue   */,
    Laboratory: "#ffb300" /* yellow */,
    Imaging: "#6200ff" /* purple */,
    Procedure: "#ff5900" /* orange */,
    Surgery: "#ff0000" /* red    */,
    Room: "#00ffe5" /* teal   */,
    Supplies: "#ccff00" /* olive  */,
    Other: "#535353" /* gray   */,
};

function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || "#8a949c";
}

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
    if (!currentBill || !Array.isArray(currentBill.items)) {
        return 0;
    }

    return currentBill.items.reduce(function (total, item) {
        return total + Number(item.total || 0);
    }, 0);
}

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

    loadCurrentBillIntoForm();

    updateEverything();

    showToast("New bill started.");
}

function saveCurrentBill() {
    if (!currentBillId) {
        showToast("Click 'New Bill' first.");

        return;
    }

    currentBill.updatedAt = new Date().toISOString();

    const bills = getBills();

    const existingIndex = bills.findIndex(function (bill) {
        return Number(bill.id) === Number(currentBillId);
    });

    if (existingIndex === -1) {
        bills.unshift({
            ...currentBill,
            items: [...(currentBill.items || [])],
        });
    } else {
        bills[existingIndex] = {
            ...currentBill,

            items: [...(currentBill.items || [])],
        };
    }

    saveBills(bills);

    renderHistory();

    updateBillStatus();
}

function loadBill(id) {
    const bills = getBills();

    const bill = bills.find(function (item) {
        return Number(item.id) === Number(id);
    });

    if (!bill) {
        showToast("Could not find that bill.");

        return;
    }

    currentBillId = bill.id;

    currentBill = {
        id: bill.id,

        patientName: bill.patientName || "",

        hospitalName: bill.hospitalName || "",

        billNumber: bill.billNumber || "",

        billDate: bill.billDate || "",

        items: Array.isArray(bill.items)
            ? bill.items.map(function (item) {
                  return {
                      ...item,
                  };
              })
            : [],

        createdAt: bill.createdAt || "",

        updatedAt: bill.updatedAt || "",
    };

    loadCurrentBillIntoForm();

    updateEverything();

    const billSection = document.getElementById("bill-info");

    if (billSection) {
        billSection.scrollIntoView({
            behavior: "smooth",
        });
    }

    showToast("Bill opened. You can edit it now.");
}

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
        billDateInput.value = currentBill.billDate || getToday();
    }
}

function deleteBill(id) {
    const confirmed = confirm("Are you sure you want to delete this bill?");

    if (!confirmed) {
        return;
    }

    let bills = getBills();

    bills = bills.filter(function (bill) {
        return Number(bill.id) !== Number(id);
    });

    saveBills(bills);

    if (Number(currentBillId) === Number(id)) {
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

if (billInfoForm) {
    billInfoForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!currentBillId) {
            showToast("Click 'New Bill' first.");

            return;
        }

        currentBill.patientName = patientNameInput
            ? patientNameInput.value.trim()
            : "";

        currentBill.hospitalName = hospitalNameInput
            ? hospitalNameInput.value.trim()
            : "";

        currentBill.billNumber = billNumberInput
            ? billNumberInput.value.trim()
            : "";

        currentBill.billDate = billDateInput ? billDateInput.value : "";

        saveCurrentBill();

        updateEverything();

        showToast("Bill information saved.");
    });
}

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

if (itemForm) {
    itemForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!currentBillId) {
            showToast("Click 'New Bill' first.");

            return;
        }

        const description = itemDescriptionInput
            ? itemDescriptionInput.value.trim()
            : "";

        const category = itemCategoryInput ? itemCategoryInput.value : "";

        const quantity = Number(
            itemQuantityInput ? itemQuantityInput.value : 0,
        );

        const price = Number(itemPriceInput ? itemPriceInput.value : 0);

        if (!description) {
            showToast("Enter an item description.");

            if (itemDescriptionInput) {
                itemDescriptionInput.focus();
            }

            return;
        }

        if (!category) {
            showToast("Select an item category.");

            if (itemCategoryInput) {
                itemCategoryInput.focus();
            }

            return;
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            showToast("Quantity must be greater than 0.");

            if (itemQuantityInput) {
                itemQuantityInput.focus();
            }

            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            showToast("Enter a valid price.");

            if (itemPriceInput) {
                itemPriceInput.focus();
            }

            return;
        }

        const item = {
            id: Date.now() + Math.floor(Math.random() * 1000),

            description: description,

            category: category,

            quantity: quantity,

            price: price,

            total: quantity * price,
        };

        currentBill.items.push(item);

        saveCurrentBill();

        itemForm.reset();

        if (itemQuantityInput) {
            itemQuantityInput.value = 1;
        }

        updateItemLiveTotal();

        updateEverything();

        showToast("Item added to this bill.");
    });
}

function analyzeItem(item, index) {
    const issues = [];

    if (Number(item.price) <= 0) {
        issues.push({
            type: "critical",

            title: "Invalid price",

            message: "This item has a zero or invalid unit price.",
        });
    }

    const duplicate = currentBill.items.some(function (other, otherIndex) {
        if (otherIndex === index) {
            return false;
        }

        const sameDescription =
            String(other.description || "")
                .trim()
                .toLowerCase() ===
            String(item.description || "")
                .trim()
                .toLowerCase();

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

    if (Number(item.quantity) >= 10) {
        issues.push({
            type: "warning",

            title: "High quantity",

            message:
                "This item has a quantity of " +
                item.quantity +
                ". Verify that it matches the original bill.",
        });
    }

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

            if (Number(item.price) >= average * 3) {
                issues.push({
                    type: "warning",

                    title: "Unusually high price",

                    message:
                        "This unit price is significantly higher than the average unit price of the other items.",
                });
            }
        }
    }

    const billTotal = getCurrentBillTotal();

    if (billTotal > 0 && Number(item.total) / billTotal >= 0.5) {
        issues.push({
            type: "warning",

            title: "Large share of bill",

            message:
                "This item represents 50% or more of the current bill total.",
        });
    }

    return issues;
}

function getItemStatus(item, index) {
    const issues = analyzeItem(item, index);

    const critical = issues.some(function (issue) {
        return issue.type === "critical";
    });

    if (critical) {
        return "critical";
    }

    if (issues.length > 0) {
        return "warning";
    }

    return "normal";
}

function renderItems() {
    if (!itemsTableBody) {
        return;
    }

    itemsTableBody.innerHTML = "";

    if (!currentBill.items || currentBill.items.length === 0) {
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
                    ${Number(item.quantity)}
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

                <td class="item-actions">

                    <button
                        type="button"
                        class="edit-item"
                        data-index="${index}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-item"
                        data-index="${index}"
                    >
                        Delete
                    </button>

                </td>

            `;

        itemsTableBody.appendChild(row);
    });

    if (tableTotal) {
        tableTotal.textContent = formatMoney(getCurrentBillTotal());
    }
}

function deleteItem(index) {
    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= currentBill.items.length
    ) {
        return;
    }

    const item = currentBill.items[index];

    const confirmed = confirm(`Delete "${item.description}" from this bill?`);

    if (!confirmed) {
        return;
    }

    currentBill.items.splice(index, 1);

    saveCurrentBill();

    updateEverything();

    showToast("Item deleted.");
}

if (itemsTableBody) {
    itemsTableBody.addEventListener("click", function (event) {
        /*
                EDIT
            */

        const editButton = event.target.closest(".edit-item");

        if (editButton) {
            const index = Number(editButton.dataset.index);

            openEditItemModal(index);

            return;
        }

        const deleteButton = event.target.closest(".delete-item");

        if (deleteButton) {
            const index = Number(deleteButton.dataset.index);

            deleteItem(index);
        }
    });
}

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

function createEditItemModal() {
    if (document.getElementById("editItemModal")) {
        return;
    }

    const modal = document.createElement("div");

    modal.id = "editItemModal";

    modal.className = "edit-item-modal";

    modal.innerHTML = `

        <div
            class="edit-item-overlay"
        ></div>


        <div
            class="edit-item-dialog"
        >

            <div
                class="edit-item-header"
            >

                <div>

                    <h3>
                        Edit Bill Item
                    </h3>

                    <p>
                        Change only the information
                        you need to update.
                    </p>

                </div>


                <button
                    type="button"
                    class="edit-item-close"
                    id="closeEditItem"
                >
                    ×
                </button>

            </div>


            <form
                id="editItemForm"
            >

                <div
                    class="edit-item-fields"
                >

                    <div
                        class="form-group"
                    >

                        <label>
                            Description
                        </label>

                        <input
                            type="text"
                            id="editItemDescription"
                            required
                        >

                    </div>


                    <div
                        class="form-group"
                    >

                        <label>
                            Category
                        </label>

                        <select
                            id="editItemCategory"
                            required
                        >

                            <option value="">
                                Select category
                            </option>

                            <option value="Consultation">
                                Consultation
                            </option>

                            <option value="Medicine">
                                Medicine
                            </option>

                            <option value="Laboratory">
                                Laboratory
                            </option>

                            <option value="Imaging">
                                Imaging
                            </option>

                            <option value="Procedure">
                                Procedure
                            </option>

                            <option value="Room / Bed">
                                Room / Bed
                            </option>

                            <option value="Medical Supplies">
                                Medical Supplies
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>


                    <div
                        class="edit-item-row"
                    >

                        <div
                            class="form-group"
                        >

                            <label>
                                Quantity
                            </label>

                            <input
                                type="number"
                                id="editItemQuantity"
                                min="1"
                                step="1"
                                required
                            >

                        </div>


                        <div
                            class="form-group"
                        >

                            <label>
                                Unit Price
                            </label>

                            <input
                                type="number"
                                id="editItemPrice"
                                min="0"
                                step="0.01"
                                required
                            >

                        </div>

                    </div>


                    <div
                        class="edit-item-total"
                    >

                        <span>
                            New Total
                        </span>

                        <strong
                            id="editItemTotal"
                        >
                            Rs. 0.00
                        </strong>

                    </div>

                </div>


                <div
                    class="edit-item-actions"
                >

                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelEditItem"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save Changes
                    </button>

                </div>

            </form>

        </div>

    `;

    document.body.appendChild(modal);

    const closeButton = document.getElementById("closeEditItem");

    if (closeButton) {
        closeButton.addEventListener("click", closeEditItemModal);
    }

    const cancelButton = document.getElementById("cancelEditItem");

    if (cancelButton) {
        cancelButton.addEventListener("click", closeEditItemModal);
    }

    const overlay = modal.querySelector(".edit-item-overlay");

    if (overlay) {
        overlay.addEventListener("click", closeEditItemModal);
    }

    const editQuantity = document.getElementById("editItemQuantity");

    const editPrice = document.getElementById("editItemPrice");

    if (editQuantity) {
        editQuantity.addEventListener("input", updateEditItemTotal);
    }

    if (editPrice) {
        editPrice.addEventListener("input", updateEditItemTotal);
    }

    const editForm = document.getElementById("editItemForm");

    if (editForm) {
        editForm.addEventListener("submit", saveEditedItem);
    }
}

function openEditItemModal(index) {
    if (
        !currentBill ||
        !Array.isArray(currentBill.items) ||
        !currentBill.items[index]
    ) {
        showToast("Could not find this item.");

        return;
    }

    editingItemIndex = index;

    createEditItemModal();

    const item = currentBill.items[index];

    const descriptionInput = document.getElementById("editItemDescription");

    const categoryInput = document.getElementById("editItemCategory");

    const quantityInput = document.getElementById("editItemQuantity");

    const priceInput = document.getElementById("editItemPrice");

    if (descriptionInput) {
        descriptionInput.value = item.description || "";
    }

    if (categoryInput) {
        categoryInput.value = item.category || "";
    }

    if (quantityInput) {
        quantityInput.value = item.quantity || 1;
    }

    if (priceInput) {
        priceInput.value = item.price || 0;
    }

    updateEditItemTotal();

    const modal = document.getElementById("editItemModal");

    if (modal) {
        modal.classList.add("open");
    }

    setTimeout(function () {
        if (descriptionInput) {
            descriptionInput.focus();
        }
    }, 100);
}

function updateEditItemTotal() {
    const quantityInput = document.getElementById("editItemQuantity");

    const priceInput = document.getElementById("editItemPrice");

    const totalElement = document.getElementById("editItemTotal");

    if (!quantityInput || !priceInput || !totalElement) {
        return;
    }

    const quantity = Number(quantityInput.value) || 0;

    const price = Number(priceInput.value) || 0;

    totalElement.textContent = formatMoney(quantity * price);
}

function saveEditedItem(event) {
    event.preventDefault();

    if (editingItemIndex === null) {
        return;
    }

    const item = currentBill.items[editingItemIndex];

    if (!item) {
        showToast("Could not find this item.");

        return;
    }

    const descriptionInput = document.getElementById("editItemDescription");

    const categoryInput = document.getElementById("editItemCategory");

    const quantityInput = document.getElementById("editItemQuantity");

    const priceInput = document.getElementById("editItemPrice");

    const description = descriptionInput ? descriptionInput.value.trim() : "";

    const category = categoryInput ? categoryInput.value : "";

    const quantity = Number(quantityInput ? quantityInput.value : 0);

    const price = Number(priceInput ? priceInput.value : 0);

    if (!description) {
        showToast("Enter a description.");

        return;
    }

    if (!category) {
        showToast("Select a category.");

        return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        showToast("Quantity must be greater than 0.");

        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        showToast("Enter a valid price.");

        return;
    }

    item.description = description;

    item.category = category;

    item.quantity = quantity;

    item.price = price;

    item.total = quantity * price;

    saveCurrentBill();

    updateEverything();

    closeEditItemModal();

    showToast("Item updated successfully.");
}

function closeEditItemModal() {
    const modal = document.getElementById("editItemModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("open");

    editingItemIndex = null;
}

function renderAnalysis() {
    if (!analysisList) {
        return;
    }

    analysisList.innerHTML = "";

    if (!currentBill.items || currentBill.items.length === 0) {
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

                        <div
                            class="analysis-icon"
                        >

                            ${issue.type === "critical" ? "!" : "?"}

                        </div>


                        <div
                            class="analysis-content"
                        >

                            <strong>

                                ${escapeHTML(issue.title)}

                                —

                                ${escapeHTML(item.description)}

                            </strong>


                            <p>

                                ${escapeHTML(issue.message)}

                            </p>

                        </div>


                        <div
                            class="analysis-price"
                        >

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

            <div
                class="analysis-item normal"
            >

                <div
                    class="analysis-icon"
                >
                    ✓
                </div>


                <div
                    class="analysis-content"
                >

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


                <div
                    class="analysis-price"
                >

                    ${currentBill.items.length}
                    items

                </div>

            </div>

        `;
    }
}

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
            return Number(b.total) - Number(a.total);
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

function renderDonut() {
    if (!donutSegments || !chartLegend) {
        return;
    }

    donutSegments.innerHTML = "";

    chartLegend.innerHTML = "";

    const total = getCurrentBillTotal();

    if (total === 0) {
        chartLegend.innerHTML = `
            <div class="empty-mini">
                Add bill items to see the price breakdown.
            </div>
        `;

        return;
    }

    /* ---------- Category-wise totals ---------- */

    const categories = {};

    currentBill.items.forEach(function (item) {
        const category = item.category || "Other";

        if (!categories[category]) {
            categories[category] = 0;
        }

        categories[category] += Number(item.total || 0);
    });

    /* Sabse badi pehle */

    const sorted = Object.entries(categories).sort(function (a, b) {
        return b[1] - a[1];
    });

    /* ---------- Asli donut math ----------
       circumference = 2 × π × 45 ≈ 282.74
       har category ko apne share ke barabar arc
    ----------------------------------------- */

    const radius = 45;

    const circumference = 2 * Math.PI * radius;

    const gap = 2; /* segments ke beech chhota gap */

    let cumulative = 0;

    sorted.forEach(function (entry) {
        const category = entry[0];

        const amount = entry[1];

        const segmentLength = (amount / total) * circumference;

        const visualLength = Math.max(segmentLength - gap, 1);

        /* SVG namespace zaroori hai SVG ke andar element banane ke liye */

        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
        );

        circle.setAttribute("cx", "60");
        circle.setAttribute("cy", "60");
        circle.setAttribute("r", "45");

        circle.classList.add("donut-segment");

        circle.style.stroke = getCategoryColor(category);

        /* Kitna arc bharna hai */

        circle.style.strokeDasharray =
            visualLength + " " + (circumference - visualLength);

        /* Kahan se shuru karna hai */

        circle.style.strokeDashoffset = String(-(cumulative + gap / 2));

        /* Hover pe category + amount dikhaye */

        const title = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "title",
        );

        title.textContent = category + ": " + formatMoney(amount);

        circle.appendChild(title);

        donutSegments.appendChild(circle);

        cumulative += segmentLength;
    });

    /* ---------- Legend: har category apne color ke saath ---------- */

    sorted.forEach(function (entry) {
        const category = entry[0];

        const amount = entry[1];

        const categoryPercentage = ((amount / total) * 100).toFixed(1);

        const color = getCategoryColor(category);

        const div = document.createElement("div");

        div.className = "legend-item";

        div.title = formatMoney(amount);

        div.innerHTML = `
            <span class="legend-name">
                <span
                    class="legend-marker"
                    style="background: ${color}"
                ></span>

                ${escapeHTML(category)}
            </span>

            <span class="legend-value">
                ${categoryPercentage}%
            </span>
        `;

        chartLegend.appendChild(div);
    });
}

function renderHighestItems() {
    if (!highestItems) {
        return;
    }

    highestItems.innerHTML = "";

    if (currentBill.items.length === 0) {
        highestItems.innerHTML = `

            <div
                class="empty-state small"
            >

                <div
                    class="empty-icon"
                >
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
            return Number(b.total) - Number(a.total);
        })
        .slice(0, 5);

    sorted.forEach(function (item, index) {
        const div = document.createElement("div");

        div.className = "highest-item";

        div.innerHTML = `

                <span
                    class="rank"
                >

                    ${String(index + 1).padStart(2, "0")}

                </span>


                <div
                    class="highest-info"
                >

                    <strong>

                        ${escapeHTML(item.description)}

                    </strong>


                    <span>

                        ${escapeHTML(item.category)}

                    </span>

                </div>


                <strong
                    class="highest-price"
                >

                    ${formatMoney(item.total)}

                </strong>

            `;

        highestItems.appendChild(div);
    });
}

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
                    ${Number(item.quantity)}
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

function renderHistory() {
    if (!historyList) {
        return;
    }

    const bills = getBills().sort(function (a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    historyList.innerHTML = "";

    if (bills.length === 0) {
        historyList.innerHTML = `

            <div
                class="empty-state"
            >

                <div
                    class="empty-icon"
                >
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

        if (Number(bill.id) === Number(currentBillId)) {
            historyItem.classList.add("current-bill");
        }

        const hospital = bill.hospitalName || "Unnamed hospital";

        const patient = bill.patientName || "No patient name";

        const billNumber = bill.billNumber || "No bill number";
        const creationDate = bill.createdAt
            ? new Date(bill.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              })
            : "Unknown date";

        const items = Array.isArray(bill.items) ? bill.items : [];

        const itemCount = items.length;

        const total = items.reduce(function (sum, item) {
            return sum + Number(item.total || 0);
        }, 0);

        historyItem.innerHTML = `

                <div
                    class="history-main"
                >

                    <strong>

                        ${escapeHTML(hospital)}

                    </strong>

                    <span>

                        ${escapeHTML(billNumber)}

                    </span>

                </div>


                <div
                    class="history-data"
                >

                    <span>
                        Patient
                    </span>

                    <strong>

                        ${escapeHTML(patient)}

                    </strong>

                </div>

                <div
                    class="history-data"
                >

                    <span>
                        Created
                    </span>

                    <strong>
                        ${escapeHTML(creationDate)}
                    </strong>

                </div>


                <div
                    class="history-data"
                >

                    <span>
                        Items
                    </span>

                    <strong>
                        ${itemCount}
                    </strong>

                </div>


                <div
                    class="history-data"
                >

                    <span>
                        Total
                    </span>

                    <strong>

                        ${formatMoney(total)}

                    </strong>

                </div>


                <div
                    class="history-actions"
                >

                    <button
                        type="button"
                        class="history-load"
                        data-id="${bill.id}"
                    >

                        ${
                            Number(bill.id) === Number(currentBillId)
                                ? "Editing"
                                : "Open / Edit"
                        }

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

if (historyList) {
    historyList.addEventListener("click", function (event) {
        /*
                OPEN / EDIT
            */

        const openButton = event.target.closest(".history-load");

        if (openButton) {
            const id = Number(openButton.dataset.id);

            loadBill(id);

            return;
        }

        /*
                DELETE
            */

        const deleteButton = event.target.closest(".history-delete");

        if (deleteButton) {
            const id = Number(deleteButton.dataset.id);

            deleteBill(id);
        }
    });
}

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

if (newBillBtn) {
    newBillBtn.addEventListener("click", function () {
        const hasCurrentData =
            Boolean(currentBillId) &&
            (currentBill.patientName ||
                currentBill.hospitalName ||
                currentBill.billNumber ||
                currentBill.items.length > 0);

        if (hasCurrentData) {
            const confirmed = confirm(
                "Start a new bill? Your current bill is already saved in history.",
            );

            if (!confirmed) {
                return;
            }
        }

        /*
                THIS creates the new ID.
            */

        createNewBill();

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    });
}

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

        rows.push(["Hospital / Clinic", currentBill.hospitalName]);

        rows.push(["Patient Name", currentBill.patientName]);

        rows.push(["Bill Number", currentBill.billNumber]);

        rows.push(["Bill Date", currentBill.billDate]);

        rows.push([]);

        rows.push([
            "Description",
            "Category",
            "Quantity",
            "Unit Price",
            "Total",
        ]);

        currentBill.items.forEach(function (item) {
            rows.push([
                item.description,

                item.category,

                item.quantity,

                Number(item.price).toFixed(2),

                Number(item.total).toFixed(2),
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

if (printBtn) {
    printBtn.addEventListener("click", function () {
        if (currentBill.items.length === 0) {
            showToast("Add items before creating a report.");

            return;
        }

        window.print();
    });
}

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

const menuButton = document.querySelector(".menu-button");

const nav = document.querySelector(".nav-links");

if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
        const isOpen = nav.classList.toggle("open");

        menuButton.classList.toggle("open", isOpen);

        menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    nav.addEventListener("click", function (event) {
        if (event.target.tagName === "A") {
            nav.classList.remove("open");

            menuButton.classList.remove("open");

            menuButton.setAttribute("aria-expanded", "false");
        }
    });
}

document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();

        if (!currentBillId) {
            showToast("Click 'New Bill' first.");

            return;
        }

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

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeEditItemModal();
    }
});

function updateEverything() {
    renderItems();

    renderDashboard();

    renderAnalysis();

    renderReport();

    renderHistory();

    updateBillStatus();
}

function initializeApp() {
    createNewBill();

    updateItemLiveTotal();

    updateEverything();
}

initializeApp();
