const { requireAdmin, audit } = require("./_lib/admin");
const { enforceOrigin, enforceRateLimit, requireCsrf } = require("./_lib/security");

const PRODUCT_FIELDS = ["name","slug","description","price_inr","category","images","available_sizes","active"];
const ORDER_STATUSES = new Set(["pending","paid","processing","shipped","delivered","cancelled"]);

function cleanProductPatch(input) {
  const out = {};
  for (const key of PRODUCT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input || {}, key)) out[key] = input[key];
  }
  if ("price_inr" in out) out.price_inr = Number(out.price_inr);
  if ("name" in out) out.name = String(out.name).trim().slice(0, 160);
  if ("slug" in out) out.slug = String(out.slug).trim().toLowerCase().slice(0, 180);
  if ("description" in out) out.description = String(out.description || "").trim().slice(0, 2000);
  if ("category" in out) out.category = String(out.category || "").trim().slice(0, 80);
  if ("active" in out) out.active = Boolean(out.active);
  if ("images" in out && !Array.isArray(out.images)) throw new Error("images must be an array.");
  if ("available_sizes" in out && !Array.isArray(out.available_sizes)) throw new Error("available_sizes must be an array.");
  if ("price_inr" in out && (!Number.isInteger(out.price_inr) || out.price_inr < 0)) throw new Error("Invalid price.");
  if (!Object.keys(out).length) throw new Error("No supported product fields supplied.");
  return out;
}

module.exports = async function handler(req, res) {
  if (!["GET","PATCH"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  if (!enforceOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, "admin", req.method === "GET" ? 60 : 30, 60_000)) return;

  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { db, user } = auth;

    if (req.method === "GET") {
      const [products, variants, orders, stats] = await Promise.all([
        db.from("products").select("id,slug,name,description,price_inr,category,images,available_sizes,active,created_at").order("created_at",{ascending:false}),
        db.from("product_variants").select("id,product_id,size,stock").order("size",{ascending:true}),
        db.from("orders").select("id,user_id,customer_email,customer_name,phone,shipping_address,city,state,pincode,status,total_inr,inventory_reserved,created_at").order("created_at",{ascending:false}).limit(100),
        db.from("orders").select("total_inr,status,created_at")
      ]);
      for (const x of [products,variants,orders,stats]) if (x.error) throw x.error;
      const revenue = (stats.data || []).filter(o => ["paid","processing","shipped","delivered"].includes(o.status)).reduce((s,o)=>s+Number(o.total_inr||0),0);
      return res.status(200).json({
        stats:{products:products.data?.length||0, activeProducts:(products.data||[]).filter(p=>p.active).length, orders:stats.data?.length||0, revenueInr:revenue},
        products:products.data||[], variants:variants.data||[], orders:orders.data||[]
      });
    }

    if (!requireCsrf(req, res)) return;
    const body = req.body || {};
    const type = String(body.type || "");

    if (type === "product") {
      const patch = cleanProductPatch(body.patch);
      const { data, error } = await db.from("products").update(patch).eq("id",String(body.id)).select("id,slug,name,description,price_inr,category,images,available_sizes,active,created_at").single();
      if (error) throw error;
      await audit(db,user.id,"update","product",data.id,{fields:Object.keys(patch)});
      return res.status(200).json({ product:data });
    }

    if (type === "variant") {
      const stock = Number(body.stock);
      if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return res.status(400).json({error:"Invalid stock."});
      const { data, error } = await db.from("product_variants").update({stock}).eq("id",String(body.id)).select("id,product_id,size,stock").single();
      if (error) throw error;
      await audit(db,user.id,"update","variant",data.id,{stock});
      return res.status(200).json({ variant:data });
    }

    if (type === "order") {
      const status = String(body.status || "");
      if (!ORDER_STATUSES.has(status)) return res.status(400).json({error:"Invalid order status."});
      const { data, error } = await db.from("orders").update({status}).eq("id",String(body.id)).select("id,status,total_inr").single();
      if (error) throw error;
      await audit(db,user.id,"update","order",data.id,{status});
      return res.status(200).json({ order:data });
    }

    return res.status(400).json({ error: "Unsupported admin operation." });
  } catch (error) {
    return res.status(500).json({ error: "Admin operation failed." });
  }
};
