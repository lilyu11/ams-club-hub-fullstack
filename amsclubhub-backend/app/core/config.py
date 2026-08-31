from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	PROJECT_NAME: str = "AmsClubHub Backend"
	API_V1_STR: str = "/api/v1"
	SECRET_KEY: str
	ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

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
	RESEND_API_KEY: str = ""
	EMAILS_FROM: str = "AmsClubHub <no-reply@ams-club-hub-fullstack.onrender.com>"
	EMAIL_TIMEOUT_SECONDS: float = 10.0

	@property
	def DATABASE_URL(self) -> str:
		return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
