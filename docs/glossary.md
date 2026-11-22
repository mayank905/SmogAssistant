# Domain Glossary: Urban Air Quality Assistant

This glossary defines the ubiquitous language used throughout the project to ensure precision across documentation, specifications, and codebase.

---

## 1. Air Quality & Environmental Domain

| Term | Definition |
| :--- | :--- |
| **AQI (Air Quality Index)** | A standardized numerical scale used by government agencies to communicate how polluted the air currently is or how polluted it is forecast to become. |
| **PM2.5 / PM10** | Fine particulate matter with diameters $\le 2.5\,\mu\text{m}$ and $\le 10\,\mu\text{m}$ respectively. PM2.5 penetrates deep into the lungs and bloodstream, posing the primary winter smog hazard. |
| **CPCB Standards** | The Central Pollution Control Board (India) AQI standard scale: Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401-500+). |
| **Exposure Window** | Time segments during the day (e.g., early morning 5:00-8:00 AM vs. afternoon 1:00-4:00 PM) where thermal inversion and smog concentration peak or diminish. |
| **Sensitive Group / Vulnerable Profile** | Individuals with heightened vulnerability to air pollution, including infants, children, pregnant women, elderly, asthmatics, and people with cardiovascular disorders. |
| **Thermal Inversion** | Meteorological phenomenon in winter where a layer of warm air traps cooler air and pollutants near the ground, causing severe winter smog. |

---

## 2. Mitigation & Lifestyle Guidance

| Term | Definition |
| :--- | :--- |
| **Dynamic Routine Schedule** | An hour-by-hour or time-blocked schedule (exercise, commute, errands) adapted dynamically to current and forecasted AQI conditions. |
| **Morning Briefing (Up-Ahead Plan)** | A proactive early-morning digest (e.g., 6:30 AM notification or on-demand preview) that fuses current readings with 24-hour predicted weather (wind speed, temperature, humidity, inversion risk) and AQI forecasts to lay out a custom day plan. |
| **Weather-Air Fusion** | Correlating meteorological forecast variables (wind stagnation, winter cold trapping) with pollutant concentrations to anticipate when smog will clear or spike later in the day. |
| **Indoor AQ Hacks** | Low-cost, actionable interventions to purify indoor air without industrial HVAC, including phytoremediation plants (e.g., Snake Plant, Areca Palm), DIY Corsi-Rosenthal boxes, window sealing, and HEPA purifiers. |
| **Emission Offset Advice** | Recommendations that calculate both personal exposure avoidance and estimated carbon/particulate reduction (e.g., carpooling, metro/EV transit, avoiding biomass/waste burning). |
| **Actionable Justification** | Clear, quantitative and qualitative rationale accompanying every recommendation (e.g., "Shifting morning run from 6 AM to 2 PM reduces PM2.5 inhalation by 64%"). |

---

## 3. System Architecture & GenAI Terms

| Term | Definition |
| :--- | :--- |
| **Live AQI Provider** | An external live data service (such as OpenAQ, CPCB / Data.gov.in, or WAQI / World Air Quality Index API) delivering real-time ambient air metrics based on geo-coordinates or city name. |
| **Context Profile** | The user's input parameter set: location, commute mode, household demographics (children/elderly/pets), health pre-conditions, and home ventilation type. |
| **Recommendation Engine** | The GenAI-driven reasoning pipeline (orchestrated via Google Gemini) that ingests real-time environmental telemetry + user context profile and outputs structured, personalized mitigation plans. |
| **Offline Cache / Fallback Strategy** | A defensive architecture pattern ensuring the app remains fully functional and informative during external API outages or rate limits, using cached readings and deterministic rule fallbacks. |
