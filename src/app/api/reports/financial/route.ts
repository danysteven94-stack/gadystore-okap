import { NextRequest, NextResponse } from "next/server";
import { userOwnsBusiness } from "@/lib/shop";
import ExcelJS from "exceljs";
import { redis, hgetallMany } from "@/lib/upstash";
import { eachDate, validateRange } from "@/lib/date-range";
import { verifySession } from "@/lib/auth";
import type { Expense, Sale } from "@/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (businessId && !(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }
  const from = req.nextUrl.searchParams.get("from"); // YYYY-MM-DD
  const to = req.nextUrl.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const format = req.nextUrl.searchParams.get("format") ?? "json"; // json | excel

  if (!businessId || !from) {
    return NextResponse.json(
      { error: "businessId ak from (dat depa) obligatwa." },
      { status: 400 }
    );
  }

  const rangeError = validateRange(from, to);
  if (rangeError) return NextResponse.json({ error: rangeError }, { status: 400 });

  const rows: {
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[] = [];

  // Tout lis yo nan YON sèl demann (pipeline), epi tout hash yo nan yon lòt — pa 4 demann pa jou.
  const dates = eachDate(from, to);
  const listPipe = redis.pipeline();
  for (const date of dates) {
    listPipe.lrange(`business:${businessId}:sales:${date}`, 0, -1);
    listPipe.lrange(`business:${businessId}:expenses:${date}`, 0, -1);
  }
  const lists = (await listPipe.exec()) as string[][];
  const saleIdsByDay = dates.map((_, i) => lists[i * 2] ?? []);
  const expenseIdsByDay = dates.map((_, i) => lists[i * 2 + 1] ?? []);

  const [saleRecs, expenseRecs] = await Promise.all([
    hgetallMany<Sale>(saleIdsByDay.flat().map((id) => `sale:${id}`)),
    hgetallMany<Expense>(expenseIdsByDay.flat().map((id) => `expense:${id}`)),
  ]);

  let si = 0;
  let ei = 0;
  dates.forEach((date, d) => {
    let revenue = 0;
    for (let k = 0; k < saleIdsByDay[d].length; k++) revenue += Number(saleRecs[si++]?.total) || 0;
    let expenses = 0;
    for (let k = 0; k < expenseIdsByDay[d].length; k++) expenses += Number(expenseRecs[ei++]?.amount) || 0;
    rows.push({ date, revenue, expenses, profit: revenue - expenses });
  });

  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expenses: acc.expenses + r.expenses,
      profit: acc.profit + r.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 }
  );

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rapò Finansye");
    sheet.columns = [
      { header: "Dat", key: "date", width: 14 },
      { header: "Revni", key: "revenue", width: 16 },
      { header: "Depans", key: "expenses", width: 16 },
      { header: "Pwofi", key: "profit", width: 16 },
    ];
    sheet.addRows([...rows, { date: "TOTAL", ...totals }]);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(sheet.rowCount).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rapo-finansye-${from}-${to}.xlsx"`,
      },
    });
  }

  return NextResponse.json({ rows, totals });
}
