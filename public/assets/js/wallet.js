document.addEventListener("DOMContentLoaded", async () => {
  const sdk=window.smartdk; const auth=await sdk.requireAdmin(); if(!auth)return; const sb=sdk.getClient();
  async function load(){
    const [p,s]=await Promise.all([
      sb.from("payments").select("*").order("created_at",{ascending:false}).limit(100),
      sb.from("settlements").select("*").order("created_at",{ascending:false}).limit(100)
    ]);
    const payments=p.data||[], settlements=s.data||[];
    const gross=payments.filter(x=>x.status==="paid").reduce((a,x)=>a+Number(x.amount||0),0);
    const refund=payments.filter(x=>x.status==="refunded").reduce((a,x)=>a+Number(x.amount||0),0);
    const settled=settlements.reduce((a,x)=>a+Number(x.amount||0),0);
    const available=Math.max(0,gross-refund-settled);
    document.getElementById("wallet-gross").textContent=sdk.money(gross);
    document.getElementById("wallet-refund").textContent=sdk.money(refund);
    document.getElementById("wallet-settled").textContent=sdk.money(settled);
    document.getElementById("wallet-available").textContent=sdk.money(available);
    document.getElementById("wallet-payments").innerHTML=`<table><thead><tr><th>Date</th><th>Product</th><th>Amount</th><th>Status</th><th>Delivery</th><th>Provider ID</th></tr></thead><tbody>${payments.map(x=>`<tr><td>${new Date(x.created_at).toLocaleString("en-IN")}</td><td>${sdk.escapeHtml(x.product_id||"")}</td><td>${sdk.money(x.amount)}</td><td><span class="status ${sdk.escapeHtml(x.status||"")}">${sdk.escapeHtml(x.status||"")}</span></td><td>${x.shipping_address?`${sdk.escapeHtml(x.shipping_address.name||"")}<br><small>${sdk.escapeHtml(x.shipping_address.mobile||"")} • ${sdk.escapeHtml(x.shipping_address.pincode||"")}</small>`:"—"}</td><td>${sdk.escapeHtml(x.provider_payment_id||x.provider_qr_id||"")}</td></tr>`).join("")}</tbody></table>`;
    document.getElementById("settlement-list").innerHTML=settlements.map(x=>`<div><span><b>${sdk.money(x.amount)}</b><small>${sdk.escapeHtml(x.note||"Bank settlement")} • ${new Date(x.created_at).toLocaleString("en-IN")}</small></span></div>`).join("")||'<div>No settlement records.</div>';
  }
  document.getElementById("settlement-form").addEventListener("submit",async e=>{
    e.preventDefault();const amount=Number(document.getElementById("settle-amount").value||0);const note=document.getElementById("settle-note").value.trim();const msg=document.getElementById("settlement-msg");
    const {error}=await sb.from("settlements").insert({amount,note});
    if(error)msg.replaceChildren(sdk.notice(error.message,"error"));else{msg.replaceChildren(sdk.notice("Settlement recorded.","success"));e.target.reset();await load();}
  });
  await load();
});
