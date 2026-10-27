"""AI チャットの提供地域の制御。

Gemini API 追加利用規約（https://ai.google.dev/gemini-api/terms）では、EEA・スイス・英国の
ユーザーに API クライアントを提供する場合は有料サービスのみ利用できるとされている。
本サイトは無料枠で運用しているため、これらの地域からのチャット利用を止める。

国の判定には、Vercel がクライアントの IP から付与する x-vercel-ip-country ヘッダー
（ISO 3166-1 alpha-2）を使う。ヘッダーがない場合（ローカル開発など）は制限しない。
"""

# EEA = EU 加盟 27 か国 + アイスランド・リヒテンシュタイン・ノルウェー
EU_COUNTRIES = frozenset(
    "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split()
)
EEA_COUNTRIES = EU_COUNTRIES | {"IS", "LI", "NO"}
RESTRICTED_COUNTRIES = EEA_COUNTRIES | {"CH", "GB"}

COUNTRY_HEADER = "x-vercel-ip-country"


def is_restricted(country: str | None) -> bool:
    return bool(country) and country.strip().upper() in RESTRICTED_COUNTRIES
