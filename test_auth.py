import os
import sys
import uuid

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import create_user, verify_user

test_user = f"tester_{uuid.uuid4().hex[:6]}"
test_pass = "securepass123"

print("--- Testing Auth Flow ---")
res1 = create_user(test_user, test_pass)
print(f"1. Create User (Expected: True): {res1}")

res2 = create_user(test_user, test_pass)
print(f"2. Create Duplicate (Expected: False): {res2}")

res3 = verify_user(test_user, "wrongpassword")
print(f"3. Verify Bad Pass (Expected: False): {res3}")

res4 = verify_user(test_user, test_pass)
print(f"4. Verify Good Pass (Expected: True): {res4}")
print("-------------------------")
