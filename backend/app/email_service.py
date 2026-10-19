import json
import os

# import smtplib
# from email.message import EmailMessage
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv

load_dotenv()

# SENDER_EMAIL = os.getenv("SMTP_EMAIL")
# SENDER_PASSWORD = os.getenv("SMTP_PASSWORD")

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME")


def send_otp_email(recipient_email: str, otp: str):
    if not BREVO_API_KEY:
        raise ValueError("BREVO_API_KEY is not configured")

    if not BREVO_SENDER_EMAIL:
        raise ValueError("BREVO_SENDER_EMAIL is not configured")

    payload = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": recipient_email}],
        "subject": "Your FeeEase verification Code",
        "textContent": f"Your OTP code is {otp}. It expires in 5 minutes",
    }

    request = Request(
        url="https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(
                    f"Brevo returned an unexpected status: {response.status}"
                )
    except HTTPError as error:
        raise RuntimeError(
            f"Brevo rejected the email request with status {error.code}"
        ) from error
    except URLError as error:
        raise RuntimeError(
            "FeeEase could not reach the Brevo email service."
        ) from error

    # msg = EmailMessage()
    # msg["Subject"] = "Your FeeEase Verification Code"
    # msg["From"] = SENDER_EMAIL
    # msg["To"] = recipient_email
    # msg.set_content(f"Your OTP Code is {otp}. It expires in 5 minutes")
    # if not SENDER_EMAIL or not SENDER_PASSWORD:
    #     raise ValueError("Email credentials are not set in environment variables.")
    # with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
    #     server.login(SENDER_EMAIL, SENDER_PASSWORD)
    #     server.send_message(msg)
