import os

SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console")


def send_otp_sms(phone: str, otp: str) -> None:
    if SMS_PROVIDER == "console":
        send_with_console(phone, otp)
    else:
        raise RuntimeError("SMS provider is not configured")


def send_with_console(phone: str, otp: str) -> None:
    print(f"OTP for {phone}:{otp}")
