import { NextResponse } from 'next/server';
import { s2t, safeError } from '@/lib/shop2topup';

export const dynamic = 'force-dynamic';

function listOf(body: any): any[] {
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.categories)) return body.categories;
  if (Array.isArray(body?.subcategories)) return body.subcategories;
  if (Array.isArray(body)) return body;
  return [];
}

export async function GET() {
  try {
    // Free Fire is big_category_id = 2. Prefer LATAM direct topup.
    const all = await s2t('/catalog/categories?for_ui=true');
    const categories = listOf(all);

    let c =
      categories.find((x: any) => /latam/i.test(String(x.name || '')) && /free\s*fire/i.test(String(x.big_category_name || ''))) ||
      categories.find((x: any) => /direct\s*topup\s*latam/i.test(String(x.name || ''))) ||
      categories.find((x: any) => /free\s*fire/i.test(String(x.name || ''))) ||
      categories.find((x: any) => /free\s*fire/i.test(String(x.big_category_name || '')) && /latam|brazil|brasil/i.test(String(x.name || '')));

    if (!c) {
      const byBig = await s2t('/catalog/categories?bigCategoryId=2&for_ui=true').catch(() => null);
      const bigList = byBig ? listOf(byBig) : [];
      c =
        bigList.find((x: any) => /latam/i.test(String(x.name || ''))) ||
        bigList.find((x: any) => /direct\s*topup/i.test(String(x.name || ''))) ||
        bigList[0];
    }

    if (!c) {
      return NextResponse.json(
        { error: 'Shop2TopUp no devuelve una categoría Free Fire para esta cuenta.' },
        { status: 404 }
      );
    }

    const categoryId = Number(c.id);
    const [pd, rd] = await Promise.all([
      s2t(`/catalog/subcategories?categoryId=${categoryId}`),
      s2t(`/catalog/category/${categoryId}/requirements`).catch(() => ({ data: [], requirements: [] })),
    ]);

    const raw = listOf(pd)
      .map((p: any) => ({
        id: Number(p.item_id ?? p.id),
        name: String(p.name ?? p.item_name ?? p.subcategory_name ?? 'Paquete Free Fire'),
        description: String(p.description || ''),
        productType: String(p.product_type || 'topup'),
        image: p.image_url || p.image || null,
        listPrice: p.price != null ? String(p.price) : '',
      }))
      .filter((p: any) => Number.isFinite(p.id) && p.id > 0 && p.productType === 'topup');

    const products = await Promise.all(
      raw.map(async (p: any) => {
        try {
          const q = await s2t(`/catalog/subcategory/${p.id}/price`);
          const unit = q?.unit_price ?? q?.price?.unit_price ?? p.listPrice ?? '';
          const currency = q?.currency ?? q?.price?.currency ?? 'USD';
          return { ...p, price: String(unit), currency: String(currency) };
        } catch {
          return { ...p, price: p.listPrice || '', currency: 'USD' };
        }
      })
    );

    const requirements = listOf(rd).length ? listOf(rd) : rd.requirements || [];

    return NextResponse.json(
      {
        success: true,
        category: { id: categoryId, name: c.name || 'Free Fire LATAM' },
        products,
        requirements,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    const x = safeError(e);
    return NextResponse.json(x, { status: x.status });
  }
}
