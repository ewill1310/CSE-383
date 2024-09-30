var url = 'http://172.17.13.55/cse383_final/final.php/'
var minDate = "2000-01-01";
var maxDate = "2024-01-01";
var maxOrders = 100;

$(document).ready(function() {
    getOrders();
    
    $("#minDate").change(function() {
        minDate = $("#minDate").val();
        getOrders();
    });

    $("#maxDate").change(function() {
        maxDate = $("#maxDate").val();
        getOrders();
    });

    $("#maxOrders").change(function() {
        if ($("#maxOrders").val() > 0) {
            maxOrders = $("#maxOrders").val();
        } else {
            maxOrders = 100;
            $("#maxOrders").val("");
        }
        getOrders();
    });
});


function getOrders() {
    $.ajax({
        url: url + 'findClosedCarts',
        method: 'GET',
        data : {
            minDate: minDate,
            maxDate: maxDate,
            maxOrders: maxOrders
        }
    }).done(function(data) {
        if (data.carts.length == 0) {
            $("#orders").html("No orders found with the specified parameters.");
        }  else {
            $("#orders").html("");
            data.carts.forEach(cart => {
                var cartPrice = 0;
                $("#cartDetailsModal").append(`
                    <!-- Shopping Cart Modal -->
                    <div class="modal fade" id="cart${cart[0].cartId}" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-xl" id="dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h1 class="modal-title" id="modalLabel">Order Details For Cart #${cart[0].cartId}</h1>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div id="totalPrice${cart[0].cartId}">
                            
                                </div>
                                <div class="modal-body" id="cartItems">
                                    <table class="table table-striped">
                                        <tbody id="cartDetails${cart[0].cartId}">
                                        
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                $(`#cartDetails${cart[0].cartId}`).html("");
                cart.forEach(product => {
                    $(`#cartDetails${cart[0].cartId}`).append(`
                        <tr>
                            <td>
                                <div class="row">
                                    <div class="col-lg-4">
                                        <div class="row">
                                            <h3>${product.title}</h3>
                                        </div>
                                        <div class="row">
                                            <h4>${product.subcategory}</h4>
                                        </div>
                                        <div class="row">
                                            <h5>Price: $${Math.round(product.price * 100) / 100}</h5>
                                        </div>
                                    </div>
                                    <div class="col-lg-6">
                                        <h3>Description:</h3>
                                        <p>${product.description}</p>
                                    </div>
                                    <div class="col-lg-2">
                                        <div class="row">
                                            <h4>Quantity: ${product.quantity}</h4>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                                
                    `);
                    cartPrice += product.price * product.quantity;
                });
                $(`#totalPrice${cart[0].cartId}`).html(`
                    <div class="row">
                        <div class="col-lg">
                            <h3>Total Price: $${(Math.round(cartPrice * 100) / 100).toFixed(2)}</h3>
                        </div>
                    </div>`
                ); 
                $("#orders").append(`
                    <tr>
                        <td>
                            <form>
                                <div class="row">
                                    <div class="col-lg-2">
                                        <div class="row">
                                                <h3>Order #${cart[0].cartId}</h3>
                                        </div>
                                        <div class="row">
                                            <h5># of Items: ${getNumberOfItems(cart)}</h5>
                                        </div>
                                    </div>
                                    <div class="col-lg-3">
                                        <h4>Date: ${getDateOrTime(cart[0].closedDateTime, "date")}</h4>
                                    </div>
                                    <div class="col-lg-2">
                                        <h4>Time: ${getDateOrTime(cart[0].closedDateTime, "time")}</h4>
                                    </div>
                                    <div class="col-lg-3">
                                        <h4>Total Price: $${getCartPrice(cart)}</h4>
                                    </div>
                                    <div class="col-lg-2">
                                        <div class="row">
                                            <div class="col-lg">
                                                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#cart${cart[0].cartId}">View Order</button>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg">
                                                <button type="button" class="btn btn-secondary print-order-btn" onclick="printOrder(${cart[0].cartId})">Print Order</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </td>
                    </tr>`
                );
            });
        }
    }).fail(function(error) {
        console.log("Error: " + error);
    });
}

function getNumberOfItems(cart) {
    let num = 0;
    cart.forEach(item => {
        num += parseInt(item.quantity);
    });
    return num;
}

function getCartPrice(cart) {
    let price = 0;
    cart.forEach(item => {
        price += (parseFloat(item.price) * parseInt(item.quantity));
    });
    return (Math.round(price * 100) / 100).toFixed(2);
}

function getDateOrTime(inputDateString, formatType) {
    const date = new Date(inputDateString);

    if (formatType === 'date') {
        const months = [
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December"
        ];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
    } else if (formatType === 'time') {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }
}

function printOrder(cartId) {
    var cartDetailsHTML = $(`#cartDetails${cartId}`).clone()[0];
    var tmp = document.createElement("div");
    tmp.appendChild(cartDetailsHTML);
    var tableContents = tmp.innerHTML;
    var printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css"
                integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx"
                crossorigin="anonymous">
                <title>Print Order</title>
            </head>
            <body>
                <div class="container">
                    <h1>Order Details For Cart #${cartId}</h1>
                    <table class="table table-striped">
                        <div id="totalPrice${cartId}">
                        </div>
                        ${tableContents}
                    </table>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}
