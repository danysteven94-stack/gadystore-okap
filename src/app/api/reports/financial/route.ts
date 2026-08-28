import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Expense, Sale } from "@/types";

function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  const from = req.nextUrl.searchParams.get("from"); // YYYY-MM-DD
  const to = req.nextUrl.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const format = req.nextUrl.searchParams.get("format") ?? "json"; // json | excel

  if (!businessId || !from) {
    return NextResponse.json(
      { error: "businessId ak from (dat depa) obligatwa." },
      { status: 400 }
    );
  }

  const rows: {
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[] = [];

  for (const date of eachDate(from, to)) {
    const saleIds = await redis.lrange(`business:${businessId}:sales:${date}`, 0, -1);
    const sales = saleIds.length
      ? await Promise.all(saleIds.map((id) => redis.hgetall<Sale>(`sale:${id}`)))
      : [];
    const revenue = sales.reduce((sum, s) => sum + (s?.total ?? 0), 0);

    const expenseIds = await redis.lrange(
      `business:${businessId}:expenses:${date}`,
      0,
      -1
    );
    const expenseRecords = expenseIds.length
      ? await Promise.all(expenseIds.map((id) => redis.hgetall<Expense>(`expense:${id}`)))
      : [];
    const expenses = expenseRecords.reduce((sum, e) => sum + (e?.amount ?? 0), 0);

    rows.push({ date, revenue, expenses, profit: revenue - expenses });
  }

  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expenses: acc.expenses + r.expenses,
      profit: acc.profit + r.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 }
  );

  if (format === "excel") {
    const worksheet = XLSX.utils.json_to_sheet(
      [...rows, { date: "TOTAL", ...totals }].map((r) => ({
        Dat: r.date,
        Revni: r.revenue,
        Depans: r.expenses,
        Pwofi: r.profit,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapò Finansye");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rapo-finansye-${from}-${to}.xlsx"`,
      },
    });
  }

  return NextResponse.json({ rows, totals });
}
