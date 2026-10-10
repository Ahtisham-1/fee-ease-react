import smtplib
from email.message import EmailMessage

from app.security import generate_otp

msg = EmailMessage()
msg.set_content(generate_otp())

msg["Subject"] = "Your OTP verification code"
