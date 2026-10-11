import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()

SENDER_EMAIL = os.getenv("SMTP_EMAIL")
SENDER_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_otp_email(recipient_email: str, otp: str):
    msg = EmailMessage()

    msg["Subject"] = "Your FeeEase Verification Code"
    msg["From"] = SENDER_EMAIL
    msg["To"] = recipient_email
    msg.set_content(f"Your OTP Code is {otp}. It expires in 5 minutes")
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        raise ValueError("Email credentials are not set in environment variables.")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
