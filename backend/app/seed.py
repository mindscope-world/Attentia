"""Idempotent development seed: packages, an admin, a demo participant and demo campaigns.

    python -m app.seed
"""

import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import or_, select

import app.models  # noqa: F401
from app.core.config import settings
from app.core.db import SyncSessionLocal
from app.core.security import hash_password
from app.modules.assets.models import Asset, AssetKind, AssetStatus
from app.modules.campaigns.defaults import DEFAULT_DISPLAY_SECONDS, DEFAULT_MIN_WATCH_PCT
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

# Demonstration content. Every creative is an embeddable YouTube video; campaigns are flagged
# is_demo so the dashboard labels them. Eight real commercials span the proposal's industries,
# plus the Blender open movies (freely licensed) that the dashboard used to hardcode.
# (youtube_id, duration_seconds, name, brand, category, description, rating_prompt, question, options, correct)
GENERIC_Q = ("Did this ad clearly show what it was promoting?", ["Yes", "Somewhat", "No"], None)

DEMO_ADS = [
    ("Ksc1tbL0v6s", 26, "OPPO Find X10 Series", "OPPO", "Technology",
     "A smartphone launch spot for the OPPO Find X10 series, focused on capturing everyday moments.",
     "How appealing was the way the phone was presented?", *GENERIC_Q),
    ("h918IJI8bYE", 31, "Westlake Financial Services TV Commercial", "Westlake Financial Services", "Financial Services",
     "A 30-second television spot for an auto-finance and lending provider.",
     "How trustworthy did the brand appear?", *GENERIC_Q),
    ("IgohaHCWs8k", 29, "air up: We Made A Steel Bottle", "air up", "Consumer Goods",
     "A short product film introducing a reusable steel drinking bottle.",
     "How appealing was the product presentation?", *GENERIC_Q),
    ("R2T16C_vZ1Q", 31, "Cox Communications: Only Cox, Stay Connected", "Cox Communications", "Telecommunications",
     "A television spot for home internet and connectivity services.",
     "Was the offer communicated clearly?", *GENERIC_Q),
    ("gfXvXI4wIU8", 31, "DHL Express E-commerce: Keep up with the clicks", "DHL Express", "E-commerce",
     "A spot about fast delivery for online retailers and their customers.",
     "How engaging was the advertisement?", *GENERIC_Q),
    ("gmxldaReQ1Y", 31, "Armstrong's College of Education", "Armstrong's College of Education", "Education",
     "A television spot promoting teacher-education programmes.",
     "Did the ad communicate its intended message?", *GENERIC_Q),
    ("Vg0PLXPj6ek", 31, "AutoZone: Your Car is Everything", "AutoZone", "Automotive",
     "A television spot for car parts and maintenance advice.",
     "How memorable was the advertisement?", *GENERIC_Q),
    ("vk5lhLgJLFY", 30, "Tourism Australia: Come and say G'day", "Tourism Australia", "Travel",
     "A 30-second destination spot inviting travellers to visit Australia.",
     "How much did the ad make you want to visit?", *GENERIC_Q),
    # Blender open movies: short films with a comprehension question
    ("aqz-KE-bpKQ", 596, "Big Buck Bunny: Official Blender Short Film", "Blender", "Entertainment & Media",
     "Blender Foundation's open-movie short: a giant, gentle rabbit wakes in a sunny meadow and later turns the tables on three rodents who bully the forest's creatures.",
     "How well did the opening scenes set the mood of the story?",
     "Who is the main character of Big Buck Bunny?",
     ["A large, good-natured rabbit", "A baby dragon", "A secret agent"], "A large, good-natured rabbit"),
    ("eRsGyueVLvQ", 888, "Sintel: Open Movie by the Blender Foundation", "Blender", "Entertainment & Media",
     "A fantasy short about Sintel, a lone young woman crossing snowy mountains and dangerous lands in search of the baby dragon she raised.",
     "How engaging was the opening of Sintel?",
     "What is Sintel searching for?",
     ["Her baby dragon", "A lost llama", "A hidden barbershop"], "Her baby dragon"),
    ("R6MlUcmOul8", 734, "Tears of Steel: Blender VFX Open Movie", "Blender", "Entertainment & Media",
     "A live-action sci-fi short shot in Amsterdam, where scientists and warriors try to save the world from destructive robots, combining real footage with Blender visual effects.",
     "How convincing were the visual effects in Tears of Steel?",
     "What kind of film is Tears of Steel?",
     ["Live-action sci-fi with visual effects", "A hand-drawn cartoon", "A nature documentary"],
     "Live-action sci-fi with visual effects"),
    ("TLkA0RELQ1g", 654, "Elephants Dream: The First Blender Open Movie", "Blender", "Entertainment & Media",
     "The Blender Foundation's first open movie (2006): Proog guides the young Emo through a strange, surreal world of machines and endless rooms.",
     "How striking did you find the surreal world of Elephants Dream?",
     "Where does Elephants Dream take place?",
     ["A surreal mechanical world", "A snowy mountain village", "Modern-day Amsterdam"], "A surreal mechanical world"),
    ("WhWc3b3KhnY", 464, "Spring: Blender Open Movie", "Blender Studio", "Entertainment & Media",
     "Blender Studio's short about a shepherd girl and her dog who face ancient spirits in order to continue the cycle of life.",
     "How beautiful did you find the animation in Spring?",
     "Who are the main characters of Spring?",
     ["A shepherd girl and her dog", "Two llamas", "A rabbit and three rodents"], "A shepherd girl and her dog"),
    ("mN0zPOpADL4", 218, "Agent 327: Operation Barbershop", "Blender Studio", "Entertainment & Media",
     "An animated spy-action teaser from Blender Studio, based on the classic Dutch comics: Agent 327 goes undercover in a barbershop that hides a secret.",
     "How exciting was the action in Agent 327?",
     "Where does Agent 327 go undercover?",
     ["A barbershop", "A space station", "A farm in Patagonia"], "A barbershop"),
    ("SkVqJ1SGeL0", 150, "Caminandes 3: Llamigos", "Blender", "Entertainment & Media",
     "Koro the llama returns in a comedy short set in Patagonia, competing with a mischievous penguin over a tree full of berries.",
     "How funny did you find Caminandes 3: Llamigos?",
     "Which animal competes with Koro the llama?",
     ["A penguin", "A dragon", "An elephant"], "A penguin"),
    ("Z4C82eyhwgU", 146, "Caminandes 2: Gran Dillama", "Blender", "Entertainment & Media",
     "In this Blender comedy short, Koro the llama tries everything to get past an electric fence to the greener grass on the other side.",
     "How entertaining was Koro's struggle with the fence?",
     "What stands in Koro's way in Gran Dillama?",
     ["An electric fence", "A raging river", "A locked door"], "An electric fence"),
]

# Earlier seeds created these fictional-brand campaigns without any video. They are retired
# (paused) in favour of the YouTube demo ads above so there is a single source of demo content.
LEGACY_DEMO_NAMES = [
    "Lumio X2 Smartphone Launch", "PayNest Instant Transfers", "Brightleaf Iced Tea Summer",
    "SkyLink 5G Home Bundles", "CartWave Weekend Sale", "LearnLoop Coding Courses",
]


def run() -> None:
    with SyncSessionLocal() as s:
        for p in PACKAGES:
            if not s.scalar(select(Package.id).where(Package.code == p["code"])):
                s.add(Package(**p))
        s.flush()

        def ensure_user(email, username, password, role, kyc, sync_password=False):
            u = s.scalar(select(User).where(or_(User.email == email, User.username == username)))
            if u is not None and sync_password:
                # An explicitly configured admin password always wins over the stored one.
                u.password_hash = hash_password(password)
                u.is_active = True
                u.banned_at = None
                u.ban_reason = None
            if u is None:
                u = User(email=email, username=username, password_hash=hash_password(password), role=role,
                         kyc_status=kyc, full_name=username.title())
                s.add(u)
                s.flush()
            return u

        if not settings.is_dev:
            # Production: packages only, plus an admin when real credentials are supplied.
            if len(settings.seed_admin_password) >= 12:
                ensure_user(settings.seed_admin_email, settings.seed_admin_username,
                            settings.seed_admin_password, Role.admin, KycStatus.verified, sync_password=True)
            s.commit()
            print("Seed complete (production: packages/admin only).")
            return

        admin_password = settings.seed_admin_password
        admin_exists = s.scalar(select(User.id).where(
            or_(User.email == settings.seed_admin_email, User.username == settings.seed_admin_username)))
        if not admin_password and not admin_exists:
            admin_password = secrets.token_urlsafe(12)
            print(f"Generated dev admin password for {settings.seed_admin_email}: {admin_password}")
        if admin_password:
            ensure_user(settings.seed_admin_email, settings.seed_admin_username, admin_password,
                        Role.admin, KycStatus.verified, sync_password=bool(settings.seed_admin_password))
        participant = ensure_user("demo@attentia.dev", "demo", "demo-password", Role.participant, KycStatus.verified)
        ensure_user("advertiser@attentia.dev", "advertiser", "advertiser-password", Role.advertiser, KycStatus.verified)

        # Give the demo participant an active Growth package.
        growth = s.scalar(select(Package).where(Package.code == "growth"))
        if not s.scalar(select(Subscription.id).where(Subscription.user_id == participant.id)):
            now = datetime.now(UTC)
            s.add(Subscription(user_id=participant.id, package_id=growth.id, status=SubscriptionStatus.active,
                               activated_at=now, expires_at=now + timedelta(days=growth.duration_days)))

        for c in s.scalars(select(Campaign).where(Campaign.name.in_(LEGACY_DEMO_NAMES), Campaign.asset_id.is_(None),
                                                  Campaign.status == CampaignStatus.active)):
            c.status = CampaignStatus.paused

        for yt_id, seconds, name, brand, cat, desc, rating, question, options, correct in DEMO_ADS:
            if s.scalar(select(Campaign.id).where(Campaign.name == name)):
                continue
            asset = s.scalar(select(Asset).where(Asset.kind == AssetKind.youtube, Asset.youtube_id == yt_id))
            if asset is None:
                asset = Asset(kind=AssetKind.youtube, status=AssetStatus.ready, original_key="", youtube_id=yt_id,
                              title=name, duration_seconds=float(seconds))
                s.add(asset)
                s.flush()
            s.add(Campaign(
                name=name, brand=brand, category=cat, description=desc, objective="Demonstration campaign",
                asset_id=asset.id, is_demo=True, status=CampaignStatus.active, reward_rate=Decimal("0.50"),
                budget_total=Decimal("1000"), budget_spent=Decimal("0"), daily_interaction_limit=1000,
                min_watch_pct=DEFAULT_MIN_WATCH_PCT, display_seconds=DEFAULT_DISPLAY_SECONDS, rating_prompt=rating,
                question=question, options=options, correct_option=correct, targeting={},
            ))
        s.commit()
    print("Seed complete.")


if __name__ == "__main__":
    run()
