var url = 'http://172.17.13.55/cse383_final/final.php/'
var subcategory = "%";
var minPrice = 0;
var maxPrice = 100000;
var sortBy = "product_id";

var cartId = -1;
var qtyMap = new Map();

var cartPrice = 0;
var removeAmt = 0;

$(document).ready(function() {
    getProductCategories();
    getProducts();
    getCurrentShoppingCart();
    $("#categorySelect").change(function() {
        subcategory = $("#categorySelect").val();
        getProducts();
    });

    $("#priceLow").change(function() {
        let val = parseFloat($("#priceLow").val());
        if (val !== NaN && val <= maxPrice) {
            minPrice = val;
        } else {
            $("#priceLow").val("");
            minPrice = 0;
        }
        getProducts();
    });

    $("#priceHigh").change(function() {
        let val = parseFloat($("#priceHigh").val());
        if (val !== NaN && val >= minPrice) {
            maxPrice = val;
        } else {
            $("#priceHigh").val("");
            maxPrice = 100000;
        }
        getProducts();
    });

    $("#sortBy").change(function() {
        sortBy = $("#sortBy").val();
        getProducts();
    });

    $("#shoppingCartModal").on("shown.bs.modal", function() {
        getCartItems();
    });
});

function getProductCategories() {
    $.ajax({
        url: url + 'getProductCategories',
        method: 'GET'
    }).done(function(data) {
        data.result.forEach(element => {
            $("#categorySelect").append(`<option value='${element.subcategory}'>${element.subcategory}</option>`);         
        });
    }).fail(function(error) {
        console.log("Error: " + error)
    });
}

function getProducts() {
    $.ajax({
        url: url + 'getProduct',
        method: 'POST',
        data : {
            category: 'Clothing and Accessories',
            subcategory: subcategory,
            id: 0,
            minPrice: minPrice,
            maxPrice: maxPrice,
            sortBy: sortBy
        }
    }).done(function(data) {
        $("#productsList").html("");
        data.result.forEach(item => {
            $("#productsList").append(`
                <tr>
                    <td>
                        <form>
                            <div class="row">
                                <div class="col-lg-2">
                                    <img src="${item.image}" class='img-fluid productImg'
                                    alt="${item.description}">
                                </div>
                                <div class="col-lg-3">
                                    <div class="row">
                                        <h3>${item.title}</h3>
                                    </div>
                                    <div class="row">
                                        <h4>${item.subcategory}</h4>
                                    </div>
                                    <div class="row">
                                        <h5>Price: $${item.price}</h5>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <h3>Description:</h3>
                                    <p>${item.description}</p>
                                </div>
                                <div class="col-lg-1">
                                    <div class="row">
                                        <label for="quantity${item.product_id}" class="form-label">Quantity</label>
                                        <input type="number" id="quantity${item.product_id}" class="form-control" value="1" min="1">
                                    </div>
                                    <div class="row">
                                        <button type="button" class="btn btn-success addItemButton" onclick=addItemToCart(${item.product_id})>Add to Cart</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </td>
                </tr>`
            );
            qtyMap.set(item.product_id, $(`#quantity${item.product_id}`).val()); 
            $(`#quantity${item.product_id}`).change(function() {
                qtyMap.set(item.product_id, $(`#quantity${item.product_id}`).val());
            });
        });
        
    }).fail(function(error) {
        console.log("Error: " + error)
    });
}

function getCurrentShoppingCart() {
    $.ajax({
        url: url + 'getCurrentShoppingCart',
        method: 'GET'
    }).done(function(data) {
        if (data.result.length === 0) {
            createShoppingCart();
        } else {
            cartId = parseInt(data.result[0].cartId);
            getCartPrice();
        }
    }).fail(function(error) {
        console.log("Error: " + error);
    });
}

function createShoppingCart() {
    $.ajax({
        url: url + 'createShoppingCart',
        method: 'GET'
    }).done(function(data) {
        cartId = parseInt(data.result[0]["last_insert_rowid()"]);
        getCartPrice();
    }).fail(function(error) {
        console.log("Error: " + error);
    });
}

function addItemToCart(prodId) {
    $.ajax({
        url: url + 'addItemsToCart',
        method: 'POST',
        data: {
            cartId: cartId,
            productId: prodId,
            quantity: qtyMap.get(""+prodId)
        }
    }).done(function(data) {
        data["message"] === "Cart not found or not available" ? showAlert(data["message"], "danger") : showAlert(data["message"], "success");
        getCartItems();
    }).fail(function(error) {
        console.log("Error: " + error);
    });
}

function removeItemFromCart(prodId) {
    $.ajax({
        url: url + 'removeItemFromCart',
        method: 'POST',
        data: {
            cartId: cartId,
            productId: prodId,
            amount: removeAmt
        }
    }).done(function(data) {
        getCartItems();
    }).fail(function(error) {
        console.log(error);
    });
}

function showAlert(message, type) {
    $("#alert").html(
        `<div class="alert alert-${type} alert-dismissible" role="alert">
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`
    );
}

function getCartItems() {
    $.ajax({
        url: url + 'getCartItems',
        method: 'POST',
        data: {
            cartId: cartId,
        }
    }).done(function(data) {
        $("#cartItems").html("");
        $("#modalLabel").html("Shopping Cart");
        $("#closeModalButton").show();
        $("#backButton").hide();
        $("#dialog").addClass("modal-xl");
        $("#checkoutButton").show();
        $("#paymentButton").hide();
        $("#cartTable").addClass("table-striped");
        if (data.result.length === 0) {
            $("#cartItems").html("<h2>Cart is empty.</h2>");
            $("#checkoutButton").attr("disabled", true);
        } else {
            $("#checkoutButton").attr("disabled", false);
            data.result.forEach(product => {
                $("#cartItems").append(`
                    <tr>
                        <td>
                            <div class="row">
                                <div class="col-lg-2">
                                    <img src="${product.image}" class='img-fluid productImg'
                                    alt="${product.description}">
                                </div>
                                <div class="col-lg-3">
                                    <div class="row">
                                        <h3>${product.title}</h3>
                                    </div>
                                    <div class="row">
                                        <h4>${product.subcategory}</h4>
                                    </div>
                                    <div class="row">
                                        <h5>Price: $${product.price}</h5>
                                    </div>
                                </div>
                                <div class="col-lg-5">
                                    <h3>Description:</h3>
                                    <p>${product.description}</p>
                                </div>
                                <div class="col-lg-2">
                                    <div class="row">
                                        <h3 class="cartQty">Quantity: ${product.quantity}</h3>
                                    </div>
                                    <div class="row">
                                        <label for="amtToRemove">Quantity to remove:</label>
                                        <input type="number" id="amtToRemove" class="form-control" min="0">
                                    </div>
                                    <div class="row">
                                        <button type="button" class="btn btn-danger" onclick=removeItemFromCart(${product.product_id})>Remove from Cart</button>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `);
                $("#amtToRemove").change(function() {
                    removeAmt = $("#amtToRemove").val();
                });
            });
        }
        getCartPrice();
    }).fail(function(error) {
        console.log("Error: " + error);
    });
}

function getCartPrice() {
    $.ajax({
        url: url + 'getCartPrice',
        method: 'POST',
        data: {
            cartId: cartId,
        }
    }).done(function(data) {
           if (data.result.length === 0) {
             $('cartButton').html('Cart')
	     $("#totalPrice").html(`
                <div class="row">
                    <div class="col-lg">
                        <h3>Total Price: $0.00</h3>
                    </div>
                </div>`
            );
        } else {
            cartPrice = parseFloat(data.result[0].total_price);
            $("#cartButton").html(`Cart`);
            $("#totalPrice").html(`
                <div class="row">
                    <div class="col-lg">
                        <h3>Total Price: $${(Math.round(cartPrice * 100) / 100).toFixed(2)}</h3>
                    </div>
                </div>`
            );
        }
    }).fail(function(error) {
        console.log("Error: " + error);
    });
}

function showCheckout() {
    $("#cartItems").html("");
    $("#closeModalButton").hide();
    $("#backButton").show();
    $("#checkoutButton").hide();
    $("#paymentButton").show();
    $("#dialog").removeClass("modal-xl");
    $("#modalLabel").html("Checkout");
    $("#cartTable").removeClass("table-striped");
    $("#cartItems").append(`
        <tr>
            <td>
                <form>
                    <label for="amtTendered" class="form-label">Amount Owed</label>
                    <input type="number" id="amtTendered" class="form-control" min="${cartPrice}">

                    <label for="payMethod" class="form-label">Payment Method</label>
                    <select id="payMethod" class="form-select">
                        <option value="card">Card</option>
                        <option value="cash">Cash</option>
                    </select>
                    <h4 id="cartChange"></h4>
                </form>
            </td>
        </tr>
    `);    

    $("#amtTendered").change(function() {
        if ($("#amtTendered").val() >= cartPrice)  {
            let change = (Math.round(($("#amtTendered").val() - cartPrice) * 100) / 100).toFixed(2);
            $("#cartChange").html("Change: $" + change);
            $("#paymentButton").attr("disabled", false);
        } else {
            $("#paymentButton").attr("disabled", true);
        }
    });
}

function makePayment() {
    $.ajax({
        url: url + 'makeSale',
        method: 'POST',
        data: {
            cartId: cartId
        }
    }).done(function(data) {
        data["message"] === "Cart not found or not available" ? showAlert(data["message"], "danger") : showAlert(data["message"], "success");
        createShoppingCart();
        $("#cartItems").html("");
        $("#paymentButton").attr("disabled", true);
        $("#shoppingCartModal").modal('toggle');
    }).fail(function(error) {
        console.log("Error: " + error);
    });
}
