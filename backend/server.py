from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import os
import re
import uuid
import logging
import jwt

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 14
DEMO_OTP = "123456"  # Mock OTP for demo

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ========== Helpers ==========
def normalize_phone(phone: str) -> str:
    p = re.sub(r"\D", "", phone or "")
    # Strip leading +/91 country code if present, keep last 10 digits
    if len(p) > 10:
        p = p[-10:]
    return p

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_vendor(user=Depends(get_current_user)):
    if user.get("role") != "vendor":
        raise HTTPException(status_code=403, detail="Vendor access required")
    return user

# ========== Models ==========
class SendOTPRequest(BaseModel):
    phone: str
    role: str  # "customer" or "vendor"

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    role: str
    name: Optional[str] = None
    business_name: Optional[str] = None  # vendors

class Package(BaseModel):
    name: str
    price: int
    description: str

class ServiceCreate(BaseModel):
    category: str
    name: str
    location: str
    city: str
    description: str
    images: List[str]
    starting_price: int
    packages: List[Package] = []
    features: List[str] = []
    contact: str = ""

class BookingCreate(BaseModel):
    service_id: str
    package_name: str
    booking_date: str
    guests: Optional[int] = None
    notes: Optional[str] = None

class ReviewCreate(BaseModel):
    service_id: str
    rating: int
    comment: str

class PaymentRequest(BaseModel):
    booking_id: str
    method: str

# ========== Auth Endpoints ==========
@api_router.post("/auth/send-otp")
async def send_otp(payload: SendOTPRequest):
    phone = normalize_phone(payload.phone)
    if len(phone) != 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit phone number")
    if payload.role not in ("customer", "vendor"):
        raise HTTPException(status_code=400, detail="Invalid role")

    # Persist OTP request (overwriting any prior)
    await db.otps.update_one(
        {"phone": phone, "role": payload.role},
        {"$set": {
            "phone": phone,
            "role": payload.role,
            "otp": DEMO_OTP,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    existing = await db.users.find_one({"phone": phone, "role": payload.role}, {"_id": 0})
    return {
        "success": True,
        "is_new": existing is None,
        "demo_otp": DEMO_OTP,  # In production this would NOT be returned
        "message": f"OTP sent to +91 {phone}. (Demo OTP: {DEMO_OTP})",
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(payload: VerifyOTPRequest):
    phone = normalize_phone(payload.phone)
    if payload.role not in ("customer", "vendor"):
        raise HTTPException(status_code=400, detail="Invalid role")

    rec = await db.otps.find_one({"phone": phone, "role": payload.role})
    if not rec or rec["otp"] != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    user = await db.users.find_one({"phone": phone, "role": payload.role}, {"_id": 0})
    if not user:
        if not payload.name or not payload.name.strip():
            raise HTTPException(status_code=400, detail="NAME_REQUIRED")
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "name": payload.name.strip(),
            "phone": phone,
            "role": payload.role,
            "business_name": (payload.business_name or "").strip() if payload.role == "vendor" else "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
        user.pop("_id", None)

    # Cleanup OTP after success
    await db.otps.delete_many({"phone": phone, "role": payload.role})

    token = create_token(user["id"], user["role"])
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return user

# ========== Services Endpoints ==========
@api_router.get("/services")
async def list_services(category: Optional[str] = None, city: Optional[str] = None, q: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    services = await db.services.find(query, {"_id": 0}).to_list(200)
    return services

@api_router.get("/services/featured")
async def featured_services():
    services = await db.services.find({}, {"_id": 0}).sort("rating", -1).limit(6).to_list(6)
    return services

@api_router.get("/services/mine")
async def my_listings(vendor=Depends(require_vendor)):
    services = await db.services.find({"vendor_id": vendor["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return services

@api_router.get("/services/{service_id}")
async def get_service(service_id: str):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    reviews = await db.reviews.find({"service_id": service_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    service["reviews"] = reviews
    return service

@api_router.post("/services")
async def create_service(payload: ServiceCreate, vendor=Depends(require_vendor)):
    if payload.category not in ("garden", "pandit", "videographer"):
        raise HTTPException(status_code=400, detail="Invalid category")
    sid = str(uuid.uuid4())
    doc = payload.model_dump()
    doc.update({
        "id": sid,
        "vendor_id": vendor["id"],
        "vendor_name": vendor.get("business_name") or vendor.get("name", ""),
        "rating": 0.0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.services.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.patch("/services/{service_id}")
async def update_service(service_id: str, payload: ServiceCreate, vendor=Depends(require_vendor)):
    existing = await db.services.find_one({"id": service_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    if existing.get("vendor_id") != vendor["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    update = payload.model_dump()
    await db.services.update_one({"id": service_id}, {"$set": update})
    updated = await db.services.find_one({"id": service_id}, {"_id": 0})
    return updated

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, vendor=Depends(require_vendor)):
    existing = await db.services.find_one({"id": service_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    if existing.get("vendor_id") != vendor["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.services.delete_one({"id": service_id})
    return {"success": True}

# ========== Booking Endpoints ==========
@api_router.post("/bookings")
async def create_booking(payload: BookingCreate, user=Depends(get_current_user)):
    if user.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Only customers can book services")
    service = await db.services.find_one({"id": payload.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    pkg = next((p for p in service.get("packages", []) if p["name"] == payload.package_name), None)
    if not pkg:
        raise HTTPException(status_code=400, detail="Invalid package")
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_phone": user.get("phone", ""),
        "service_id": payload.service_id,
        "service_name": service["name"],
        "service_category": service["category"],
        "service_image": service["images"][0] if service.get("images") else "",
        "vendor_id": service.get("vendor_id", ""),
        "package_name": pkg["name"],
        "amount": pkg["price"],
        "booking_date": payload.booking_date,
        "guests": payload.guests,
        "notes": payload.notes or "",
        "status": "pending_payment",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookings.insert_one(booking_doc)
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.get("/bookings/me")
async def my_bookings(user=Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@api_router.get("/bookings/vendor")
async def vendor_bookings(vendor=Depends(require_vendor)):
    bookings = await db.bookings.find({"vendor_id": vendor["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user=Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    # Customer can see own; vendor can see if it's their service
    if user["role"] == "customer" and booking["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user["role"] == "vendor" and booking.get("vendor_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return booking

# ========== Payment (Mock) ==========
@api_router.post("/payments/process")
async def process_payment(payload: PaymentRequest, user=Depends(get_current_user)):
    if user.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Only customers can pay")
    booking = await db.bookings.find_one({"id": payload.booking_id, "user_id": user["id"]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Already paid")
    txn_id = "TXN" + uuid.uuid4().hex[:12].upper()
    await db.bookings.update_one(
        {"id": payload.booking_id},
        {"$set": {
            "payment_status": "paid",
            "status": "confirmed",
            "payment_method": payload.method,
            "transaction_id": txn_id,
            "paid_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"success": True, "transaction_id": txn_id, "amount": booking["amount"]}

# ========== Reviews ==========
@api_router.post("/reviews")
async def create_review(payload: ReviewCreate, user=Depends(get_current_user)):
    if user.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Only customers can review")
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    service = await db.services.find_one({"id": payload.service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    review_id = str(uuid.uuid4())
    review = {
        "id": review_id,
        "service_id": payload.service_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "rating": payload.rating,
        "comment": payload.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(review)
    # Incremental weighted average to preserve seeded baselines
    prev_count = service.get("review_count", 0) or 0
    prev_rating = service.get("rating", 0) or 0
    new_count = prev_count + 1
    new_rating = ((prev_rating * prev_count) + payload.rating) / new_count
    await db.services.update_one(
        {"id": payload.service_id},
        {"$set": {"rating": round(new_rating, 1), "review_count": new_count}},
    )
    review.pop("_id", None)
    return review

@api_router.get("/reviews/{service_id}")
async def get_reviews(service_id: str):
    reviews = await db.reviews.find({"service_id": service_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

# ========== Health ==========
@api_router.get("/")
async def root():
    return {"message": "Shaadi Sewa API", "status": "ok"}

# ========== Seed Data ==========
SEED_SERVICES = [
    {"category": "garden", "name": "Royal Heritage Palace", "location": "Jaipur, Rajasthan", "city": "Jaipur",
     "description": "A majestic heritage venue with sprawling gardens, perfect for grand Indian weddings. Features mughal-inspired architecture, lush lawns, and elegant banquet halls.",
     "images": ["https://images.unsplash.com/photo-1767050248590-98007e69d969?crop=entropy&cs=srgb&fm=jpg&q=85", "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=85", "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=85"],
     "starting_price": 250000, "rating": 4.8, "review_count": 124,
     "packages": [{"name": "Silver", "price": 250000, "description": "Up to 200 guests, decoration, basic catering"}, {"name": "Gold", "price": 450000, "description": "Up to 400 guests, premium decor, full catering, DJ"}, {"name": "Platinum", "price": 750000, "description": "Up to 700 guests, luxury decor, multi-cuisine, photography"}],
     "features": ["Outdoor Garden", "Banquet Hall", "Parking 200+", "Bridal Room", "Catering Available"], "contact": "+91 98765 43210"},
    {"category": "garden", "name": "Greenfield Resort & Spa", "location": "Gurgaon, Haryana", "city": "Gurgaon",
     "description": "Luxurious 5-star resort with manicured lawns and crystal-clear pools. Ideal for destination weddings.",
     "images": ["https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=85", "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=85"],
     "starting_price": 350000, "rating": 4.7, "review_count": 89,
     "packages": [{"name": "Classic", "price": 350000, "description": "150 guests, day function, decor"}, {"name": "Premium", "price": 600000, "description": "300 guests, 2-day event, accommodation"}],
     "features": ["Swimming Pool", "Spa", "Accommodation 50 rooms", "Lawn", "Indoor Hall"], "contact": "+91 98123 45678"},
    {"category": "garden", "name": "Lakeview Banquet Gardens", "location": "Udaipur, Rajasthan", "city": "Udaipur",
     "description": "Stunning lakefront venue offering breathtaking views and royal ambiance for your special day.",
     "images": ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=85", "https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?w=800&q=85"],
     "starting_price": 400000, "rating": 4.9, "review_count": 156,
     "packages": [{"name": "Royal", "price": 400000, "description": "Lakefront ceremony, 250 guests"}, {"name": "Imperial", "price": 850000, "description": "Multi-day event, 500 guests, boat baraat"}],
     "features": ["Lake View", "Heritage Decor", "Boat Service", "Bridal Suite"], "contact": "+91 90011 22334"},
    {"category": "pandit", "name": "Pandit Ramesh Sharma", "location": "Varanasi, UP", "city": "Varanasi",
     "description": "Veda-pathi pandit with 25+ years of experience. Specializes in traditional Hindu wedding ceremonies, all rituals performed as per shastras.",
     "images": ["https://images.unsplash.com/photo-1759674889222-22ea8f9d33e2?crop=entropy&cs=srgb&fm=jpg&q=85", "https://images.unsplash.com/photo-1604608672516-f1b9b1eb8ba9?w=800&q=85"],
     "starting_price": 11000, "rating": 4.9, "review_count": 230,
     "packages": [{"name": "Basic Vivah", "price": 11000, "description": "Phere ceremony, 4 hours"}, {"name": "Complete Vivah", "price": 21000, "description": "All wedding rituals, full day"}, {"name": "Grand Vivah", "price": 35000, "description": "All rituals + Haldi + Mehendi pooja"}],
     "features": ["25+ Years Experience", "Vedic Scholar", "Hindi/Sanskrit/English", "Pan-India Service"], "contact": "+91 99887 76655"},
    {"category": "pandit", "name": "Acharya Devendra Joshi", "location": "Mathura, UP", "city": "Mathura",
     "description": "Renowned acharya specializing in Brahmin weddings, kundli matching, and muhurat selection. Available across India.",
     "images": ["https://images.unsplash.com/photo-1604608672516-f1b9b1eb8ba9?w=800&q=85"],
     "starting_price": 15000, "rating": 4.8, "review_count": 178,
     "packages": [{"name": "Standard", "price": 15000, "description": "Wedding ceremony with phere"}, {"name": "Premium", "price": 25000, "description": "Wedding + Kundli + Muhurat"}],
     "features": ["Kundli Matching", "Muhurat Specialist", "20+ Years Exp"], "contact": "+91 98765 12345"},
    {"category": "pandit", "name": "Pandit Suresh Trivedi", "location": "Mumbai, Maharashtra", "city": "Mumbai",
     "description": "Marathi & North Indian style weddings. Friendly, punctual, and explains all rituals in simple language.",
     "images": ["https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=85"],
     "starting_price": 12000, "rating": 4.7, "review_count": 95,
     "packages": [{"name": "Traditional", "price": 12000, "description": "Standard wedding rituals"}, {"name": "Combined", "price": 22000, "description": "Wedding + reception pooja"}],
     "features": ["Multi-language", "Modern Approach", "All Samagri Provided"], "contact": "+91 98202 33445"},
    {"category": "videographer", "name": "Frame Stories Productions", "location": "Delhi NCR", "city": "Delhi",
     "description": "Award-winning cinematic wedding films. Cinematic 4K shoots, drone, candid photography. Featured in Vogue Wedding.",
     "images": ["https://images.pexels.com/photos/29261299/pexels-photo-29261299.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=85"],
     "starting_price": 75000, "rating": 4.9, "review_count": 187,
     "packages": [{"name": "Essential", "price": 75000, "description": "1 day, 1 photographer, 1 videographer, edited reel"}, {"name": "Cinematic", "price": 150000, "description": "2 days, 2+2 crew, drone, cinematic film"}, {"name": "Royal", "price": 300000, "description": "Full event coverage, multiple cameras, same-day edit"}],
     "features": ["4K Cinematic", "Drone Shoots", "Same Day Edit", "Pre-wedding Shoot"], "contact": "+91 98991 12233"},
    {"category": "videographer", "name": "Eternal Moments Studio", "location": "Bangalore, Karnataka", "city": "Bangalore",
     "description": "Candid moments captured beautifully. South Indian and North Indian wedding specialists with 10+ years experience.",
     "images": ["https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=85"],
     "starting_price": 60000, "rating": 4.7, "review_count": 142,
     "packages": [{"name": "Capture", "price": 60000, "description": "Photography only, 1 day"}, {"name": "Memoir", "price": 110000, "description": "Photo + Video, 1 day, album"}, {"name": "Saga", "price": 220000, "description": "Multi-day, full team, album + reels"}],
     "features": ["Candid Photography", "Album Design", "Reels & Edits"], "contact": "+91 90192 88776"},
    {"category": "videographer", "name": "Lens Tale Studios", "location": "Pune, Maharashtra", "city": "Pune",
     "description": "Boutique wedding film studio. We tell your love story through cinematic frames and elegant compositions.",
     "images": ["https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?w=800&q=85"],
     "starting_price": 85000, "rating": 4.8, "review_count": 76,
     "packages": [{"name": "Story", "price": 85000, "description": "Wedding day full coverage"}, {"name": "Saga", "price": 165000, "description": "Engagement + Wedding"}],
     "features": ["Cinematic Films", "Aerial Drone", "Pre-wedding"], "contact": "+91 90012 88990"},
]

async def seed_data():
    count = await db.services.count_documents({})
    if count == 0:
        for s in SEED_SERVICES:
            doc = {**s, "id": str(uuid.uuid4()), "vendor_id": "platform", "vendor_name": "Shaadi Sewa Curated", "created_at": datetime.now(timezone.utc).isoformat()}
            await db.services.insert_one(doc)
        logger.info(f"Seeded {len(SEED_SERVICES)} services")
    # Seed demo customer & vendor (preset users for OTP demo)
    for u in [
        {"name": "Demo Customer", "phone": "9999900001", "role": "customer", "business_name": ""},
        {"name": "Riya Kapoor", "phone": "9999900002", "role": "customer", "business_name": ""},
        {"name": "Royal Heritage Owner", "phone": "9999900003", "role": "vendor", "business_name": "Royal Heritage Palace"},
    ]:
        if not await db.users.find_one({"phone": u["phone"], "role": u["role"]}):
            await db.users.insert_one({
                "id": str(uuid.uuid4()), **u,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    await db.users.create_index([("phone", 1), ("role", 1)], unique=True)

@app.on_event("startup")
async def startup():
    await seed_data()

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
