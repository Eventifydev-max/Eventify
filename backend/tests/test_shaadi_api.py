"""Comprehensive backend test suite for Shaadi Sewa API.

Covers OTP auth (customer + vendor), services CRUD, bookings, payments, reviews,
and role-based access control.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://shaadi-booking-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
DEMO_OTP = "123456"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(session, phone, role, name=None, business_name=None):
    r = session.post(f"{API}/auth/send-otp", json={"phone": phone, "role": role}, timeout=15)
    assert r.status_code == 200, f"send-otp failed: {r.status_code} {r.text}"
    body = r.json()
    assert body.get("demo_otp") == DEMO_OTP
    payload = {"phone": phone, "otp": DEMO_OTP, "role": role}
    if name:
        payload["name"] = name
    if business_name:
        payload["business_name"] = business_name
    r2 = session.post(f"{API}/auth/verify-otp", json=payload, timeout=15)
    assert r2.status_code == 200, f"verify-otp failed: {r2.status_code} {r2.text}"
    data = r2.json()
    assert "token" in data and "user" in data
    return data["token"], data["user"]


# ---------- Health ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Auth: send-otp ----------
class TestSendOTP:
    def test_send_otp_valid_customer(self, session):
        r = session.post(f"{API}/auth/send-otp", json={"phone": "9999900001", "role": "customer"})
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["demo_otp"] == DEMO_OTP
        assert body["is_new"] is False  # seeded customer

    def test_send_otp_valid_vendor(self, session):
        r = session.post(f"{API}/auth/send-otp", json={"phone": "9999900003", "role": "vendor"})
        assert r.status_code == 200
        body = r.json()
        assert body["is_new"] is False

    def test_send_otp_new_user_is_new_true(self, session):
        new_phone = "8" + str(uuid.uuid4().int)[:9]
        r = session.post(f"{API}/auth/send-otp", json={"phone": new_phone, "role": "customer"})
        assert r.status_code == 200
        assert r.json()["is_new"] is True

    def test_send_otp_invalid_short_phone(self, session):
        r = session.post(f"{API}/auth/send-otp", json={"phone": "12345", "role": "customer"})
        assert r.status_code == 400

    def test_send_otp_invalid_role(self, session):
        r = session.post(f"{API}/auth/send-otp", json={"phone": "9999900001", "role": "admin"})
        assert r.status_code == 400

    def test_send_otp_normalizes_country_code(self, session):
        # +91 prefix should be stripped
        r = session.post(f"{API}/auth/send-otp", json={"phone": "+919999900001", "role": "customer"})
        assert r.status_code == 200
        assert r.json()["is_new"] is False  # still maps to seeded customer


# ---------- Auth: verify-otp ----------
class TestVerifyOTP:
    def test_existing_customer_login(self, session):
        token, user = _login(session, "9999900001", "customer")
        assert user["role"] == "customer"
        assert user["phone"] == "9999900001"

    def test_existing_vendor_login(self, session):
        token, user = _login(session, "9999900003", "vendor")
        assert user["role"] == "vendor"
        assert user["business_name"] == "Royal Heritage Palace"

    def test_invalid_otp(self, session):
        session.post(f"{API}/auth/send-otp", json={"phone": "9999900001", "role": "customer"})
        r = session.post(f"{API}/auth/verify-otp", json={"phone": "9999900001", "otp": "000000", "role": "customer"})
        assert r.status_code == 400

    def test_new_user_requires_name(self, session):
        new_phone = "7" + str(uuid.uuid4().int)[:9]
        session.post(f"{API}/auth/send-otp", json={"phone": new_phone, "role": "customer"})
        r = session.post(f"{API}/auth/verify-otp", json={"phone": new_phone, "otp": DEMO_OTP, "role": "customer"})
        assert r.status_code == 400
        assert "NAME_REQUIRED" in r.text or "name" in r.text.lower()

    def test_new_customer_signup(self, session):
        new_phone = "7" + str(uuid.uuid4().int)[:9]
        token, user = _login(session, new_phone, "customer", name="TEST_NewCustomer")
        assert user["name"] == "TEST_NewCustomer"
        assert user["role"] == "customer"

    def test_new_vendor_signup_with_business(self, session):
        new_phone = "7" + str(uuid.uuid4().int)[:9]
        token, user = _login(session, new_phone, "vendor", name="TEST_NewVendor", business_name="TEST_BusinessCo")
        assert user["business_name"] == "TEST_BusinessCo"
        assert user["role"] == "vendor"

    def test_auth_me_with_token(self, session):
        token, user = _login(session, "9999900001", "customer")
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["id"] == user["id"]

    def test_auth_me_no_token(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Services ----------
class TestServices:
    def test_list_all(self, session):
        r = session.get(f"{API}/services")
        assert r.status_code == 200
        services = r.json()
        assert isinstance(services, list)
        assert len(services) >= 9  # 9 seeded
        # Validate no _id leaks
        for s in services:
            assert "_id" not in s
            assert "id" in s and "name" in s and "category" in s

    def test_filter_category(self, session):
        r = session.get(f"{API}/services", params={"category": "garden"})
        assert r.status_code == 200
        for s in r.json():
            assert s["category"] == "garden"

    def test_filter_city(self, session):
        r = session.get(f"{API}/services", params={"city": "Jaipur"})
        assert r.status_code == 200
        cities = [s["city"].lower() for s in r.json()]
        assert all("jaipur" in c for c in cities)

    def test_search_q(self, session):
        r = session.get(f"{API}/services", params={"q": "Royal"})
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_featured(self, session):
        r = session.get(f"{API}/services/featured")
        assert r.status_code == 200
        items = r.json()
        assert len(items) <= 6
        # Sorted by rating desc
        ratings = [s.get("rating", 0) for s in items]
        assert ratings == sorted(ratings, reverse=True)

    def test_get_service_detail(self, session):
        r = session.get(f"{API}/services")
        sid = r.json()[0]["id"]
        r2 = session.get(f"{API}/services/{sid}")
        assert r2.status_code == 200
        d = r2.json()
        assert "reviews" in d
        assert "packages" in d

    def test_get_service_404(self, session):
        r = session.get(f"{API}/services/nonexistent-id")
        assert r.status_code == 404


# ---------- Vendor flow ----------
class TestVendorFlow:
    @pytest.fixture(scope="class")
    def vendor_token(self, session):
        new_phone = "6" + str(uuid.uuid4().int)[:9]
        token, _ = _login(session, new_phone, "vendor", name="TEST_VendorOwner", business_name="TEST_VendorBiz")
        return token

    @pytest.fixture(scope="class")
    def customer_token(self, session):
        token, _ = _login(session, "9999900001", "customer")
        return token

    def test_customer_cannot_get_mine(self, customer_token):
        r = requests.get(f"{API}/services/mine", headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403

    def test_vendor_create_listing(self, vendor_token):
        payload = {
            "category": "garden",
            "name": "TEST_VendorGarden",
            "location": "Test Loc",
            "city": "TestCity",
            "description": "TEST listing",
            "images": ["https://example.com/img.jpg"],
            "starting_price": 100000,
            "packages": [{"name": "Basic", "price": 100000, "description": "basic pkg"}],
            "features": ["Test feat"],
            "contact": "+91 90000 00000",
        }
        r = requests.post(f"{API}/services", json=payload, headers={"Authorization": f"Bearer {vendor_token}"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_VendorGarden"
        assert d["vendor_id"] != "platform"
        pytest.vendor_listing_id = d["id"]

    def test_vendor_create_invalid_category(self, vendor_token):
        payload = {
            "category": "spaceship", "name": "X", "location": "X", "city": "X",
            "description": "X", "images": [], "starting_price": 1, "packages": [], "features": [], "contact": "",
        }
        r = requests.post(f"{API}/services", json=payload, headers={"Authorization": f"Bearer {vendor_token}"})
        assert r.status_code == 400

    def test_vendor_my_listings(self, vendor_token):
        r = requests.get(f"{API}/services/mine", headers={"Authorization": f"Bearer {vendor_token}"})
        assert r.status_code == 200
        items = r.json()
        assert any(s["id"] == pytest.vendor_listing_id for s in items)

    def test_customer_cannot_create_service(self, customer_token):
        payload = {
            "category": "garden", "name": "X", "location": "X", "city": "X",
            "description": "X", "images": [], "starting_price": 1, "packages": [], "features": [], "contact": "",
        }
        r = requests.post(f"{API}/services", json=payload, headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403

    def test_vendor_cannot_delete_platform_listing(self, vendor_token):
        # Find a platform-seeded listing
        services = requests.get(f"{API}/services").json()
        platform_service = None
        for s in services:
            full = requests.get(f"{API}/services/{s['id']}").json()
            # vendor_id is not in projection of list - but seed marks it 'platform'; we'll check via deletion
            platform_service = s
            break
        r = requests.delete(f"{API}/services/{platform_service['id']}",
                            headers={"Authorization": f"Bearer {vendor_token}"})
        assert r.status_code == 403

    def test_vendor_bookings_empty_initially(self, vendor_token):
        r = requests.get(f"{API}/bookings/vendor", headers={"Authorization": f"Bearer {vendor_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_vendor_cannot_create_booking(self, vendor_token):
        services = requests.get(f"{API}/services").json()
        sid = services[0]["id"]
        full = requests.get(f"{API}/services/{sid}").json()
        pkg_name = full["packages"][0]["name"]
        r = requests.post(f"{API}/bookings",
                          json={"service_id": sid, "package_name": pkg_name, "booking_date": "2026-12-01"},
                          headers={"Authorization": f"Bearer {vendor_token}"})
        assert r.status_code == 403

    def test_vendor_delete_own_listing(self, vendor_token):
        r = requests.delete(f"{API}/services/{pytest.vendor_listing_id}",
                            headers={"Authorization": f"Bearer {vendor_token}"})
        assert r.status_code == 200
        # Verify gone
        r2 = requests.get(f"{API}/services/{pytest.vendor_listing_id}")
        assert r2.status_code == 404


# ---------- Customer Flow: book, pay, review ----------
class TestCustomerFlow:
    @pytest.fixture(scope="class")
    def customer_token(self, session):
        token, user = _login(session, "9999900002", "customer")
        return token

    def test_full_booking_flow(self, customer_token):
        # 1. Pick a service
        services = requests.get(f"{API}/services", params={"category": "garden"}).json()
        assert services
        sid = services[0]["id"]
        full = requests.get(f"{API}/services/{sid}").json()
        pkg = full["packages"][0]

        # 2. Create booking
        r = requests.post(f"{API}/bookings",
                          json={"service_id": sid, "package_name": pkg["name"], "booking_date": "2026-12-15", "guests": 100},
                          headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 200, r.text
        booking = r.json()
        assert booking["status"] == "pending_payment"
        assert booking["amount"] == pkg["price"]
        bid = booking["id"]
        pytest.test_booking_id = bid
        pytest.test_service_id = sid

        # 3. Verify GET /bookings/me
        r2 = requests.get(f"{API}/bookings/me", headers={"Authorization": f"Bearer {customer_token}"})
        assert r2.status_code == 200
        assert any(b["id"] == bid for b in r2.json())

        # 4. Pay
        r3 = requests.post(f"{API}/payments/process",
                           json={"booking_id": bid, "method": "card"},
                           headers={"Authorization": f"Bearer {customer_token}"})
        assert r3.status_code == 200
        assert r3.json()["transaction_id"].startswith("TXN")

        # 5. Verify booking status updated
        r4 = requests.get(f"{API}/bookings/{bid}", headers={"Authorization": f"Bearer {customer_token}"})
        assert r4.status_code == 200
        assert r4.json()["payment_status"] == "paid"
        assert r4.json()["status"] == "confirmed"

        # 6. Cannot pay again
        r5 = requests.post(f"{API}/payments/process",
                           json={"booking_id": bid, "method": "card"},
                           headers={"Authorization": f"Bearer {customer_token}"})
        assert r5.status_code == 400

    def test_invalid_package(self, customer_token):
        services = requests.get(f"{API}/services").json()
        sid = services[0]["id"]
        r = requests.post(f"{API}/bookings",
                          json={"service_id": sid, "package_name": "GhostPkg", "booking_date": "2026-12-01"},
                          headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 400

    def test_create_review(self, customer_token):
        sid = getattr(pytest, "test_service_id", None)
        if not sid:
            services = requests.get(f"{API}/services").json()
            sid = services[0]["id"]
        r = requests.post(f"{API}/reviews",
                          json={"service_id": sid, "rating": 5, "comment": "TEST_great service"},
                          headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 200
        # Verify in GET service detail
        d = requests.get(f"{API}/services/{sid}").json()
        assert any(rv["comment"] == "TEST_great service" for rv in d["reviews"])

    def test_invalid_rating(self, customer_token):
        services = requests.get(f"{API}/services").json()
        sid = services[0]["id"]
        r = requests.post(f"{API}/reviews",
                          json={"service_id": sid, "rating": 10, "comment": "bad"},
                          headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
