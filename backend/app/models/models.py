from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from .database import Base

class OutbreakRecord(Base):
    __tablename__ = "outbreaks"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    region = Column(String, index=True)
    region_hash = Column(String)
    disease = Column(String, index=True)
    cases_anonymized = Column(Integer)
    deaths = Column(Integer)
    recovered = Column(Integer)
    population = Column(Integer)
    week_of_year = Column(Integer)
    month = Column(Integer)
    is_monsoon_season = Column(Integer)
    rolling_7day_avg = Column(Float)
    rolling_30day_avg = Column(Float)

class EnvironmentalData(Base):
    __tablename__ = "environmental_data"
    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, index=True)
    date = Column(Date, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    rainfall = Column(Float)

class AlertLog(Base):
    __tablename__ = "alert_logs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    region = Column(String, index=True)
    disease = Column(String)
    severity = Column(String)
    message = Column(String)

class UserSymptomReport(Base):
    __tablename__ = "symptom_reports"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    region_hash = Column(String, index=True)
    symptoms = Column(String) # comma separated
    risk_score = Column(Float)
