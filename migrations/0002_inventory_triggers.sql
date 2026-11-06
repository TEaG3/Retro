-- Keep stock changes atomic with order item insertion.
CREATE TRIGGER IF NOT EXISTS order_items_check_stock
BEFORE INSERT ON order_items
WHEN NEW.product_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN (SELECT stock_quantity FROM products WHERE id = NEW.product_id) IS NULL
      OR (SELECT stock_quantity FROM products WHERE id = NEW.product_id) < NEW.quantity
    THEN RAISE(ABORT, 'INSUFFICIENT_STOCK')
  END;
END;

CREATE TRIGGER IF NOT EXISTS order_items_decrease_stock
AFTER INSERT ON order_items
WHEN NEW.product_id IS NOT NULL
BEGIN
  UPDATE products SET stock_quantity = stock_quantity - NEW.quantity, updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;
END;

CREATE TRIGGER IF NOT EXISTS cancelled_order_restore_stock
AFTER UPDATE OF status ON orders
WHEN OLD.status <> 'cancelled' AND NEW.status = 'cancelled'
BEGIN
  UPDATE products
     SET stock_quantity = stock_quantity + (
       SELECT COALESCE(SUM(quantity),0) FROM order_items
       WHERE order_id = NEW.id AND product_id = products.id
     ),
     updated_at = CURRENT_TIMESTAMP
   WHERE id IN (SELECT product_id FROM order_items WHERE order_id = NEW.id AND product_id IS NOT NULL);
END;
