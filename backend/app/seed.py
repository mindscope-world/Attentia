"""Idempotent development seed: packages, an admin, a demo participant and demo campaigns.

    python -m app.seed
"""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select

import app.models  # noqa: F401
from app.core.config import settings
from app.core.db import SyncSessionLocal
from app.core.security import hash_password
from app.modules.campaigns.models import Campaign, CampaignStatus
from app.modules.packages.models import Package, Subscription, SubscriptionStatus
from app.modules.users.models import KycStatus, Role, User

PACKAGES = [
    dict(code="starter", name="Starter", price=Decimal("25"), daily_quota=15, min_withdrawal=Decimal("10"),
         withdrawal_fee_pct=Decimal("0.02"), sort_order=1, description="Entry-level daily task quota"),
    dict(code="growth", name="Growth", price=Decimal("100"), daily_quota=30, min_withdrawal=Decimal("25"),
         withdrawal_fee_pct=Decimal("0.015"), sort_order=2, description="Higher daily task quota"),
    dict(code="pro", name="Pro", price=Decimal("500"), daily_quota=60, min_withdrawal=Decimal("50"),
         withdrawal_fee_pct=Decimal("0.01"), sort_order=3, description="Premium daily task quota"),
]

DEMO_CAMPAIGNS = [
    ("Lumio X2 Smartphone Launch", "Lumio Mobile (Demo)", "Technology",
     "A fictional smartphone with an all-day battery and a 50MP night camera.",
     "How clearly did the ad present the phone's key features?",
     "Which feature did the ad emphasise most?",
     ["Night-mode camera", "Wireless earbuds", "Smartwatch pairing"], "Night-mode camera"),
    ("PayNest Instant Transfers", "PayNest (Demo)", "Financial Services",
     "A fictional mobile wallet promoting free instant transfers between friends.",
     "How trustworthy did the brand appear?",
     "What does PayNest offer?",
     ["Free instant transfers", "Car insurance", "Grocery delivery"], "Free instant transfers"),
    ("Brightleaf Iced Tea Summer", "Brightleaf (Demo)", "Consumer Goods",
     "A fictional iced-tea brand's summer refreshment spot.",
     "How appealing was the product presentation?",
     "Would you consider buying this drink?",
     ["Yes", "Maybe", "No"], None),
    ("SkyLink 5G Home Bundles", "SkyLink Telecom (Demo)", "Telecommunications",
     "A fictional network operator advertising 5G home internet bundles.",
     "Was the pricing communicated clearly?",
     "What service is being advertised?",
     ["Home 5G internet", "Satellite TV", "Landline phones"], "Home 5G internet"),
    ("CartWave Weekend Sale", "CartWave (Demo)", "E-commerce",
     "A fictional online marketplace announcing a weekend sale.",
     "How engaging was the advertisement?",
     "What is CartWave promoting?",
     ["A weekend sale", "A new credit card", "A travel package"], "A weekend sale"),
    ("LearnLoop Coding Courses", "LearnLoop (Demo)", "Education",
     "A fictional online learning platform's beginner coding track.",
     "Did the ad communicate its intended message?",
     "Who is the course aimed at?",
     ["Beginners", "Senior engineers", "Children under 5"], "Beginners"),
]


def run() -> None:
    with SyncSessionLocal() as s:
        for p in PACKAGES:
            if not s.scalar(select(Package.id).where(Package.code == p["code"])):
                s.add(Package(**p))
        s.flush()

        def ensure_user(email, username, password, role, kyc):
            u = s.scalar(select(User).where(User.email == email))
            if u is None:
                u = User(email=email, username=username, password_hash=hash_password(password), role=role,
                         kyc_status=kyc, full_name=username.title())
                s.add(u)
                s.flush()
            return u

        if not settings.is_dev:
            # Production: packages only, plus an admin when real credentials are supplied.
            if settings.seed_admin_password != "qwerty1life" and len(settings.seed_admin_password) >= 12:
                ensure_user(settings.seed_admin_email, settings.seed_admin_username,
                            settings.seed_admin_password, Role.admin, KycStatus.verified)
            s.commit()
            print("Seed complete (production: packages/admin only).")
            return

        ensure_user(settings.seed_admin_email, settings.seed_admin_username, settings.seed_admin_password,
                    Role.admin, KycStatus.verified)
        participant = ensure_user("demo@attentia.dev", "demo", "demo-password", Role.participant, KycStatus.verified)
        ensure_user("advertiser@attentia.dev", "advertiser", "advertiser-password", Role.advertiser, KycStatus.verified)

        # Give the demo participant an active Growth package.
        growth = s.scalar(select(Package).where(Package.code == "growth"))
        if not s.scalar(select(Subscription.id).where(Subscription.user_id == participant.id)):
            now = datetime.now(UTC)
            s.add(Subscription(user_id=participant.id, package_id=growth.id, status=SubscriptionStatus.active,
                               activated_at=now, expires_at=now + timedelta(days=growth.duration_days)))

        for name, brand, cat, desc, rating, question, options, correct in DEMO_CAMPAIGNS:
            if s.scalar(select(Campaign.id).where(Campaign.name == name)):
                continue
            s.add(Campaign(
                name=name, brand=brand, category=cat, description=desc, objective="Demonstration campaign",
                is_demo=True, status=CampaignStatus.active, reward_rate=Decimal("0.50"),
                budget_total=Decimal("1000"), budget_spent=Decimal("0"), daily_interaction_limit=1000,
                min_watch_pct=0.9, display_seconds=15, rating_prompt=rating, question=question,
                options=options, correct_option=correct, targeting={},
            ))
        s.commit()
    print("Seed complete.")


if __name__ == "__main__":
    run()
