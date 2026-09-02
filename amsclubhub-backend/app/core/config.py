from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	PROJECT_NAME: str = "AmsClubHub Backend"
	API_V1_STR: str = "/api/v1"
	SECRET_KEY: str
	ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

	# Database
	DATABASE_URL: str
	REDIS_URL: str

	model_config = SettingsConfigDict(
	env_file=".env",
	env_file_encoding="utf-8",
	case_sensitive=True,
	extra="ignore"
	)

	# SMTP Config
	SMTP_HOST: str = "smtp.gmail.com"
	SMTP_PORT: int = 587
	SMTP_USER: str = "hadung29112009@gmail.com"
	SMTP_PASSWORD: str = ""
	EMAILS_FROM_NAME: str = "AmsClubHub"
	# Brevo Transactional API Key (https://app.brevo.com/settings/keys/api)
	BREVO_API_KEY: str = ""
	# Sender hiển thị, dùng cho Brevo/SMTP (nên là domain ĐÃ XÁC MINH ở Brevo)
	# Định dạng: "Tên <email@domain-verified.com>". Để trống thì fallback về SMTP.
	EMAILS_FROM: str = "AmsClubHub <no-reply@ams-club-hub-fullstack.onrender.com>"
	EMAIL_TIMEOUT_SECONDS: float = 10.0

	@property
	def DATABASE_URL(self) -> str:
		return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
