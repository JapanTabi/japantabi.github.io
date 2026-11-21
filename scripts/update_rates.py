#!/usr/bin/env python3
"""每日更新日幣匯率數據 -> public/data/exchange_rate.json

資料來源：
1. 主來源：Frankfurter API (開源、基於歐洲央行 ECB 官方匯率，免 API Key)
2. 備援：open.er-api.com (免 API Key)

只使用 Python 標準函式庫，無需安裝任何第三方套件。
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data", "exchange_rate.json")

def fetch_rates():
    # 嘗試主要來源: Frankfurter
    try:
        url = "https://api.frankfurter.dev/v1/latest?base=JPY&symbols=TWD,HKD,USD,EUR,CNY"
        req = urllib.request.Request(url, headers={"User-Agent": "japan-tabi-report-bot/1.0"})
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.load(res)
            rates = data.get("rates", {})
            if "TWD" in rates:
                return {
                    "base": "JPY",
                    "updated_at": datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S"),
                    "date": data.get("date"),
                    "source": "European Central Bank (via Frankfurter)",
                    "rates": {
                        "TWD": round(rates.get("TWD", 0), 4),
                        "HKD": round(rates.get("HKD", 0), 4),
                        "USD": round(rates.get("USD", 0), 5),
                        "EUR": round(rates.get("EUR", 0), 5),
                        "CNY": round(rates.get("CNY", 0), 4)
                    },
                    "jpy_per_unit": {
                        "TWD": round(1 / rates["TWD"], 2) if rates.get("TWD") else 0,
                        "HKD": round(1 / rates["HKD"], 2) if rates.get("HKD") else 0,
                        "USD": round(1 / rates["USD"], 2) if rates.get("USD") else 0,
                    }
                }
    except Exception as e:
        print(f"Frankfurter API error: {e}, trying fallback...", file=sys.stderr)

    # 備用來源: open.er-api.com
    try:
        url = "https://open.er-api.com/v6/latest/JPY"
        req = urllib.request.Request(url, headers={"User-Agent": "japan-tabi-report-bot/1.0"})
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.load(res)
            rates = data.get("rates", {})
            return {
                "base": "JPY",
                "updated_at": datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S"),
                "date": datetime.now(JST).strftime("%Y-%m-%d"),
                "source": "ExchangeRate-API Open",
                "rates": {
                    "TWD": round(rates.get("TWD", 0), 4),
                    "HKD": round(rates.get("HKD", 0), 4),
                    "USD": round(rates.get("USD", 0), 5),
                    "EUR": round(rates.get("EUR", 0), 5),
                    "CNY": round(rates.get("CNY", 0), 4)
                },
                "jpy_per_unit": {
                    "TWD": round(1 / rates["TWD"], 2) if rates.get("TWD") else 0,
                    "HKD": round(1 / rates["HKD"], 2) if rates.get("HKD") else 0,
                    "USD": round(1 / rates["USD"], 2) if rates.get("USD") else 0,
                }
            }
    except Exception as e:
        print(f"Fallback API error: {e}", file=sys.stderr)
        raise RuntimeError("無法獲取最新匯率資料")

def main():
    rate_data = fetch_rates()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rate_data, f, ensure_ascii=False, indent=2)
    print(f"成功更新匯率資料 -> {OUT}")
    print(json.dumps(rate_data, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
