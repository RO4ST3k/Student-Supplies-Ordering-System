"use strict";

// Local inventory: no database or network connection is required.
const products = [
  { id: 1, name: "Ballpen", price: 12 },
  { id: 2, name: "Pencil", price: 10 },
  { id: 3, name: "Notebook", price: 35 },
  { id: 4, name: "Yellow Pad", price: 45 },
  { id: 5, name: "Eraser", price: 8 },
  { id: 6, name: "Ruler", price: 15 },
];

const state = {
  products,
  cart: [],
  order: null,
};

// The script is deferred, so these elements are available when it runs.
const elements = {
  productList: document.getElementById("product-list"),
  cartItems: document.getElementById("cart-items"),
  cartCount: document.getElementById("cart-count"),
  subtotal: document.getElementById("subtotal"),
  charges: document.getElementById("charges"),
  orderTotal: document.getElementById("order-total"),
  paymentOptions: document.getElementById("payment-options"),
  placeOrder: document.getElementById("place-order"),
  receiptContent: document.getElementById("receipt-content"),
};

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function renderProducts() {
  elements.productList.replaceChildren();

  for (const product of state.products) {
    const card = document.createElement("article");
    card.className = "product-card";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = pesoFormatter.format(product.price);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Add to Cart";
    button.setAttribute("aria-label", `Add ${product.name} to cart`);
    button.addEventListener("click", () => addToCart(product));

    card.append(name, price, button);
    elements.productList.append(card);
  }
}

function addToCart(product) {
  const existing = state.cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  elements.cartItems.replaceChildren();

  let count = 0;
  let subtotal = 0;

  for (const item of state.cart) {
    count += item.quantity;
    subtotal += item.price * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-line";

    const label = document.createElement("span");
    label.textContent = `${item.name} × ${item.quantity}`;

    const amount = document.createElement("span");
    amount.textContent = pesoFormatter.format(item.price * item.quantity);

    row.append(label, amount);
    elements.cartItems.append(row);
  }

  elements.cartCount.textContent =
    `${count} ${count === 1 ? "item" : "items"}`;

  elements.subtotal.textContent = pesoFormatter.format(subtotal);
  elements.charges.textContent = pesoFormatter.format(0);
  elements.orderTotal.textContent = pesoFormatter.format(subtotal);
}

function init() {
  renderProducts();

  // TODO: Configure payment before enabling the Place order button.
  // TODO: Render a receipt after a successful order.
}

init();