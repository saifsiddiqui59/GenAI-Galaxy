#!/usr/bin/env python3
"""Render an Azure Cost Management *read-only* query.

Never uses credentials itself. In CHECK mode it must not reveal cost amounts
because this Galaxy repository and its GitHub Actions logs are public.
"""
import argparse
import datetime as dt
import json
import re
from collections import defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path


def safe_label(value):
    return re.sub(r"[^A-Za-z0-9 ._()/+-]", "_", str(value))[:90] or "(unknown)"


def interpret(result):
    props = result.get("properties")
    if not isinstance(props, dict):
        raise ValueError("Azure did not return query properties")
    if props.get("nextLink"):
        raise ValueError("Azure cost response is paginated; refusing to show incomplete totals")
    cols = props.get("columns")
    rows = props.get("rows")
    if not isinstance(cols, list) or not isinstance(rows, list):
        raise ValueError("Azure cost response lacks columns or rows")
    names = [str(col.get("name", "")).lower() for col in cols]
    price_col = next((names.index(name) for name in ("totalcost", "pretaxcost", "cost") if name in names), None)
    currency_col = names.index("currency") if "currency" in names else None
    service_col = names.index("servicename") if "servicename" in names else None
    if rows and (price_col is None or currency_col is None or service_col is None):
        raise ValueError("Azure cost response lacks expected cost/currency/service columns")
    totals = defaultdict(Decimal)
    services = defaultdict(Decimal)
    for row in rows:
        if not isinstance(row, list) or len(row) != len(names):
            raise ValueError("Malformed Azure cost row")
        try:
            cost = Decimal(str(row[price_col]))
            if not cost.is_finite():
                raise ValueError("Non-finite cost")
        except (InvalidOperation, TypeError, ValueError) as err:
            raise ValueError("Invalid Azure cost amount") from err
        currency = safe_label(row[currency_col])
        service = safe_label(row[service_col])
        totals[currency] += cost
        services[(currency, service)] += cost
    return totals, services, len(rows)


def format_amount(value):
    return f"{value:,.4f}"


def make_summary(totals, services, row_count):
    lines = [
        "## GenAI-Galaxy: Azure cost to date",
        "",
        "Scope: resource group `GenAI_Galaxy` only, current UTC month. "
        "Azure ActualCost is usage-based and may lag; not an invoice or a spending cap.",
        "",
    ]
    if not row_count:
        lines += ["No rows returned. This **does not confirm a zero bill**.", ""]
    else:
        lines += ["### Total by billing currency", "", "| Currency | Month-to-date amount |", "|---|---:|"]
        lines += [f"| {currency} | {format_amount(amount)} |" for currency, amount in sorted(totals.items())]
        lines += ["", "### Cost by Azure service", "", "| Currency | Service | Amount |", "|---|---|---:|"]
        lines += [f"| {currency} | {name} | {format_amount(amount)} |"
                  for (currency, name), amount in sorted(services.items(),
                          key=lambda item: (item[0][0], -item[1], item[0][1]))]
    lines += ["", f"Queried at {dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}.",
              "", "**Privacy:** This report appears in a PUBLIC GitHub Actions run. "
              "Do not run REPORT_PUBLIC if costs must remain confidential.", ""]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--mode", choices=("CHECK", "REPORT_PUBLIC"), required=True)
    parser.add_argument("--summary", required=True)
    args = parser.parse_args()
    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    totals, services, count = interpret(data)
    if args.mode == "CHECK":
        message = ("Azure Cost Management API: AUTHORIZED (read-only). "
                   "Monetary amounts intentionally withheld from public logs.")
        print(message)
        Path(args.summary).write_text("## Galaxy Azure cost query check\n\n" + message + "\n", encoding="utf-8")
        return
    report = make_summary(totals, services, count)
    print(report)
    Path(args.summary).write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
