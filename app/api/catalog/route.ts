import { NextResponse } from 'next/server';
import { s2t, safeError } from '@/lib/shop2topup';
export const dynamic = 'force-dynamic';
export async function GET() { try {
 const d=await s2t('/catalog/categories?bigCategoryId=1&for_ui=true'); let c=(d.categories||[]).find((x:any)=>/free\s*fire/i.test(String(x.name)));
 if(!c){const all=await s2t('/catalog/categories?for_ui=true');c=(all.categories||[]).find((x:any)=>/free\s*fire/i.test(String(x.name)));}
 if(!c)return NextResponse.json({error:'Shop2TopUp no devuelve una categoría Free Fire para esta cuenta.'},{status:404});
 const [pd,rd]=await Promise.all([s2t(`/catalog/subcategories?categoryId=${c.id}`),s2t(`/catalog/category/${c.id}/requirements`).catch(()=>({requirements:[]}))]);
 const raw=(pd.subcategories||[]).map((p:any)=>({id:Number(p.item_id??p.id),name:String(p.name??p.item_name??p.subcategory_name??'Paquete Free Fire'),description:String(p.description||''),productType:String(p.product_type||'topup'),image:p.image_url||p.image||null})).filter((p:any)=>Number.isFinite(p.id)&&p.id>0&&p.productType==='topup');
 const products=await Promise.all(raw.map(async (p:any)=>{try{const q=await s2t(`/catalog/subcategory/${p.id}/price`);return {...p,price:String(q.price?.unit_price??''),currency:String(q.price?.currency??'USD')}}catch{return {...p,price:'',currency:'USD'}}}));
 return NextResponse.json({success:true,category:{id:Number(c.id),name:c.name},products,requirements:rd.requirements||[]},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const x=safeError(e);return NextResponse.json(x,{status:x.status});}}
