const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: "Your bag is empty." });

  try {
    const db = getSupabaseAdmin();
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    let userId = null;
    let customerEmail = req.body?.customer_email || null;

    if (token) {
      const auth = await db.auth.getUser(token);
      if (auth.data?.user) {
        userId = auth.data.user.id;
        customerEmail = auth.data.user.email || customerEmail;
      }
    }

    customerEmail = String(customerEmail || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const shipping = req.body?.shipping_address;
    if (!shipping || !shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.state || !shipping.pincode) {
      return res.status(400).json({ error: "Complete shipping details are required." });
    }
    if (!/^\d{10}$/.test(String(shipping.phone)) || !/^\d{6}$/.test(String(shipping.pincode))) {
      return res.status(400).json({ error: "Enter a valid phone number and PIN code." });
    }

    const ids = [...new Set(items.map(x => x.product_id).filter(Boolean))];
    const { data: products, error } = await db.from("products")
      .select("id,name,price_inr,active")
      .in("id", ids)
      .eq("active", true);
    if (error) throw error;

    const byId = new Map((products || []).map(p => [p.id, p]));
    const { data: variants, error: variantError } = await db.from("product_variants")
      .select("product_id,size,stock")
      .in("product_id", ids);
    if (variantError) throw variantError;

    const variantMap = new Map((variants || []).map(v => [`${v.product_id}:${v.size}`, v]));
    const normalized = items.map(x => {
      const p = byId.get(x.product_id);
      const qty = Number(x.quantity);
      const size = String(x.size || "");
      if (!p || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error("Invalid cart item.");
      const variant = variantMap.get(`${p.id}:${size}`);
      if (!variant || variant.stock < qty) throw new Error(`${p.name} is unavailable in size ${size || "selected"}.`);
      return { product_id: p.id, name: p.name, size, quantity: qty, unit_price_inr: Number(p.price_inr) };
    });

    const amount = normalized.reduce((sum, x) => sum + x.unit_price_inr * x.quantity, 0);
    if (amount <= 0) throw new Error("Invalid order amount.");

    const { data: dbOrder, error: orderError } = await db.from("orders").insert({
      user_id: userId,
      customer_email: customerEmail,
      customer_name: String(shipping.name).trim(),
      phone: String(shipping.phone).trim(),
      shipping_address: String(shipping.address).trim(),
      city: String(shipping.city).trim(),
      state: String(shipping.state).trim(),
      pincode: String(shipping.pincode).trim(),
      status: "pending",
      payment_provider: "demo",
      total_inr: amount,
      inventory_reserved: false,
      reservation_expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
    }).select("id").single();
    if (orderError) throw orderError;

    const { error: itemsError } = await db.from("order_items").insert(normalized.map(x => ({
      order_id: dbOrder.id,
      product_id: x.product_id,
      size: x.size,
      quantity: x.quantity,
      unit_price_inr: x.unit_price_inr
    })));

    if (itemsError) {
      await db.from("orders").delete().eq("id", dbOrder.id);
      throw itemsError;
    }

    const { error: reserveError } = await db.rpc("reserve_order_inventory", { p_order_id: dbOrder.id });
    if (reserveError) {
      await db.from("orders").delete().eq("id", dbOrder.id);
      throw new Error("One or more items went out of stock. Please refresh your bag and try again.");
    }

    const { error: paidError } = await db.from("orders").update({
      status: "paid",
      payment_provider: "demo"
    }).eq("id", dbOrder.id);

    if (paidError) {
      await db.rpc("release_order_inventory", { p_order_id: dbOrder.id });
      await db.from("orders").update({ status: "failed", inventory_reserved: false }).eq("id", dbOrder.id);
      throw paidError;
    }

    return res.status(200).json({
      orderId: dbOrder.id,
      localOrderId: dbOrder.id,
      amount,
      currency: "INR",
      demo: true
    });
  } catch (error) {
    const message = String(error?.message || "");
    const clientSafe =
      /^(Your bag is empty|Invalid cart item|Invalid order amount|Complete shipping details|Enter a valid phone|One or more items went out of stock|A valid email address)/.test(message) ||
      / is unavailable in size /.test(message);

    return res.status(clientSafe ? 400 : 503).json({
      error: clientSafe ? message : "Checkout service is temporarily unavailable."
    });
  }
};
