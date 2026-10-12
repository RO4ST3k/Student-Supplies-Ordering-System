"use strict";

const products = [
  { id: 1, name: "Ballpen", price: 12 },
  { id: 2, name: "Pencil", price: 10 },
  { id: 3, name: "Notebook", price: 35 },
  { id: 4, name: "Yellow Pad", price: 45 },
  { id: 5, name: "Eraser", price: 8 },
  { id: 6, name: "Ruler", price: 15 }
];

const cart = [];
let completedTransaction = null;

const get = id => document.getElementById(id);

const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function makeButton(text, label, onClick, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.className = className;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

function renderProducts() {
  get("product-list").replaceChildren();

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = money.format(product.price);

    card.append(
      name,
      price,
      makeButton(
        "Add to Cart",
        `Add ${product.name} to cart`,
        () => addToCart(product.id)
      )
    );

    get("product-list").append(card);
  });
}

function addToCart(id) {
  if (completedTransaction) return;
  const product = products.find(product => product.id === id);
  if (!product) return;

  const item = cart.find(item => item.id === id);

  if (item) {
    if (item.quantity >= 9999) {
      get("cart-status").textContent = "Maximum quantity is 9,999 per product.";
      return;
    }
    item.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCart(`${product.name} added to cart.`);
}

function changeQuantity(id, delta) {
  if (completedTransaction) return;
  if (delta !== 1 && delta !== -1) return;
  const item = cart.find(item => item.id === id);
  if (!item) return;
  if (delta === 1 && item.quantity >= 9999) {
    get("cart-status").textContent = "Maximum quantity is 9,999 per product.";
    return;
  }

  item.quantity += delta;

  // Decreasing a quantity of one removes the item.
  if (item.quantity < 1) {
    removeFromCart(id);
    return;
  }

  updateCart(`${item.name} quantity updated.`);
}

function removeFromCart(id) {
  if (completedTransaction) return;
  const index = cart.findIndex(item => item.id === id);
  if (index < 0) return;

  const [item] = cart.splice(index, 1);
  updateCart(`${item.name} removed from cart.`);
}

function renderCart() {
  const focused = document.activeElement;
  const focusId = focused?.dataset.productId;
  const focusAction = focused?.dataset.action;

  get("cart-items").replaceChildren();
  get("cart-empty").hidden = cart.length > 0;
  get("cart-table-wrapper").hidden = cart.length === 0;

  cart.forEach(item => {
    const row = document.createElement("tr");

    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = item.name;

    const price = document.createElement("td");
    price.textContent = money.format(item.price);

    const quantity = document.createElement("td");
    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    const minus = makeButton(
      "−",
      `Decrease ${item.name} quantity`,
      () => changeQuantity(item.id, -1),
      "quantity-button"
    );

    const plus = makeButton(
      "+",
      `Increase ${item.name} quantity`,
      () => changeQuantity(item.id, 1),
      "quantity-button"
    );

    const value = document.createElement("span");
    value.textContent = item.quantity;

    controls.append(minus, value, plus);
    quantity.append(controls);

    const subtotal = document.createElement("td");
    subtotal.textContent = money.format(item.price * item.quantity);

    const actions = document.createElement("td");

    const remove = makeButton(
      "Remove",
      `Remove ${item.name} from cart`,
      () => removeFromCart(item.id),
      "remove-button"
    );

    [minus, plus, remove].forEach((button, index) => {
      button.dataset.productId = item.id;
      button.dataset.action = ["decrease", "increase", "remove"][index];
    });

    actions.append(remove);
    row.append(name, price, quantity, subtotal, actions);
    get("cart-items").append(row);
  });

  // Restore keyboard focus after rebuilding the cart rows.
  if (focusId) {
    const buttons = [...get("cart-items").querySelectorAll("button")];

    const match = buttons.find(
      button =>
        button.dataset.productId === focusId &&
        button.dataset.action === focusAction
    );

    (
      match ||
      buttons[0] ||
      get("product-list").querySelector("button")
    )?.focus();
  }
}

function updateCart(message = "") {
  clearPaymentError();
  renderCart();

  const count = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  get("cart-count").textContent =
    `${count} ${count === 1 ? "item" : "items"}`;

  get("subtotal").textContent = money.format(total);
  get("charges").textContent = money.format(0);
  get("order-total").textContent = money.format(total);

  if (message) {
    get("cart-status").textContent =
      `${message} Total ${money.format(total)}.`;
  }
}

renderProducts();
updateCart();

function clearPaymentError() {
  get("payment-error").textContent = "";
  get("payment-error").hidden = true;
  get("amount-paid").removeAttribute("aria-invalid");
}

function paymentError(message, invalidInput = true) {
  get("payment-error").textContent = message;
  get("payment-error").hidden = false;
  if (invalidInput) {
    get("amount-paid").setAttribute("aria-invalid", "true");
    get("amount-paid").focus();
  }
}

// Use integer centavos to avoid floating-point change errors.
function validatePayment(raw, badInput, totalCents, hasItems) {
  if (!hasItems) return { error: "Your cart is empty. Add supplies before paying.", invalidInput: false };
  if (badInput) return { error: "Enter a valid numeric amount." };
  if (!raw.trim()) return { error: "Enter the amount paid." };
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return { error: "Enter a valid numeric amount." };
  if (amount < 0) return { error: "Amount paid cannot be negative." };
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(raw.trim())) return { error: "Enter a numeric amount with no more than two decimal places." };
  const [whole, fraction = ""] = raw.trim().split(".");
  const cents = BigInt(whole || "0") * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) return { error: "The amount entered is too large." };
  const paidCents = Number(cents);
  if (paidCents < totalCents) return { error: `Amount paid must be at least ${money.format(totalCents / 100)}.` };
  return { paidCents };
}

function setTransactionLocked(locked) {
  document.querySelectorAll(".product-card button, #cart-items button").forEach(button => {
    button.disabled = locked;
  });
  get("amount-paid").disabled = locked;
  get("confirm-payment").disabled = locked;
  get("payment-form").hidden = locked;
  get("payment-complete").hidden = !locked;
}

function transactionReference() {
  if (globalThis.crypto?.randomUUID) return `TXN-${crypto.randomUUID().toUpperCase()}`;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `TXN-${Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function confirmPayment(event) {
  event.preventDefault();
  if (completedTransaction) return;
  clearPaymentError();
  const totalCents = cart.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const input = get("amount-paid");
  const result = validatePayment(input.value, input.validity.badInput, totalCents, cart.length > 0);
  if (result.error) {
    paymentError(result.error, result.invalidInput !== false);
    return;
  }
  completedTransaction = {
    reference: transactionReference(),
    date: new Date(),
    items: cart.map(item => ({ ...item })),
    totalCents,
    paidCents: result.paidCents,
    changeCents: result.paidCents - totalCents
  };
  renderReceipt(completedTransaction);
  setTransactionLocked(true);
  get("receipt-section").hidden = false;
  get("receipt-heading").focus();
}

function renderReceipt(transaction) {
  get("receipt-reference").textContent = transaction.reference;
  get("receipt-date").textContent = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium", timeStyle: "long", timeZone: "Asia/Shanghai"
  }).format(transaction.date);
  get("receipt-items").replaceChildren();
  transaction.items.forEach(item => {
    const row = document.createElement("tr");
    [item.name, item.quantity, money.format(item.price), money.format(item.price * item.quantity)].forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.scope = "row";
      cell.textContent = value;
      row.append(cell);
    });
    get("receipt-items").append(row);
  });
  get("receipt-total").textContent = money.format(transaction.totalCents / 100);
  get("receipt-paid").textContent = money.format(transaction.paidCents / 100);
  get("receipt-change").textContent = money.format(transaction.changeCents / 100);
}

function newTransaction() {
  completedTransaction = null;
  cart.length = 0;
  get("payment-form").reset();
  clearPaymentError();
  get("cart-status").textContent = "";
  get("receipt-section").hidden = true;
  get("receipt-items").replaceChildren();
  ["receipt-reference", "receipt-date", "receipt-total", "receipt-paid", "receipt-change"].forEach(id => {
    get(id).textContent = "";
  });
  updateCart();
  setTransactionLocked(false);
  get("amount-paid").focus();
}

get("payment-form").addEventListener("submit", confirmPayment);
get("amount-paid").addEventListener("input", clearPaymentError);
get("new-transaction").addEventListener("click", newTransaction);
get("receipt-new-transaction").addEventListener("click", newTransaction);
