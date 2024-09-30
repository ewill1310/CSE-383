<?php 
class final_rest
{

	/**
	 * @api  /api/v1/setTemp/
	 * @apiName setTemp
	 * @apiDescription Add remote temperature measurement
	 *
	 * @apiParam {string} location
	 * @apiParam {String} sensor
	 * @apiParam {double} value
	 *
	 * @apiSuccess {Integer} status
	 * @apiSuccess {string} message
	 *
	 * @apiSuccessExample Success-Response:
	 *     HTTP/1.1 200 OK
	 *     {
	 *              "status":0,
	 *              "message": ""
	 *     }
	 *
	 * @apiError Invalid data types
	 *
	 * @apiErrorExample Error-Response:
	 *     HTTP/1.1 200 OK
	 *     {
	 *              "status":1,
	 *              "message":"Error Message"
	 *     }
	 *
	 */
	public static function setTemp ($location, $sensor, $value)

	{
		if (!is_numeric($value)) {
			$retData["status"]=1;
			$retData["message"]="'$value' is not numeric";
		}
		else {
			try {
				EXEC_SQL("insert into temperature (location, sensor, value, date) values (?,?,?,CURRENT_TIMESTAMP)",$location, $sensor, $value);
				$retData["status"]=0;
				$retData["message"]="insert of '$value' for location: '$location' and sensor '$sensor' accepted";
			}
			catch  (Exception $e) {
				$retData["status"]=1;
				$retData["message"]=$e->getMessage();
			}
		}

		return json_encode ($retData);
	}

	public static function getProduct ($category, $subcategory, $id, $minPrice, $maxPrice, $sortBy) {
		try {
			$retData["result"] = GET_SQL("SELECT * FROM product WHERE category LIKE ? AND subcategory LIKE ? AND (product_id = ? OR ? = '0') AND price >= ? AND price <= ?", 
				$category,$subcategory,$id,$id,$minPrice,$maxPrice);

			if ($sortBy === "price") {
				$retData["result"] = GET_SQL("SELECT * FROM product WHERE category LIKE ? AND subcategory LIKE ? AND (product_id = ? OR ? = '0') AND price >= ? AND price <= ? ORDER BY price", 
				$category,$subcategory,$id,$id,$minPrice,$maxPrice);
			} else if ($sortBy === "price DESC") {
				$retData["result"] = GET_SQL("SELECT * FROM product WHERE category LIKE ? AND subcategory LIKE ? AND (product_id = ? OR ? = '0') AND price >= ? AND price <= ? ORDER BY price DESC", 
				$category,$subcategory,$id,$id,$minPrice,$maxPrice);
			} else if  ($sortBy === "subcategory") {
				$retData["result"] = GET_SQL("SELECT * FROM product WHERE category LIKE ? AND subcategory LIKE ? AND (product_id = ? OR ? = '0') AND price >= ? AND price <= ? ORDER BY subcategory", 
				$category,$subcategory,$id,$id,$minPrice,$maxPrice);
			}
			$retData["status"]=0;
			$retData["message"]="Selected from product with category: '$category', subcategory: '$subcategory', id: '$id',
			minimum price: $minPrice, maximum price: $maxPrice, order by $sortBy";
		}
		catch  (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}

		return json_encode ($retData);
	}

	public static function getProductCategories() {
		try {
			$retData["result"] = GET_SQL("SELECT DISTINCT subcategory FROM product");
			$retData["status"]=0;
			$retData["message"]="Selected product categories.";
		}
		catch  (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}

		return json_encode ($retData);
	}

	public static function getCurrentShoppingCart() {
		try {
			$retData["result"] = GET_SQL("SELECT cartId FROM shoppingCart WHERE closedDateTime IS NULL");
			$retData["status"]=0;
			$retData["message"]="Selected current cart.";
		}
		catch  (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}

		return json_encode ($retData);
	}

	public static function createShoppingCart() {
		try {
			EXEC_SQL("INSERT INTO shoppingCart (closedDateTime) VALUES (NULL)");
			$retData["result"] = GET_SQL("SELECT last_insert_rowid()");
			$retData["status"]=0;
			$retData["message"]="Shopping cart successfully created!";
		}
		catch  (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		
		return json_encode ($retData);
	}

	public static function addItemsToCart($cartId, $productId, $quantity) {
		try {
			$CART = GET_SQL("SELECT cartId FROM shoppingCart WHERE cartId = ? AND closedDateTime IS NULL", $cartId);

			if (count($CART) > 0) {
				$ITEM = GET_SQL("SELECT * FROM cartItems WHERE cartId = ? AND product_id = ?", $cartId,$productId);
				if (count($ITEM) > 0) {
					$retData["result"] = EXEC_SQL("UPDATE cartItems set quantity = quantity + ? WHERE cartId = ? AND product_id = ?",$quantity,$cartId,$productId);
					$retdata["found"] = 0;
					$newQuantity["qty"] = GET_SQL("SELECT quantity FROM cartItems WHERE cartId = ? AND product_id = ?",$cartId,$productId);
					$newQtyNum = $newQuantity["qty"][0]["quantity"];
					$retData["message"]="Quantity of product #$productId set to $newQtyNum.";
				} else {
					$retData["result"] = EXEC_SQL("INSERT INTO cartItems (quantity,cartId,product_id) VALUES (?,?,?)",$quantity,$cartId,$productId);
					$retdata["found"] = 0;
					// $retData["message"]="$quantity Product(s) with ID = $productId added to cart #$cartId";
					$retData["message"]="$quantity Product(s) added to cart #$cartId";
				}
			}  else {
				$retdata["found"] = 1;
				$retData["message"] = "Cart not found or not available";
			}
		}
		catch (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		
		return json_encode ($retData);
	}

	public static function removeItemFromCart($cartId, $productId, $amount) {
		try {
			$found = GET_SQL("SELECT cartId FROM shoppingCart JOIN cartItems USING (cartId) WHERE shoppingCart.cartId = ? AND product_id = ? AND shoppingCart.closedDateTime IS NULL", $cartId,$productId);
			if (count($found) > 0) {	
				$currentAmount["amt"] = GET_SQL("SELECT quantity FROM cartItems WHERE cartId = ? AND product_id = ?",$cartId,$productId);
				$currAmtNum = intval($currentAmount["amt"][0]["quantity"]);
				 
				if ($amount < $currAmtNum) {
					$newAmount = $currAmtNum - $amount;
					EXEC_SQL("UPDATE cartItems SET quantity = ? WHERE cartId = ? AND product_id = ?", $newAmount,$cartId,$productId);
					$retData["message"]="Quantity of product #$productId in cart #$cartId set to $newAmount";
				} else {
					EXEC_SQL("DELETE FROM cartItems WHERE cartId = ? AND product_id = ? LIMIT ?",$cartId,$productId,$amount);
					$retData["message"]="Product #$productId from cart #$cartId removed.";
				}

				$retData["found"] = 0;
			} else {
				$retData["found"] = 1;
				$retData["message"] = "Not found";
			}
		} catch (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		
		return json_encode ($retData);
	}

	public static function getCartItems($cartId) {
		try {
			$retData["result"] = GET_SQL("SELECT * FROM shoppingCart JOIN cartItems USING (cartId) JOIN product USING (product_id) WHERE shoppingCart.cartId = ? AND shoppingCart.closedDateTime IS NULL ORDER BY category,subcategory,title", $cartId);
			$retdata["found"] = 0;
			$retData["message"] = "Returned all items in cart#$cartId";	
		} catch (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		return json_encode ($retData);
	}

	public static function getCartPrice($cartId) {
		try {
			$retData["result"] = GET_SQL("SELECT SUM(product.price * cartItems.quantity) AS total_price FROM shoppingCart JOIN cartItems USING (cartId) JOIN product USING (product_id) WHERE shoppingCart.cartId = ? AND shoppingCart.closedDateTime IS NULL	GROUP BY shoppingCart.cartId", $cartId);
			$retdata["found"] = 0;
			$retData["message"] = "Returned the total price of cart#$cartId";	
		} catch (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		return json_encode ($retData);
	}

	public static function getClosedCartItems($cartId) {
		try {
			$retData["result"] = GET_SQL("SELECT * FROM shoppingCart JOIN cartItems USING (cartId) JOIN product USING (product_id) WHERE shoppingCart.cartId = ? AND shoppingCart.closedDateTime IS NOT NULL ORDER BY category,subcategory,title", $cartId);
			$retdata["found"] = 0;
			$retData["message"] = "Returned all items in cart#$cartId";	
		} catch (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		return json_encode ($retData);
	}

	public static function makeSale($cartId) {
		try {
			$CART = GET_SQL("SELECT cartId FROM shoppingCart WHERE cartId  = ? AND closedDateTime IS NULL", $cartId);
			if (count($CART) > 0) {	
				EXEC_SQL("UPDATE shoppingCart SET closedDateTime = CURRENT_TIMESTAMP WHERE cartId = ?", $cartId);
				$retdata["found"] = 0;
				$retData["message"]= "Sale completed! Closed cart #$cartId";
			} else {
				$retdata["found"] = 1;
				$retData["message"] = "Cart not found or not available";
			}
		} catch (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		return json_encode ($retData);
	}

	public static function findClosedCarts($minDate, $maxDate, $maxOrders) {
		try {
			$carts["carts"] = GET_SQL("SELECT * FROM shoppingCart WHERE closedDateTime IS NOT NULL AND closedDateTime >= ? AND closedDateTime <= ? ORDER BY closedDateTime DESC LIMIT ?",$minDate,$maxDate,$maxOrders);
	
			$retData["carts"] = [];
			foreach ($carts["carts"] as $cart) {
				$cartId = intval($cart["cartId"]);
				array_push($retData["carts"], GET_SQL("SELECT * FROM shoppingCart JOIN cartItems USING (cartId) JOIN product USING (product_id) WHERE shoppingCart.cartId = ? AND shoppingCart.closedDateTime IS NOT NULL ORDER BY category,subcategory,title", $cartId));
			}
		} catch (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		

		return json_encode ($retData);
	}
}
