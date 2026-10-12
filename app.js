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

const get = id => document.getElementById(id);

const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2
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
  const product = products.find(product => product.id === id);
  if (!product) return;

  const item = cart.find(item => item.id === id);

  if (item) {
    item.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCart(`${product.name} added to cart.`);
}

function changeQuantity(id, delta) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.quantity += delta;

  // Decreasing a quantity of one removes the item.
  if (item.quantity < 1) {
    removeFromCart(id);
    return;
  }

  updateCart(`${item.name} quantity updated.`);
}

function removeFromCart(id) {
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